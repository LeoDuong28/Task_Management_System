import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/task.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
      [attr.draggable]="true"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd($event)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              [ngClass]="{
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': task.category === 'work',
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': task.category === 'personal',
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300': task.category === 'urgent',
                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300': task.category === 'other'
              }"
            >
              {{ task.category }}
            </span>
          </div>
          <h3 class="font-semibold text-slate-900 dark:text-white truncate">{{ task.title }}</h3>
          @if (task.description) {
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ task.description }}</p>
          }
        </div>
        
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          @if (canEdit) {
            <button
              (click)="edit.emit(task)"
              class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          }
          @if (canDelete) {
            <button
              (click)="delete.emit(task)"
              class="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          }
        </div>
      </div>

      <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <span class="text-xs text-slate-400">
          {{ task.createdAt | date:'MMM d, y' }}
        </span>
        <div class="flex items-center gap-1">
          @for (i of [1,2,3]; track i) {
            <div
              class="w-1.5 h-1.5 rounded-full"
              [ngClass]="i <= task.priority ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-600'"
            ></div>
          }
        </div>
      </div>
    </div>
  `
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() canEdit = false;
  @Input() canDelete = false;
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() dragStarted = new EventEmitter<Task>();
  @Output() dragEnded = new EventEmitter<void>();

  onDragStart(event: DragEvent) {
    event.dataTransfer?.setData('taskId', this.task.id);
    event.dataTransfer?.setData('taskStatus', this.task.status);
    this.dragStarted.emit(this.task);
  }

  onDragEnd(event: DragEvent) {
    this.dragEnded.emit();
  }
}
