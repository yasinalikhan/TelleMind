import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface TelcoActionOption {
  actionId: string;
  actionType: string;
  label: string;
  description: string;
  buttonStyle: string;
  payload?: Record<string, any>;
}

export interface TelcoAnomaly {
  id: string;
  metricId: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  region: string;
  tower: string;
  baselineValue: number;
  anomalyValue: number;
  deviationPercent: number;
  detectedAt: string;
  rootCauseAnalysis: string;
  evidencePoints: string[];
  recommendedActions: TelcoActionOption[];
  status: 'OPEN' | 'ACTION_TAKEN' | 'RESOLVED';
}

export interface ActionExecutionRecord {
  executionId: string;
  anomalyId: string;
  actionType: string;
  actionLabel: string;
  target: string;
  status: string;
  operatorTenant: string;
  triggeredBy: string;
  timestamp: string;
  resultSummary: string;
  outputMetadata?: Record<string, any>;
}

export interface ActionExecutionRequest {
  anomalyId: string;
  actionType: string;
  actionLabel?: string;
  parameters?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class AutonomousService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/autonomous';

  anomalies = signal<TelcoAnomaly[]>([]);
  actionHistory = signal<ActionExecutionRecord[]>([]);
  selectedAnomaly = signal<TelcoAnomaly | null>(null);
  isScanning = signal<boolean>(false);
  isExecuting = signal<boolean>(false);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || 'tenant_1';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    });
  }

  fetchAnomalies(): Observable<TelcoAnomaly[]> {
    this.isScanning.set(true);
    return this.http.get<TelcoAnomaly[]>(`${this.baseUrl}/anomalies`, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (res) => {
          this.anomalies.set(res);
          if (!this.selectedAnomaly() && res.length > 0) {
            this.selectedAnomaly.set(res[0]);
          } else if (this.selectedAnomaly()) {
            const updated = res.find(a => a.id === this.selectedAnomaly()?.id);
            if (updated) this.selectedAnomaly.set(updated);
          }
          this.isScanning.set(false);
        },
        error: () => this.isScanning.set(false)
      })
    );
  }

  triggerScan(): Observable<TelcoAnomaly[]> {
    this.isScanning.set(true);
    return this.http.post<TelcoAnomaly[]>(`${this.baseUrl}/scan`, {}, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (res) => {
          this.anomalies.set(res);
          if (res.length > 0) {
            this.selectedAnomaly.set(res[0]);
          }
          this.isScanning.set(false);
        },
        error: () => this.isScanning.set(false)
      })
    );
  }

  executeAction(
    anomalyId: string,
    actionType: string,
    actionLabel: string,
    parameters?: Record<string, any>
  ): Observable<ActionExecutionRecord> {
    this.isExecuting.set(true);
    const body: ActionExecutionRequest = {
      anomalyId,
      actionType,
      actionLabel,
      parameters
    };

    return this.http.post<ActionExecutionRecord>(`${this.baseUrl}/actions/execute`, body, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        next: (rec) => {
          this.isExecuting.set(false);
          // Update anomaly status in local signal
          this.anomalies.update(list => list.map(a => {
            if (a.id === anomalyId) {
              return { ...a, status: 'ACTION_TAKEN' as const };
            }
            return a;
          }));
          if (this.selectedAnomaly()?.id === anomalyId) {
            this.selectedAnomaly.update(curr => curr ? { ...curr, status: 'ACTION_TAKEN' as const } : null);
          }
          // Prepend record to actionHistory signal
          this.actionHistory.update(hist => [rec, ...hist]);
        },
        error: () => this.isExecuting.set(false)
      })
    );
  }

  fetchActionHistory(): Observable<ActionExecutionRecord[]> {
    return this.http.get<ActionExecutionRecord[]>(`${this.baseUrl}/actions/history`, {
      headers: this.getHeaders()
    }).pipe(
      tap((res) => this.actionHistory.set(res))
    );
  }
}
