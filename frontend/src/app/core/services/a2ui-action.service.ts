import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { A2UIAction, A2UIResponse } from '../models/a2ui.model';
import { DashboardService } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class A2UIActionService {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);

  // Stream of dynamic page changes for dashboard updates
  private pageUpdateSubject = new Subject<A2UIResponse>();
  pageUpdates$ = this.pageUpdateSubject.asObservable();

  handleAction(action: A2UIAction, contextValue?: string): void {
    console.log('A2UI Action Triggered:', action, 'Context Value:', contextValue);
    
    // Resolve the parameter. If contextValue is provided, it overrides the static action parameter.
    const resolvedParam = contextValue ? contextValue : action.parameter;

    switch (action.type) {
      case 'DRILL_DOWN':
        this.executeDrillDown(action.target, resolvedParam);
        break;
      case 'FILTER_DATA':
        console.log(`Filtering local data for target ${action.target} with:`, resolvedParam);
        this.dashboardService.localFilters.update(filters => ({
          ...filters,
          [action.target]: resolvedParam
        }));
        break;
      case 'CALL_API':
        this.executeCallApi(action.target, resolvedParam);
        break;
      case 'EXPORT_DATA':
        this.exportData(resolvedParam);
        break;
      case 'REFRESH':
        window.location.reload();
        break;
      default:
        console.warn('Unhandled A2UI Action Type:', action.type);
    }
  }

  private executeDrillDown(target: string, value: string): void {
    console.log(`Executing drill-down to ${target} for value: ${value}`);
    
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || 'tenant_1';
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    });

    // Request drill-down context from backend
    this.http.get<A2UIResponse>(`http://localhost:8080/api/analytics/drill-down?region=${encodeURIComponent(value)}`, { headers })
      .subscribe({
        next: (response) => {
          this.pageUpdateSubject.next(response);
        },
        error: (err) => {
          console.error('Failed to retrieve drill-down records:', err);
        }
      });
  }

  private executeCallApi(target: string, parameter: string): void {
    console.log(`Calling custom api URL ${target} with:`, parameter);
  }

  private exportData(dataStrOrObj: any): void {
    console.log('Exporting data...');
    try {
      let data = dataStrOrObj;
      if (typeof dataStrOrObj === 'string') {
        data = JSON.parse(dataStrOrObj);
      }
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('Export payload is empty or not an array.');
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(v => {
          const str = String(v).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      );
      
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `telecom_analytics_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Data CSV export failure:', e);
    }
  }
}
