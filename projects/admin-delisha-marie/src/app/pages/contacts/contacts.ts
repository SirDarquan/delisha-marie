import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactMessage, ContactService } from '../../services/contact.service';
import { ConfirmDialogComponent } from './confirm-dialog';
import { SnoozeDialogComponent } from './snooze-dialog';

@Component({
  selector: 'app-contacts',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDialogModule,
    FormsModule,
  ],
  template: `
    <div class="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 flex gap-6">
      <!-- Left Sidebar (Folders) -->
      <div class="w-64 flex-shrink-0 flex flex-col gap-2">
        <button
          mat-button
          class="!justify-start !px-4 !py-6 w-full text-left rounded-xl transition-colors"
          [class]="
            currentFolder() === 'inbox'
              ? 'bg-blue-600/20 text-blue-400 font-bold'
              : 'text-slate-400 hover:bg-slate-800'
          "
          (click)="setFolder('inbox')">
          <mat-icon class="mr-3">inbox</mat-icon> Inbox
        </button>
        <button
          mat-button
          class="!justify-start !px-4 !py-6 w-full text-left rounded-xl transition-colors"
          [class]="
            currentFolder() === 'snoozed'
              ? 'bg-blue-600/20 text-blue-400 font-bold'
              : 'text-slate-400 hover:bg-slate-800'
          "
          (click)="setFolder('snoozed')">
          <mat-icon class="mr-3">schedule</mat-icon> Snoozed
        </button>
        <button
          mat-button
          class="!justify-start !px-4 !py-6 w-full text-left rounded-xl transition-colors"
          [class]="
            currentFolder() === 'all'
              ? 'bg-blue-600/20 text-blue-400 font-bold'
              : 'text-slate-400 hover:bg-slate-800'
          "
          (click)="setFolder('all')">
          <mat-icon class="mr-3">all_inbox</mat-icon> All Mail
        </button>
        <button
          mat-button
          class="!justify-start !px-4 !py-6 w-full text-left rounded-xl transition-colors"
          [class]="
            currentFolder() === 'trash'
              ? 'bg-blue-600/20 text-blue-400 font-bold'
              : 'text-slate-400 hover:bg-slate-800'
          "
          (click)="setFolder('trash')">
          <mat-icon class="mr-3">delete</mat-icon> Trash
        </button>
      </div>

      <!-- Main Inbox Content -->
      <div
        class="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        <!-- Top Toolbar -->
        <div
          class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div class="flex items-center gap-2">
            <!-- Master Checkbox -->
            <mat-checkbox
              [checked]="selectionState() === 'all'"
              [indeterminate]="selectionState() === 'some'"
              (change)="toggleAll($event.checked)"
              class="mr-2">
            </mat-checkbox>

            <!-- Selection Menu -->
            <button mat-icon-button [matMenuTriggerFor]="selectionMenu" class="text-slate-400">
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <mat-menu #selectionMenu="matMenu" class="bg-slate-800 border border-slate-700">
              <button mat-menu-item (click)="selectAll()">All</button>
              <button mat-menu-item (click)="selectNone()">None</button>
              <button mat-menu-item (click)="selectRead()">Read</button>
              <button mat-menu-item (click)="selectUnread()">Unread</button>
            </mat-menu>

            <!-- Snooze Menu -->
            <mat-menu
              #snoozeMenu="matMenu"
              class="bg-slate-800 border border-slate-700 min-w-[250px]">
              <ng-template matMenuContent let-msg="msg">
                <div class="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Snooze until...
                </div>
                @for (opt of getSnoozeOptions(); track opt.label) {
                  <button
                    mat-menu-item
                    (click)="applySnooze(opt.date, msg)"
                    class="text-slate-300 hover:bg-slate-700">
                    <div class="flex justify-between items-center w-full">
                      <span>{{ opt.label }}</span>
                      <span class="text-slate-500 text-sm ml-4">{{ opt.subLabel }}</span>
                    </div>
                  </button>
                }
                <div class="h-px bg-slate-700 my-1 mx-2"></div>
                <button
                  mat-menu-item
                  (click)="openSnoozeDialog(msg)"
                  class="text-slate-300 hover:bg-slate-700">
                  <div class="flex items-center">
                    <mat-icon class="text-slate-400 mr-2 !w-5 !h-5 !text-[20px]"
                      >calendar_today</mat-icon
                    >
                    <span>Pick date & time</span>
                  </div>
                </button>
              </ng-template>
            </mat-menu>
          </div>

          <div class="flex items-center gap-2">
            @if (selectedIds().length === 0) {
              <!-- Default state -->
              <button
                mat-icon-button
                matTooltip="Refresh"
                (click)="refresh()"
                class="text-slate-400 hover:text-white">
                <mat-icon>refresh</mat-icon>
              </button>
              @if (currentFolder() !== 'trash') {
                <button
                  mat-icon-button
                  matTooltip="Mark all as read"
                  (click)="markAllAsRead()"
                  class="text-slate-400 hover:text-white">
                  <mat-icon>done_all</mat-icon>
                </button>
              }
            } @else {
              <!-- Bulk Actions State -->
              @if (currentFolder() === 'trash') {
                <button
                  mat-icon-button
                  matTooltip="Mark as unread"
                  (click)="bulkToggleRead()"
                  class="text-slate-400 hover:text-white">
                  <mat-icon>mark_email_unread</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Delete Forever"
                  (click)="bulkHardDelete()"
                  class="text-slate-400 hover:text-rose-400">
                  <mat-icon>delete_forever</mat-icon>
                </button>
              } @else {
                <button
                  mat-icon-button
                  matTooltip="Mark as read/unread"
                  (click)="bulkToggleRead()"
                  class="text-slate-400 hover:text-white">
                  <mat-icon>mark_email_read</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Snooze"
                  [matMenuTriggerFor]="snoozeMenu"
                  [matMenuTriggerData]="{ msg: null }"
                  class="text-slate-400 hover:text-white">
                  <mat-icon>schedule</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Archive"
                  (click)="bulkArchive()"
                  class="text-slate-400 hover:text-white">
                  <mat-icon>archive</mat-icon>
                </button>
                <button
                  mat-icon-button
                  matTooltip="Move to Trash"
                  (click)="bulkDelete()"
                  class="text-rose-400 hover:text-rose-300">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            }

            <!-- Pagination -->
            <div class="flex items-center pl-4 ml-2 border-l border-slate-700 contacts-paginator">
              <mat-paginator
                [length]="contactService.totalCount()"
                [pageSize]="pageSize()"
                [pageIndex]="currentPage() - 1"
                [hidePageSize]="true"
                (page)="onPageChange($event)">
              </mat-paginator>
            </div>
          </div>
        </div>

        <!-- Trash Banner -->
        @if (currentFolder() === 'trash') {
          <div
            class="flex items-center justify-between p-4 bg-slate-800/80 text-slate-300 border-b border-slate-700">
            <span
              >Messages that have been in Trash more than 30 days will be automatically
              deleted.</span
            >
            <button
              mat-button
              class="text-blue-400 hover:bg-blue-900/30 font-bold"
              (click)="emptyTrash()">
              Empty Trash now
            </button>
          </div>
        }

        <!-- Messages List -->
        <div class="flex-1 overflow-y-auto bg-slate-900 relative">
          @if (contactService.isLoading()) {
            <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div
                class="bg-blue-600 text-white rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 text-sm font-bold shadow-blue-500/20">
                Loading messages...
              </div>
            </div>
          }

          @if (filteredMessages().length === 0 && !contactService.isLoading()) {
            <div class="flex flex-col items-center justify-center p-16 text-slate-500">
              <mat-icon class="text-6xl mb-4 opacity-50">
                {{
                  currentFolder() === 'trash'
                    ? 'delete'
                    : currentFolder() === 'snoozed'
                      ? 'schedule'
                      : currentFolder() === 'all'
                        ? 'all_inbox'
                        : 'inbox'
                }}
              </mat-icon>
              <h3 class="text-xl">
                {{
                  currentFolder() === 'trash'
                    ? 'Your trash is empty'
                    : currentFolder() === 'snoozed'
                      ? 'No snoozed messages'
                      : currentFolder() === 'all'
                        ? 'No messages found'
                        : 'Your inbox is empty'
                }}
              </h3>
            </div>
          } @else if (filteredMessages().length === 0 && contactService.isLoading()) {
            <div class="flex flex-col divide-y divide-slate-800/50">
              @for (i of [1, 2, 3, 4, 5, 6, 7]; track i) {
                <div class="flex items-center px-4 py-3 animate-pulse">
                  <div class="w-12 flex justify-center">
                    <div class="w-4 h-4 bg-slate-800 rounded"></div>
                  </div>
                  <div class="flex-1 flex items-center pr-32">
                    <div class="w-48 pr-4"><div class="h-4 bg-slate-800 rounded w-24"></div></div>
                    <div class="flex-1"><div class="h-4 bg-slate-800 rounded w-1/2"></div></div>
                  </div>
                </div>
              }
            </div>
          }

          @if (filteredMessages().length > 0) {
            <div
              class="flex flex-col divide-y divide-slate-800/50 transition-opacity duration-200"
              [class.opacity-50]="contactService.isLoading()">
              @for (msg of filteredMessages(); track msg.id) {
                <div
                  class="group flex items-center px-4 py-2 hover:bg-slate-800/50 transition-colors cursor-pointer relative pr-4"
                  [class]="{
                    'bg-blue-900/20': isSelected(msg.id),
                    'bg-slate-900': !isSelected(msg.id),
                  }">
                  <!-- Checkbox (visible on hover or if checked) -->
                  <div
                    class="w-12 flex items-center justify-center"
                    [class]="{ 'opacity-0 group-hover:opacity-100': !isSelected(msg.id) }">
                    <mat-checkbox
                      [checked]="isSelected(msg.id)"
                      (change)="toggleSelection(msg.id, $event.checked)"
                      (click)="$event.stopPropagation()">
                    </mat-checkbox>
                  </div>

                  <!-- Clickable Row Area -->
                  <div
                    class="flex-1 flex items-center min-w-0 pr-32 group-hover:pr-48 transition-all outline-none cursor-pointer"
                    tabindex="0"
                    (keydown.enter)="viewMessage(msg.id)"
                    (click)="viewMessage(msg.id)">
                    <!-- Sender Name -->
                    <div
                      class="w-48 pr-4 truncate"
                      [class]="{
                        'font-bold text-white': !msg.is_read,
                        'text-slate-300': msg.is_read,
                      }">
                      {{ msg.name }}
                    </div>

                    <!-- Subject and Snippet -->
                    <div class="flex-1 truncate">
                      <span
                        [class]="{
                          'font-bold text-white': !msg.is_read,
                          'text-slate-300': msg.is_read,
                        }">
                        {{ msg.subject || '(No Subject)' }}
                      </span>
                      <span class="text-slate-500 mx-2">-</span>
                      <span class="text-slate-400">{{ msg.message }}</span>
                    </div>

                    <!-- Date (hidden on hover) -->
                    <div
                      class="absolute right-4 w-24 text-right text-xs group-hover:opacity-0 transition-opacity"
                      [class]="{
                        'font-bold text-white': !msg.is_read,
                        'text-slate-500': msg.is_read,
                      }">
                      {{ msg.created_at | date: 'MMM d' }}
                    </div>
                  </div>

                  <!-- Hover Actions (absolute over the right side) -->
                  <div
                    class="absolute right-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity space-x-1 pl-4 outline-none"
                    tabindex="0"
                    (keydown.enter)="$event.stopPropagation()"
                    (click)="$event.stopPropagation()">
                    <button
                      mat-icon-button
                      [matTooltip]="msg.is_read ? 'Mark as unread' : 'Mark as read'"
                      (click)="toggleRead(msg)"
                      class="text-slate-400 hover:text-white !scale-75">
                      <mat-icon>{{ msg.is_read ? 'mark_email_unread' : 'drafts' }}</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Snooze"
                      (click)="$event.stopPropagation()"
                      [matMenuTriggerFor]="snoozeMenu"
                      [matMenuTriggerData]="{ msg: msg }"
                      class="text-slate-400 hover:text-white !scale-75">
                      <mat-icon>schedule</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Archive"
                      (click)="archive(msg)"
                      class="text-slate-400 hover:text-white !scale-75"
                      [disabled]="currentFolder() === 'trash'">
                      <mat-icon>archive</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Move to Trash"
                      (click)="deleteMsg(msg)"
                      class="text-slate-400 hover:text-rose-400 !scale-75"
                      [disabled]="currentFolder() === 'trash'">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPage implements OnInit {
  protected readonly contactService = inject(ContactService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  protected readonly selectedIds = signal<string[]>([]);

  // Pagination State
  protected readonly pageSize = signal(25);
  protected readonly currentPage = signal(1);
  protected readonly currentFolder = signal<string>('inbox');

  protected readonly filteredMessages = computed(() => {
    const folder = this.currentFolder();
    const isNow = new Date().toISOString();

    return this.contactService.messages().filter((m) => {
      if (folder === 'trash') return !!m.deleted_at;
      if (m.deleted_at) return false;
      if (folder === 'all') return true;
      if (folder === 'snoozed') return m.snoozed_until && m.snoozed_until > isNow;
      if (folder === 'inbox')
        return !m.is_archived && (!m.snoozed_until || m.snoozed_until <= isNow);
      return false;
    });
  });

  protected readonly selectionState = computed(() => {
    const total = this.filteredMessages().length;
    const selected = this.selectedIds().length;
    if (total === 0 || selected === 0) return 'none';
    if (selected === total) return 'all';
    return 'some';
  });

  constructor() {
    effect(() => {
      // Fetch when page or folder changes
      this.contactService.fetchMessages(this.currentFolder(), this.currentPage(), this.pageSize());
    });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const pageParam = params.get('page');
      if (pageParam) {
        this.currentPage.set(parseInt(pageParam, 10));
      } else {
        this.currentPage.set(1);
      }
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const folderParam = params.get('folder');
      if (folderParam) {
        this.currentFolder.set(folderParam);
      } else {
        this.currentFolder.set('inbox');
      }
    });
  }

  protected setFolder(folder: string) {
    this.router.navigate(['/contacts'], { queryParams: { folder } });
  }

  protected onPageChange(event: PageEvent) {
    const newPage = event.pageIndex + 1;
    const url = newPage === 1 ? ['/contacts'] : ['/contacts/page', newPage];
    this.router.navigate(url, { queryParams: { folder: this.currentFolder() } });
    this.selectNone();
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  protected toggleSelection(id: string, checked: boolean) {
    if (checked) {
      this.selectedIds.update((ids) => [...ids, id]);
    } else {
      this.selectedIds.update((ids) => ids.filter((i) => i !== id));
    }
  }

  protected toggleAll(checked: boolean) {
    if (checked) {
      this.selectAll();
    } else {
      this.selectNone();
    }
  }

  protected selectAll() {
    this.selectedIds.set(this.filteredMessages().map((m) => m.id));
  }

  protected selectNone() {
    this.selectedIds.set([]);
  }

  protected selectRead() {
    this.selectedIds.set(
      this.filteredMessages()
        .filter((m) => m.is_read)
        .map((m) => m.id),
    );
  }

  protected selectUnread() {
    this.selectedIds.set(
      this.filteredMessages()
        .filter((m) => !m.is_read)
        .map((m) => m.id),
    );
  }

  protected refresh() {
    this.contactService.fetchMessages(this.currentFolder(), this.currentPage(), this.pageSize());
  }

  protected async markAllAsRead() {
    const unreadIds = this.filteredMessages()
      .filter((m) => !m.is_read)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await this.contactService.bulkUpdate(unreadIds, { is_read: true });
    }
  }

  protected viewMessage(id: string) {
    this.router.navigate(['/contacts', id]);
  }

  // Row Hover Actions
  protected async toggleRead(msg: ContactMessage) {
    await this.contactService.updateMessage(msg.id, { is_read: !msg.is_read });
  }

  protected async deleteMsg(msg: ContactMessage) {
    await this.contactService.updateMessage(msg.id, { deleted_at: new Date().toISOString() });
    this.selectedIds.update((ids) => ids.filter((i) => i !== msg.id));

    const snackBarRef = this.snackBar.open('Message moved to trash', 'Undo', { duration: 5000 });
    snackBarRef.onAction().subscribe(async () => {
      await this.contactService.updateMessage(msg.id, { deleted_at: null });
      this.snackBar.open('Message restored', '', { duration: 3000 });
    });
  }

  protected async archive(msg: ContactMessage) {
    await this.contactService.updateMessage(msg.id, { is_archived: true });
    this.selectedIds.update((ids) => ids.filter((i) => i !== msg.id));

    const snackBarRef = this.snackBar.open('Message archived', 'Undo', { duration: 5000 });
    snackBarRef.onAction().subscribe(async () => {
      await this.contactService.updateMessage(msg.id, { is_archived: false });
      this.snackBar.open('Message restored', '', { duration: 3000 });
    });
  }

  // Snooze Logic
  protected getSnoozeOptions() {
    const now = new Date();
    const options = [];

    // Later today (6:00 PM)
    if (now.getHours() < 12) {
      const laterToday = new Date(now);
      laterToday.setHours(18, 0, 0, 0);
      options.push({ label: 'Later today', date: laterToday });
    }

    // Tomorrow (8:00 AM)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    options.push({ label: 'Tomorrow', date: tomorrow });

    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...

    // Later this week (+2 days: Tue, Wed, Thu, or Fri 8:00 AM)
    // Only show if today is Sunday, Monday, Tuesday, or Wednesday
    if (dayOfWeek >= 0 && dayOfWeek <= 3) {
      const laterThisWeek = new Date(now);
      laterThisWeek.setDate(now.getDate() + 2);
      laterThisWeek.setHours(8, 0, 0, 0);
      options.push({ label: 'Later this week', date: laterThisWeek });
    }

    // This weekend (Saturday 8:00 AM)
    if (dayOfWeek >= 0 && dayOfWeek <= 4) {
      const thisWeekend = new Date(now);
      const daysToSat = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      thisWeekend.setDate(now.getDate() + daysToSat);
      thisWeekend.setHours(8, 0, 0, 0);
      options.push({ label: 'This weekend', date: thisWeekend });
    }

    // Next week (Monday 8:00 AM)
    const nextWeek = new Date(now);
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    nextWeek.setDate(now.getDate() + daysUntilMonday);
    nextWeek.setHours(8, 0, 0, 0);
    options.push({ label: 'Next week', date: nextWeek });

    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });

    return options.map((opt) => ({
      ...opt,
      subLabel: formatter.format(opt.date),
    }));
  }

  protected async applySnooze(until: Date, msg: ContactMessage | null) {
    const isoString = until.toISOString();
    if (msg) {
      await this.contactService.updateMessage(msg.id, { snoozed_until: isoString });
      this.snackBar.open('Message snoozed', '', { duration: 3000 });
    } else {
      const ids = this.selectedIds();
      await this.contactService.bulkUpdate(ids, { snoozed_until: isoString });
      this.selectNone();
      this.snackBar.open(`${ids.length} messages snoozed`, '', { duration: 3000 });
    }
  }

  protected openSnoozeDialog(msg: ContactMessage | null) {
    const dialogRef = this.dialog.open(SnoozeDialogComponent, {
      panelClass: 'admin-dialog-panel',
      data: { snoozed_until: msg?.snoozed_until },
    });

    dialogRef.afterClosed().subscribe(async (result: string) => {
      if (result) {
        const date = new Date(result);
        if (!isNaN(date.getTime())) {
          await this.applySnooze(date, msg);
        }
      }
    });
  }

  // Bulk Actions
  protected async bulkToggleRead() {
    const ids = this.selectedIds();
    const msgs = this.filteredMessages().filter((m) => ids.includes(m.id));
    const allRead = msgs.every((m) => m.is_read);
    await this.contactService.bulkUpdate(ids, { is_read: !allRead });
    this.selectNone();
  }

  protected async bulkDelete() {
    const ids = this.selectedIds();
    await this.contactService.bulkUpdate(ids, { deleted_at: new Date().toISOString() });
    this.selectNone();

    const snackBarRef = this.snackBar.open(`${ids.length} messages moved to trash`, 'Undo', {
      duration: 5000,
    });
    snackBarRef.onAction().subscribe(async () => {
      await this.contactService.bulkUpdate(ids, { deleted_at: null });
      this.snackBar.open('Messages restored', '', { duration: 3000 });
    });
  }

  protected async bulkArchive() {
    const ids = this.selectedIds();
    await this.contactService.bulkUpdate(ids, { is_archived: true });
    this.selectNone();

    const snackBarRef = this.snackBar.open(`${ids.length} messages archived`, 'Undo', {
      duration: 5000,
    });
    snackBarRef.onAction().subscribe(async () => {
      await this.contactService.bulkUpdate(ids, { is_archived: false });
      this.snackBar.open('Messages restored', '', { duration: 3000 });
    });
  }

  // Trash Specific Actions
  protected async restoreMsg(msg: ContactMessage) {
    await this.contactService.updateMessage(msg.id, { deleted_at: null });
    this.selectedIds.update((ids) => ids.filter((i) => i !== msg.id));
    this.snackBar.open('Message restored to Inbox', '', { duration: 3000 });
  }

  protected async hardDeleteMsg(msg: ContactMessage) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'admin-dialog-panel',
      data: {
        title: 'Delete Message',
        message:
          'Are you sure you want to permanently delete this message? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.contactService.deleteMessage(msg.id);
        this.selectedIds.update((ids) => ids.filter((i) => i !== msg.id));
        this.snackBar.open('Message permanently deleted', '', { duration: 3000 });
      }
    });
  }

  protected async bulkRestore() {
    const ids = this.selectedIds();
    await this.contactService.bulkUpdate(ids, { deleted_at: null });
    this.selectNone();
    this.snackBar.open(`${ids.length} messages restored`, '', { duration: 3000 });
  }

  protected async bulkHardDelete() {
    const ids = this.selectedIds();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'admin-dialog-panel',
      data: {
        title: 'Delete Messages',
        message: `Are you sure you want to permanently delete ${ids.length} messages? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.contactService.bulkDelete(ids);
        this.selectNone();
        this.snackBar.open(`${ids.length} messages permanently deleted`, '', { duration: 3000 });
      }
    });
  }

  protected async emptyTrash() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'admin-dialog-panel',
      data: {
        title: 'Empty Trash',
        message:
          'Are you sure you want to empty the trash? All messages will be permanently deleted.',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.contactService.emptyTrash();
        this.selectNone();
        this.snackBar.open('Trash emptied', '', { duration: 3000 });
      }
    });
  }
}
