import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { A2UIResponse } from '../models/a2ui.model';

export interface DashboardConfig {
  id?: number;
  name: string;
  tenantId?: string;
  layoutConfig: string; // JSON string
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private authUrl = 'http://localhost:8080/api/auth/login';
  private dashboardsUrl = 'http://localhost:8080/api/dashboards';

  // State managed via Signals
  token = signal<string | null>(localStorage.getItem('token'));
  tenantId = signal<string>(localStorage.getItem('tenantId') || 'tenant_1');
  activePage = signal<A2UIResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  localFilters = signal<Record<string, string>>({});

  // Dynamic workspaces state
  dashboards = signal<DashboardConfig[]>([]);
  activeDashboard = signal<DashboardConfig | null>(null);
  editMode = signal<boolean>(false);

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token() || localStorage.getItem('token')}`,
      'X-Tenant-ID': this.tenantId()
    });
  }

  login(username: string, password: string, tenant: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.post<{ token: string }>(this.authUrl, { username, password, tenantId: tenant })
      .subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('tenantId', tenant);
          this.token.set(res.token);
          this.tenantId.set(tenant);
          this.loading.set(false);
          this.loadDashboards();
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.error.set('Authentication failed. Please verify credentials.');
          this.loading.set(false);
        }
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    this.token.set(null);
    this.activePage.set(null);
    this.dashboards.set([]);
    this.activeDashboard.set(null);
    this.editMode.set(false);
  }

  // Workspaces API CRUD
  loadDashboards(): void {
    if (!this.token()) return;
    this.http.get<DashboardConfig[]>(this.dashboardsUrl, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.dashboards.set(res);
        },
        error: (err) => {
          console.error('Failed to load dashboards:', err);
        }
      });
  }

  createDashboard(name: string, layout: string = '[]'): Observable<DashboardConfig> {
    return this.http.post<DashboardConfig>(
      this.dashboardsUrl,
      { name, layoutConfig: layout },
      { headers: this.getHeaders() }
    );
  }

  updateDashboard(id: number, name: string, layout: string): Observable<DashboardConfig> {
    return this.http.put<DashboardConfig>(
      `${this.dashboardsUrl}/${id}`,
      { name, layoutConfig: layout },
      { headers: this.getHeaders() }
    );
  }

  deleteDashboard(id: number): Observable<any> {
    return this.http.delete(`${this.dashboardsUrl}/${id}`, { headers: this.getHeaders() });
  }
}
