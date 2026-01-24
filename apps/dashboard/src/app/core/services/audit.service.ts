import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);

  private logsSignal = signal<AuditLog[]>([]);
  private loadingSignal = signal(false);

  logs = this.logsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  loadLogs(limit = 100): Observable<ApiResponse<AuditLog[]>> {
    this.loadingSignal.set(true);
    return this.http
      .get<ApiResponse<AuditLog[]>>(`${environment.apiUrl}/audit-log?limit=${limit}`)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.logsSignal.set(res.data);
          }
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }
}
