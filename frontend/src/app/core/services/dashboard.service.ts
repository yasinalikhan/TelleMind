import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { A2UIResponse } from '../models/a2ui.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private authUrl = 'http://localhost:8080/api/auth/login';

  // State managed via Signals
  token = signal<string | null>(localStorage.getItem('token'));
  tenantId = signal<string>(localStorage.getItem('tenantId') || 'tenant_1');
  activePage = signal<A2UIResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  localFilters = signal<Record<string, string>>({});

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
  }
}
