import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { A2UIResponse } from '../models/a2ui.model';

export interface MetricDefinition {
  id: string;
  displayName: string;
  category: 'FINANCIAL' | 'SUBSCRIBER_LIFECYCLE' | 'NETWORK_QOS' | 'USAGE_VOLUME' | 'CUSTOM';
  description: string;
  sqlFormula: string;
  baseTable: string;
  compatibleDimensions: string[];
  unit: { label: string; symbol: string };
  targetBenchmark: number;
  keywords: string[];
}

export interface DimensionDefinition {
  name: string;
  displayName: string;
  column: string;
  table: string;
  type: string;
  sampleValues: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SemanticService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/semantic';

  metrics = signal<MetricDefinition[]>([]);
  dimensions = signal<DimensionDefinition[]>([]);
  isLoading = signal<boolean>(false);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || 'tenant_1';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    });
  }

  fetchMetrics(): Observable<MetricDefinition[]> {
    this.isLoading.set(true);
    return this.http.get<MetricDefinition[]>(`${this.baseUrl}/metrics`, { headers: this.getHeaders() })
      .pipe(
        tap({
          next: list => {
            this.metrics.set(list);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        })
      );
  }

  fetchDimensions(): Observable<DimensionDefinition[]> {
    return this.http.get<DimensionDefinition[]>(`${this.baseUrl}/dimensions`, { headers: this.getHeaders() })
      .pipe(
        tap(list => this.dimensions.set(list))
      );
  }

  executeMetric(metricId: string, dimension?: string): Observable<A2UIResponse> {
    return this.http.post<A2UIResponse>(
      `${this.baseUrl}/query`,
      { metricId, dimension },
      { headers: this.getHeaders()}
    );
  }

  executeOlapQuery(req: {
    tableName: string;
    measureCol: string;
    aggFunc?: string;
    groupByCol?: string;
    filterCol?: string;
    filterVal?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/olap-query`, req, { headers: this.getHeaders() });
  }
}
