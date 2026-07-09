import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { A2UIResponse } from '../models/a2ui.model';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/analytics';

  postQuery(queryText: string): Observable<A2UIResponse> {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || 'tenant_1';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    });

    return this.http.post<A2UIResponse>(`${this.baseUrl}/query`, { query: queryText }, { headers });
  }
}
