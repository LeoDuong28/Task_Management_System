import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../services/task.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" (click)="close.emit()"></div>
          <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">
                  {{ task ? 'Edit Task' : 'Create Task' }}
                </h2>
                <button (click)="close.emit()" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <form (ngSubmit)="onSubmit()" class="space-y-5">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                  <input type="text" [(ngModel)]="title" name="title" required
                    class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter task title"/>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea [(ngModel)]="description" name="description" rows="3"
                    class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Enter description"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <select [(ngModel)]="category" name="category"
                      class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="urgent">Urgent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                    <select [(ngModel)]="status" name="status"
                      class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                  <div class="flex items-center gap-4">
                    @for (level of [1, 2, 3]; track level) {
                      <button type="button" (click)="priority = level"
                        class="flex items-center gap-2 px-4 py-2 rounded-lg border transition"
                        [ngClass]="priority === level ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'">
                        @for (i of [1,2,3]; track i) {
                          <div class="w-2 h-2 rounded-full" [ngClass]="i <= level ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'"></div>
                        }
                      </button>
                    }
                  </div>
                </div>
                <div class="flex justify-end gap-3 pt-4">
                  <button type="button" (click)="close.emit()" class="px-5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                  <button type="submit" [disabled]="loading()" class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50">
                    {{ task ? 'Update' : 'Create' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class TaskModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() task: Task | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  title = '';
  description = '';
  category = 'other';
  status = 'todo';
  priority = 1;
  loading = signal(false);

  ngOnChanges() {
    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description || '';
      this.category = this.task.category;
      this.status = this.task.status;
      this.priority = this.task.priority;
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.category = 'other';
    this.status = 'todo';
    this.priority = 1;
  }

  onSubmit() {
    if (!this.title.trim()) return;
    this.save.emit({
      title: this.title,
      description: this.description,
      category: this.category,
      status: this.status,
      priority: this.priority
    });
  }
}
