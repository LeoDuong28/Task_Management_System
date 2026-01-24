import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  category: 'work' | 'personal' | 'urgent' | 'other';
  priority: number;
  createdById: string;
  organizationId: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  category?: string;
  priority?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSignal = signal<Task[]>([]);
  private loadingSignal = signal(false);
  private filterStatusSignal = signal<string | null>(null);
  private filterCategorySignal = signal<string | null>(null);
  private searchTermSignal = signal('');

  tasks = this.tasksSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  filteredTasks = computed(() => {
    let result = this.tasksSignal();
    
    const status = this.filterStatusSignal();
    if (status) {
      result = result.filter(t => t.status === status);
    }

    const category = this.filterCategorySignal();
    if (category) {
      result = result.filter(t => t.category === category);
    }

    const search = this.searchTermSignal().toLowerCase();
    if (search) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search)
      );
    }

    return result;
  });

  tasksByStatus = computed(() => {
    const tasks = this.filteredTasks();
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      done: tasks.filter(t => t.status === 'done')
    };
  });

  stats = computed(() => {
    const tasks = this.tasksSignal();
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) 
        : 0
    };
  });

  constructor(private http: HttpClient) {}

  setStatusFilter(status: string | null) {
    this.filterStatusSignal.set(status);
  }

  setCategoryFilter(category: string | null) {
    this.filterCategorySignal.set(category);
  }

  setSearchTerm(term: string) {
    this.searchTermSignal.set(term);
  }

  loadTasks(status?: string, category?: string) {
    this.loadingSignal.set(true);
    
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (category) params = params.set('category', category);

    return this.http.get<Task[]>(`${environment.apiUrl}/tasks`, { params })
      .pipe(
        tap(tasks => {
          this.tasksSignal.set(tasks);
          this.loadingSignal.set(false);
        })
      );
  }

  createTask(task: CreateTaskDto) {
    return this.http.post<Task>(`${environment.apiUrl}/tasks`, task)
      .pipe(
        tap(newTask => {
          this.tasksSignal.update(tasks => [newTask, ...tasks]);
        })
      );
  }

  updateTask(id: string, updates: Partial<Task>) {
    return this.http.put<Task>(`${environment.apiUrl}/tasks/${id}`, updates)
      .pipe(
        tap(updated => {
          this.tasksSignal.update(tasks => 
            tasks.map(t => t.id === id ? updated : t)
          );
        })
      );
  }

  deleteTask(id: string) {
    return this.http.delete(`${environment.apiUrl}/tasks/${id}`)
      .pipe(
        tap(() => {
          this.tasksSignal.update(tasks => tasks.filter(t => t.id !== id));
        })
      );
  }

  reorderTasks(taskIds: string[]) {
    return this.http.post<Task[]>(`${environment.apiUrl}/tasks/reorder`, { taskIds })
      .pipe(
        tap(() => {
          this.loadTasks().subscribe();
        })
      );
  }
}
