import { Component, inject, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { AuthService } from "../../core/services/auth.service";
import { TaskService, CreateTaskDto } from "../../core/services/task.service";
import { ThemeService } from "../../core/services/theme.service";
import { AuditService } from "../../core/services/audit.service";
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  Permission,
  Role,
} from "../../core/models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropListGroup, CdkDropList, CdkDrag],
  template: `
    <div class="min-h-screen bg-surface-50 dark:bg-surface-900">
      <header
        class="sticky top-0 z-40 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <img
                src="assets/logo.png"
                alt="Leo Duong"
                class="h-10 w-10 object-contain" />
              <div>
                <h1
                  class="text-lg font-display font-bold text-surface-900 dark:text-white">
                  Leo Duong's Tasks Management
                </h1>
                <p class="text-xs text-surface-500 dark:text-surface-400">
                  {{ authService.user()?.name }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="badge" [class]="getRoleBadgeClass()">
                {{ authService.user()?.role | uppercase }}
              </span>

              <button
                (click)="themeService.toggleTheme()"
                class="btn btn-ghost p-2">
                @if (themeService.isDarkMode()) {
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                } @else {
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                }
              </button>

              @if (canViewAudit()) {
              <button
                (click)="toggleAuditPanel()"
                class="btn btn-ghost p-2"
                title="Audit Logs">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              }

              <button (click)="authService.logout()" class="btn btn-secondary">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2
              class="text-2xl font-display font-bold text-surface-900 dark:text-white">
              Task Board
            </h2>
            <p class="text-surface-500 dark:text-surface-400 mt-1">
              {{ taskService.tasks().length }} tasks total
            </p>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="relative flex-1 sm:flex-none">
              <select
                [(ngModel)]="filterCategory"
                class="input pr-10 appearance-none">
                <option value="">All Categories</option>
                @for (cat of categories; track cat) {
                <option [value]="cat">{{ cat | titlecase }}</option>
                }
              </select>
              <svg
                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            @if (canCreateTask()) {
            <button (click)="showCreateModal.set(true)" class="btn btn-primary">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" cdkDropListGroup>
          @for (column of columns; track column.status) {
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span [class]="'w-3 h-3 rounded-full ' + column.color"></span>
                <h3
                  class="font-semibold text-surface-700 dark:text-surface-200">
                  {{ column.title }}
                </h3>
              </div>
              <span class="text-sm text-surface-400">{{
                getFilteredTasks(column.status).length
              }}</span>
            </div>

            <div
              cdkDropList
              [cdkDropListData]="getFilteredTasks(column.status)"
              [id]="column.status"
              [cdkDropListConnectedTo]="columnIds"
              (cdkDropListDropped)="drop($event)"
              class="flex-1 min-h-[200px] bg-surface-100/50 dark:bg-surface-800/50 rounded-2xl p-3 space-y-3">
              @for (task of getFilteredTasks(column.status); track task.id) {
              <div
                cdkDrag
                [cdkDragDisabled]="!canUpdateTask()"
                class="card cursor-grab active:cursor-grabbing hover:shadow-elevated transition-shadow duration-200">
                <div class="flex items-start justify-between gap-2 mb-3">
                  <span
                    [class]="'badge ' + getPriorityBadgeClass(task.priority)">
                    {{ task.priority }}
                  </span>
                  <div class="flex items-center gap-1">
                    @if (canUpdateTask()) {
                    <button
                      (click)="editTask(task)"
                      class="p-1 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    } @if (canDeleteTask()) {
                    <button
                      (click)="deleteTask(task.id)"
                      class="p-1 text-surface-400 hover:text-red-500">
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    }
                  </div>
                </div>

                <h4 class="font-medium text-surface-900 dark:text-white mb-2">
                  {{ task.title }}
                </h4>

                @if (task.description) {
                <p
                  class="text-sm text-surface-500 dark:text-surface-400 mb-3 line-clamp-2">
                  {{ task.description }}
                </p>
                }

                <div class="flex items-center justify-between">
                  <span
                    class="text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-lg">
                    {{ task.category }}
                  </span>
                  @if (task.dueDate) {
                  <span class="text-xs text-surface-400">
                    {{ task.dueDate | date : "MMM d" }}
                  </span>
                  }
                </div>
              </div>
              } @empty {
              <div
                class="flex flex-col items-center justify-center py-12 text-surface-400">
                <svg
                  class="w-12 h-12 mb-3 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="text-sm">No tasks</p>
              </div>
              }
            </div>
          </div>
          }
        </div>

        <div class="mt-12 card">
          <h3
            class="font-display font-semibold text-surface-900 dark:text-white mb-4">
            Task Completion
          </h3>
          <div
            class="h-4 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
              [style.width.%]="completionPercentage()"></div>
          </div>
          <div
            class="flex items-center justify-between mt-3 text-sm text-surface-500 dark:text-surface-400">
            <span
              >{{ completedCount() }} of {{ taskService.tasks().length }} tasks
              completed</span
            >
            <span class="font-medium text-primary-600 dark:text-primary-400"
              >{{ completionPercentage() | number : "1.0-0" }}%</span
            >
          </div>
        </div>
      </main>

      @if (showCreateModal()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h3
              class="text-xl font-display font-bold text-surface-900 dark:text-white">
              {{ editingTask() ? "Edit Task" : "Create Task" }}
            </h3>
            <button
              (click)="closeModal()"
              class="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (ngSubmit)="submitTask()" class="space-y-5">
            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >Title</label
              >
              <input
                type="text"
                [(ngModel)]="taskForm.title"
                name="title"
                class="input"
                placeholder="Enter task title"
                required />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >Description</label
              >
              <textarea
                [(ngModel)]="taskForm.description"
                name="description"
                class="input min-h-[100px] resize-none"
                placeholder="Enter task description"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                  >Priority</label
                >
                <select
                  [(ngModel)]="taskForm.priority"
                  name="priority"
                  class="input">
                  @for (priority of priorities; track priority) {
                  <option [value]="priority">{{ priority | titlecase }}</option>
                  }
                </select>
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                  >Category</label
                >
                <select
                  [(ngModel)]="taskForm.category"
                  name="category"
                  class="input">
                  @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat | titlecase }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                >Due Date</label
              >
              <input
                type="date"
                [(ngModel)]="taskForm.dueDate"
                name="dueDate"
                class="input" />
            </div>

            <div class="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                (click)="closeModal()"
                class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingTask() ? "Update" : "Create" }} Task
              </button>
            </div>
          </form>
        </div>
      </div>
      } @if (showAuditPanel()) {
      <div
        class="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-surface-800 shadow-elevated">
        <div class="flex flex-col h-full">
          <div
            class="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
            <h3
              class="text-lg font-display font-bold text-surface-900 dark:text-white">
              Audit Logs
            </h3>
            <button
              (click)="showAuditPanel.set(false)"
              class="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            @if (auditService.loading()) {
            <div class="flex items-center justify-center py-12">
              <svg
                class="animate-spin h-8 w-8 text-primary-500"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
            } @else { @for (log of auditService.logs(); track log.id) {
            <div class="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full"
                  [class]="getActionBadgeClass(log.action)">
                  {{ log.action }}
                </span>
                <span class="text-xs text-surface-400">{{
                  log.timestamp | date : "short"
                }}</span>
              </div>
              <p class="text-sm text-surface-700 dark:text-surface-300">
                {{ log.details }}
              </p>
              <p class="text-xs text-surface-400 mt-1">
                Resource: {{ log.resource }}
              </p>
            </div>
            } @empty {
            <div class="text-center py-12 text-surface-400">
              <p>No audit logs available</p>
            </div>
            } }
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  taskService = inject(TaskService);
  themeService = inject(ThemeService);
  auditService = inject(AuditService);

  showCreateModal = signal(false);
  showAuditPanel = signal(false);
  editingTask = signal<Task | null>(null);
  filterCategory = "";

  columns = [
    { status: TaskStatus.TODO, title: "To Do", color: "bg-surface-400" },
    {
      status: TaskStatus.IN_PROGRESS,
      title: "In Progress",
      color: "bg-blue-500",
    },
    { status: TaskStatus.DONE, title: "Done", color: "bg-green-500" },
  ];

  columnIds = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

  priorities = Object.values(TaskPriority);
  categories = Object.values(TaskCategory);

  taskForm: CreateTaskDto = {
    title: "",
    description: "",
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.OTHER,
    dueDate: "",
  };

  completedCount = computed(
    () =>
      this.taskService.tasks().filter((t) => t.status === TaskStatus.DONE)
        .length
  );

  completionPercentage = computed(() => {
    const total = this.taskService.tasks().length;
    if (total === 0) return 0;
    return (this.completedCount() / total) * 100;
  });

  ngOnInit() {
    this.taskService.loadTasks().subscribe();
  }

  getFilteredTasks(status: TaskStatus): Task[] {
    return this.taskService
      .tasks()
      .filter(
        (t) =>
          t.status === status &&
          (!this.filterCategory || t.category === this.filterCategory)
      )
      .sort((a, b) => a.order - b.order);
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (!this.canUpdateTask()) return;

    const prevStatus = event.previousContainer.id as TaskStatus;
    const newStatus = event.container.id as TaskStatus;
    const task = event.previousContainer.data[event.previousIndex];

    if (prevStatus === newStatus) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    this.taskService
      .reorderTask(task.id, event.currentIndex, newStatus)
      .subscribe();
  }

  editTask(task: Task) {
    this.editingTask.set(task);
    this.taskForm = {
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
    };
    this.showCreateModal.set(true);
  }

  deleteTask(id: string) {
    if (confirm("Are you sure you want to delete this task?")) {
      this.taskService.deleteTask(id).subscribe();
    }
  }

  submitTask() {
    if (!this.taskForm.title) return;

    if (this.editingTask()) {
      this.taskService
        .updateTask(this.editingTask()!.id, this.taskForm)
        .subscribe(() => this.closeModal());
    } else {
      this.taskService
        .createTask(this.taskForm)
        .subscribe(() => this.closeModal());
    }
  }

  closeModal() {
    this.showCreateModal.set(false);
    this.editingTask.set(null);
    this.taskForm = {
      title: "",
      description: "",
      priority: TaskPriority.MEDIUM,
      category: TaskCategory.OTHER,
      dueDate: "",
    };
  }

  toggleAuditPanel() {
    this.showAuditPanel.update((v) => !v);
    if (this.showAuditPanel()) {
      this.auditService.loadLogs().subscribe();
    }
  }

  canCreateTask(): boolean {
    return this.authService.hasPermission(Permission.CREATE_TASK);
  }

  canUpdateTask(): boolean {
    return this.authService.hasPermission(Permission.UPDATE_TASK);
  }

  canDeleteTask(): boolean {
    return this.authService.hasPermission(Permission.DELETE_TASK);
  }

  canViewAudit(): boolean {
    return this.authService.hasPermission(Permission.VIEW_AUDIT);
  }

  getRoleBadgeClass(): string {
    const role = this.authService.user()?.role;
    switch (role) {
      case Role.OWNER:
        return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400";
      case Role.ADMIN:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400";
    }
  }

  getPriorityBadgeClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH:
        return "badge-high";
      case TaskPriority.MEDIUM:
        return "badge-medium";
      default:
        return "badge-low";
    }
  }

  getActionBadgeClass(action: string): string {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "UPDATE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "DELETE":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400";
    }
  }
}
