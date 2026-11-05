import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { A2UIComponent, A2UIResponse } from '../models/a2ui.model';

export interface DashboardConfig {
  id?: number;
  name: string;
  tenantId?: string;
  layoutConfig: string; // JSON string of A2UIComponent[]
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

  constructor() {
    // 1. Instantly load cached workspaces from localStorage to avoid any blank flicker on reload/restart
    const initial = this.getInitialWorkspaces();
    this.dashboards.set(initial);
    this.restoreActiveWorkspace();
  }

  // ==========================================
  // STORAGE KEYS & LOCAL PERSISTENCE HELPERS
  // ==========================================
  private getStorageKey(): string {
    return `telemind_workspaces_${this.tenantId()}`;
  }

  private getActiveIdKey(): string {
    return `telemind_active_workspace_id_${this.tenantId()}`;
  }

  private getStoredWorkspaces(): DashboardConfig[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached workspaces from localStorage:', e);
    }
    return [];
  }

  private saveToStorage(list: DashboardConfig[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to write workspaces to localStorage:', e);
    }
  }

  public getStoredActiveWorkspaceId(): number | null {
    try {
      const val = localStorage.getItem(this.getActiveIdKey());
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  public setStoredActiveWorkspaceId(id: number | null): void {
    if (id !== null && id !== undefined) {
      localStorage.setItem(this.getActiveIdKey(), id.toString());
    } else {
      localStorage.removeItem(this.getActiveIdKey());
    }
  }

  // ==========================================
  // DEFAULT PRE-SEEDED TELECOM WORKSPACES
  // ==========================================
  private getDefaultSeedWorkspaces(): DashboardConfig[] {
    return [
      {
        id: 1,
        name: 'Executive Telecom Operations & KPI Dashboard',
        tenantId: this.tenantId(),
        layoutConfig: JSON.stringify([
          {
            id: 'comp_revenue_trend',
            type: 'chart',
            props: {
              chartType: 'line',
              title: 'Daily Revenue Trend (AFN)',
              xAxis: 'date',
              yAxis: 'amount',
              colSpan: 6,
              widgetHeight: 340,
              data: [
                { date: '2026-06-08', amount: 5200.00 },
                { date: '2026-06-15', amount: 7400.00 },
                { date: '2026-06-22', amount: 8300.00 },
                { date: '2026-06-29', amount: 9100.00 },
                { date: '2026-07-08', amount: 10500.00 }
              ]
            }
          },
          {
            id: 'comp_regional_rev',
            type: 'chart',
            props: {
              chartType: 'bar',
              title: 'Regional Revenue Comparison',
              xAxis: 'region',
              yAxis: 'amount',
              colSpan: 6,
              widgetHeight: 340,
              data: [
                { region: 'Kabul', amount: 29800.00 },
                { region: 'Herat', amount: 18900.00 },
                { region: 'Mazar-e-Sharif', amount: 22500.00 },
                { region: 'Jalalabad', amount: 16400.00 },
                { region: 'Kandahar', amount: 14200.00 }
              ]
            }
          },
          {
            id: 'comp_traffic_mix',
            type: 'chart',
            props: {
              chartType: 'stacked_bar',
              title: 'Traffic Mix: Data (MB) vs Voice (Mins)',
              xAxis: 'region',
              colSpan: 6,
              widgetHeight: 340,
              data: [
                { region: 'Kabul', data_mb: 41200, voice_minutes: 4650 },
                { region: 'Herat', data_mb: 19900, voice_minutes: 2250 },
                { region: 'Mazar-e-Sharif', data_mb: 21800, voice_minutes: 2470 },
                { region: 'Kandahar', data_mb: 15700, voice_minutes: 1690 },
                { region: 'Jalalabad', data_mb: 14700, voice_minutes: 1620 }
              ]
            }
          },
          {
            id: 'comp_plan_share',
            type: 'chart',
            props: {
              chartType: 'donut',
              title: 'Subscriber Tariff Plan Share',
              labelKey: 'plan',
              valueKey: 'count',
              colSpan: 6,
              widgetHeight: 340,
              data: [
                { plan: 'Prepaid Monthly', count: 450 },
                { plan: 'Postpaid Unlimited', count: 280 },
                { plan: 'Postpaid Corporate', count: 190 },
                { plan: 'Prepaid Daily', count: 120 }
              ]
            }
          },
          {
            id: 'comp_sla_gauge',
            type: 'chart',
            props: {
              chartType: 'gauge',
              title: 'Core SLA Network Health Target',
              valueKey: 'value',
              colSpan: 4,
              widgetHeight: 300,
              data: [{ value: 94.6 }]
            }
          },
          {
            id: 'comp_radar_profile',
            type: 'chart',
            props: {
              chartType: 'radar',
              title: 'Operational Radar Assessment',
              colSpan: 4,
              widgetHeight: 300,
              data: [
                { category: 'Coverage', score: 92 },
                { category: 'Throughput', score: 88 },
                { category: 'Latency', score: 95 },
                { category: 'Voice Quality', score: 90 },
                { category: 'SLA Uptime', score: 97 }
              ]
            }
          },
          {
            id: 'comp_sparkline_rev',
            type: 'chart',
            props: {
              chartType: 'sparkline',
              title: 'Weekly Revenue Velocity Scorecard',
              colSpan: 4,
              widgetHeight: 300,
              data: [
                { day: 'Mon', value: 5200 },
                { day: 'Tue', value: 6100 },
                { day: 'Wed', value: 5800 },
                { day: 'Thu', value: 6500 },
                { day: 'Fri', value: 7100 },
                { day: 'Sat', value: 7500 },
                { day: 'Sun', value: 8200 }
              ]
            }
          }
        ]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Network Infrastructure & Tower Telemetry',
        tenantId: this.tenantId(),
        layoutConfig: JSON.stringify([
          {
            id: 'comp_tower_heat',
            type: 'chart',
            props: {
              chartType: 'heatmap',
              title: 'Cell Tower Congestion Matrix',
              colSpan: 6,
              widgetHeight: 360,
              data: [
                { region: 'Kabul', tower: 'KBL-TWR-01', data_mb: 12500 },
                { region: 'Kabul', tower: 'KBL-TWR-02', data_mb: 18900 },
                { region: 'Herat', tower: 'HRT-TWR-01', data_mb: 8700 },
                { region: 'Mazar-e-Sharif', tower: 'MZR-TWR-01', data_mb: 7500 }
              ]
            }
          },
          {
            id: 'comp_sla_bullet',
            type: 'chart',
            props: {
              chartType: 'bullet',
              title: 'Core SLA Benchmark Bands',
              colSpan: 6,
              widgetHeight: 360,
              data: [
                { kpi_name: 'RAN Availability', metric_value: 99.4, target_value: 99.9 },
                { kpi_name: 'Packet Drop Rate', metric_value: 0.4, target_value: 0.2 }
              ]
            }
          },
          {
            id: 'comp_traffic_sankey',
            type: 'chart',
            props: {
              chartType: 'sankey',
              title: 'Access to Core Network Routing Flow',
              colSpan: 12,
              widgetHeight: 340,
              data: [
                { source: 'Kabul Node', target: 'Data Center 1', value: 18000 },
                { source: 'Herat Node', target: 'Data Center 1', value: 9500 },
                { source: 'Mazar Node', target: 'Data Center 2', value: 8200 }
              ]
            }
          }
        ]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  private getInitialWorkspaces(): DashboardConfig[] {
    const stored = this.getStoredWorkspaces();
    if (stored && stored.length > 0) {
      return stored;
    }
    const defaults = this.getDefaultSeedWorkspaces();
    this.saveToStorage(defaults);
    return defaults;
  }

  // ==========================================
  // ACTIVE WORKSPACE RESTORATION
  // ==========================================
  public restoreActiveWorkspace(): DashboardConfig | null {
    const list = this.dashboards();
    if (!list || list.length === 0) return null;

    const storedId = this.getStoredActiveWorkspaceId();
    let target = storedId ? list.find(d => d.id === storedId) : undefined;
    if (!target) {
      target = list[0];
    }

    if (target) {
      this.activeDashboard.set(target);
      if (target.id) {
        this.setStoredActiveWorkspaceId(target.id);
      }
      try {
        const comps = JSON.parse(target.layoutConfig) as A2UIComponent[];
        this.activePage.set({
          version: '1.0.0',
          page: {
            title: target.name,
            layout: 'grid',
            components: comps
          },
          actions: []
        });
      } catch (e) {
        console.error('Failed to parse dashboard layoutConfig:', e);
      }
      return target;
    }
    return null;
  }

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
          // Reload workspaces for the authenticated tenant
          const tenantWorkspaces = this.getInitialWorkspaces();
          this.dashboards.set(tenantWorkspaces);
          this.restoreActiveWorkspace();
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

  // ==========================================
  // WORKSPACES CRUD (DATABASE + LOCAL STORAGE)
  // ==========================================
  loadDashboards(): void {
    if (!this.token()) {
      this.restoreActiveWorkspace();
      return;
    }

    this.http.get<DashboardConfig[]>(this.dashboardsUrl, { headers: this.getHeaders() })
      .subscribe({
        next: (backendDashboards) => {
          if (backendDashboards && backendDashboards.length > 0) {
            this.dashboards.set(backendDashboards);
            this.saveToStorage(backendDashboards);
            this.restoreActiveWorkspace();
          } else {
            // DB is empty or fresh restart - sync cached local workspaces to backend DB
            const local = this.getStoredWorkspaces();
            if (local && local.length > 0) {
              this.dashboards.set(local);
              this.restoreActiveWorkspace();
              for (const ws of local) {
                this.http.post<DashboardConfig>(
                  `${this.dashboardsUrl}/save`,
                  { name: ws.name, layoutConfig: ws.layoutConfig },
                  { headers: this.getHeaders() }
                ).subscribe({
                  next: (saved) => {
                    ws.id = saved.id;
                    this.saveToStorage(this.dashboards());
                  }
                });
              }
            } else {
              // Seed defaults into DB
              const defaults = this.getDefaultSeedWorkspaces();
              this.dashboards.set(defaults);
              this.saveToStorage(defaults);
              this.restoreActiveWorkspace();
              for (const ws of defaults) {
                this.http.post<DashboardConfig>(
                  `${this.dashboardsUrl}/save`,
                  { name: ws.name, layoutConfig: ws.layoutConfig },
                  { headers: this.getHeaders() }
                ).subscribe();
              }
            }
          }
        },
        error: (err) => {
          console.warn('Backend unavailable, using persistent localStorage cache:', err);
          const local = this.getStoredWorkspaces();
          if (local && local.length > 0) {
            this.dashboards.set(local);
          } else {
            const defaults = this.getDefaultSeedWorkspaces();
            this.dashboards.set(defaults);
            this.saveToStorage(defaults);
          }
          this.restoreActiveWorkspace();
        }
      });
  }

  createDashboard(name: string, layout: string = '[]'): Observable<DashboardConfig> {
    return this.saveWorkspace(name, layout);
  }

  updateDashboard(id: number, name: string, layout: string): Observable<DashboardConfig> {
    return this.saveWorkspace(name, layout, id);
  }

  saveWorkspace(name: string, layout: string, id?: number): Observable<DashboardConfig> {
    const payload: any = { name, layoutConfig: layout };
    if (id) {
      payload.id = id;
    }

    return new Observable<DashboardConfig>(subscriber => {
      this.http.post<DashboardConfig>(
        `${this.dashboardsUrl}/save`,
        payload,
        { headers: this.getHeaders() }
      ).subscribe({
        next: (savedDb) => {
          this.updateDashboardInStateAndStorage(savedDb);
          subscriber.next(savedDb);
          subscriber.complete();
        },
        error: (err) => {
          console.warn('Backend save failed; saving to localStorage to ensure zero data loss:', err);
          const fallbackDb: DashboardConfig = {
            id: id || Date.now(),
            name,
            layoutConfig: layout,
            tenantId: this.tenantId(),
            updatedAt: new Date().toISOString()
          };
          this.updateDashboardInStateAndStorage(fallbackDb);
          subscriber.next(fallbackDb);
          subscriber.complete();
        }
      });
    });
  }

  private updateDashboardInStateAndStorage(saved: DashboardConfig) {
    const list = [...this.dashboards()];
    const index = list.findIndex(d => (saved.id && d.id === saved.id) || d.name === saved.name);
    if (index >= 0) {
      list[index] = saved;
    } else {
      list.push(saved);
    }
    this.dashboards.set(list);
    this.saveToStorage(list);
    this.activeDashboard.set(saved);
    if (saved.id) {
      this.setStoredActiveWorkspaceId(saved.id);
    }
  }

  deleteDashboard(id: number): Observable<any> {
    return new Observable(subscriber => {
      // Remove from state & localStorage immediately
      const list = this.dashboards().filter(d => d.id !== id);
      this.dashboards.set(list);
      this.saveToStorage(list);

      if (this.getStoredActiveWorkspaceId() === id) {
        const nextActiveId = list.length > 0 ? (list[0].id || null) : null;
        this.setStoredActiveWorkspaceId(nextActiveId);
      }

      this.http.delete(`${this.dashboardsUrl}/${id}`, { headers: this.getHeaders() }).subscribe({
        next: (res) => {
          subscriber.next(res);
          subscriber.complete();
        },
        error: (err) => {
          console.warn('Backend delete failed, item deleted locally:', err);
          subscriber.next({ message: 'Deleted locally' });
          subscriber.complete();
        }
      });
    });
  }
}
