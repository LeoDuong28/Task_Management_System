import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskStatus, ApiResponse } from '../models';

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: string;
  category?: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: string;
  category?: string;
  order?: number;
  dueDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  private tasksSignal = signal<Task[]>([]);
  private loadingSignal = signal(false);

  tasks = this.tasksSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  loadTasks(): Observable<ApiResponse<Task[]>> {
    this.loadingSignal.set(true);
    return this.http.get<ApiResponse<Task[]>>(`${environment.apiUrl}/tasks`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.tasksSignal.set(res.data);
        }
      }),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  createTask(dto: CreateTaskDto): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(`${environment.apiUrl}/tasks`, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.tasksSignal.update((tasks) => [...tasks, res.data!]);
        }
      })
    );
  }

  updateTask(id: string, dto: UpdateTaskDto): Observable<ApiResponse<Task>> {
    return this.http
      .put<ApiResponse<Task>>(`${environment.apiUrl}/tasks/${id}`, dto)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.tasksSignal.update((tasks) =>
              tasks.map((t) => (t.id === id ? res.data! : t))
            );
          }
        })
      );
  }

  deleteTask(id: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${environment.apiUrl}/tasks/${id}`)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.tasksSignal.update((tasks) => tasks.filter((t) => t.id !== id));
          }
        })
      );
  }

  reorderTask(
    taskId: string,
    newOrder: number,
    newStatus: TaskStatus
  ): Observable<ApiResponse<Task[]>> {
    return this.http
      .put<ApiResponse<Task[]>>(`${environment.apiUrl}/tasks/${taskId}/reorder`, {
        order: newOrder,
        status: newStatus,
      })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.tasksSignal.set(res.data);
          }
        })
      );
  }

}
