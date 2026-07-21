import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CustomDataset {
  id: number;
  tableName: string;
  originalFilename: string;
  tenantId: string;
  rowCount: number;
  schemaJson: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/datasets';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'X-Tenant-ID': localStorage.getItem('tenantId') || 'tenant_1'
    });
  }

  getDatasets(): Observable<CustomDataset[]> {
    return this.http.get<CustomDataset[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  getDatasetPreview(id: number): Observable<{ dataset: CustomDataset; preview: any[] }> {
    return this.http.get<{ dataset: CustomDataset; preview: any[] }>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  uploadDataset(file: File): Observable<CustomDataset> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Do not set Content-Type so browser sets boundary multipart headers
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'X-Tenant-ID': localStorage.getItem('tenantId') || 'tenant_1'
    });
    return this.http.post<CustomDataset>(`${this.baseUrl}/upload`, formData, { headers });
  }

  deleteDataset(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
