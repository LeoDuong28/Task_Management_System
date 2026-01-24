import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { TaskCardComponent } from '../../components/task-card/task-card.component';
import { TaskModalComponent } from '../../components/task-modal/task-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskCardComponent, TaskModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors" [class.dark]="darkMode()">
      <nav class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"></div>
              <span class="text-xl font-bold text-slate-900 dark:text-white">TaskFlow</span>
            </div>
            <div class="flex items-center gap-4">
              <button (click)="toggleDarkMode()" class="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                @if (darkMode()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                }
              </button>
              <div class="flex items-center gap-3">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-medium text-slate-900 dark:text-white">{{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 capitalize">{{ authService.user()?.role }}</p>
                </div>
                <button (click)="authService.logout()" class="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p class="text-sm text-slate-500 dark:text-slate-400">Total Tasks</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ taskService.stats().total }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p class="text-sm text-slate-500 dark:text-slate-400">To Do</p>
            <p class="text-2xl font-bold text-blue-600">{{ taskService.stats().todo }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p class="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
            <p class="text-2xl font-bold text-amber-600">{{ taskService.stats().inProgress }}</p>
          </div>
          <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p class="text-sm text-slate-500 dark:text-slate-400">Completed</p>
            <p class="text-2xl font-bold text-green-600">{{ taskService.stats().done }}</p>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input type="text" [ngModel]="searchTerm" (ngModelChange)="onSearch($event)" placeholder="Search tasks..."
                class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"/>
            </div>
            <div class="flex gap-2">
              <select [ngModel]="categoryFilter" (ngModelChange)="onCategoryFilter($event)"
                class="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="urgent">Urgent</option>
                <option value="other">Other</option>
              </select>
              @if (authService.hasPermission('create_task')) {
                <button (click)="openCreateModal()" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span class="hidden sm:inline">Add Task</span>
                </button>
              }
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (column of columns; track column.status) {
            <div class="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4"
              (dragover)="onDragOver($event)" (drop)="onDrop($event, column.status)">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full" [ngClass]="column.color"></div>
                <h3 class="font-semibold text-slate-700 dark:text-slate-300">{{ column.title }}</h3>
                <span class="ml-auto text-sm text-slate-500 dark:text-slate-400">{{ getTasksByStatus(column.status).length }}</span>
              </div>
              <div class="space-y-3 min-h-[200px]">
                @for (task of getTasksByStatus(column.status); track task.id) {
                  <app-task-card
                    [task]="task"
                    [canEdit]="authService.hasPermission('update_task')"
                    [canDelete]="authService.hasPermission('delete_task')"
                    (edit)="openEditModal($event)"
                    (delete)="deleteTask($event)"/>
                } @empty {
                  <div class="text-center py-8 text-slate-400 dark:text-slate-500">
                    <p class="text-sm">No tasks</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </main>

      <app-task-modal
        [isOpen]="modalOpen()"
        [task]="selectedTask()"
        (close)="closeModal()"
        (save)="saveTask($event)"/>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  darkMode = signal(false);
  modalOpen = signal(false);
  selectedTask = signal<Task | null>(null);
  searchTerm = '';
  categoryFilter = '';

  columns = [
    { status: 'todo', title: 'To Do', color: 'bg-blue-500' },
    { status: 'in_progress', title: 'In Progress', color: 'bg-amber-500' },
    { status: 'done', title: 'Done', color: 'bg-green-500' }
  ];

  constructor(
    public taskService: TaskService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.taskService.loadTasks().subscribe();
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      this.darkMode.set(savedTheme === 'true');
    }
  }

  toggleDarkMode() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', this.darkMode().toString());
  }

  getTasksByStatus(status: string) {
    return this.taskService.filteredTasks().filter(t => t.status === status);
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.taskService.setSearchTerm(term);
  }

  onCategoryFilter(category: string) {
    this.categoryFilter = category;
    this.taskService.setCategoryFilter(category || null);
  }

  openCreateModal() {
    this.selectedTask.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(task: Task) {
    this.selectedTask.set(task);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
    this.selectedTask.set(null);
  }

  saveTask(data: any) {
    const task = this.selectedTask();
    if (task) {
      this.taskService.updateTask(task.id, data).subscribe(() => this.closeModal());
    } else {
      this.taskService.createTask(data).subscribe(() => this.closeModal());
    }
  }

  deleteTask(task: Task) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(task.id).subscribe();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, newStatus: string) {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('taskId');
    if (taskId) {
      this.taskService.updateTask(taskId, { status: newStatus as any }).subscribe();
    }
  }
}
