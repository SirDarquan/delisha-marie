import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactService, ContactMessage } from '../../services/contact.service';

@Component({
  selector: 'app-contact-detail',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterLink,
  ],
  template: `
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      @if (isLoading()) {
        <div class="flex justify-center p-8 text-slate-500">
          <mat-icon class="animate-spin mr-2">refresh</mat-icon> Loading message...
        </div>
      } @else if (!message()) {
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-slate-500 mb-4">error_outline</mat-icon>
          <h2 class="text-2xl font-bold text-white mb-2">Message not found</h2>
          <p class="text-slate-400 mb-6">
            The message you are looking for doesn't exist or has been deleted.
          </p>
          <a mat-flat-button color="primary" routerLink="/contacts">Back to Inbox</a>
        </div>
      } @else {
        <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <!-- Toolbar -->
          <div
            class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <div class="flex items-center gap-2">
              <button
                mat-icon-button
                matTooltip="Back to Inbox"
                routerLink="/contacts"
                class="text-slate-400 hover:text-white">
                <mat-icon>arrow_back</mat-icon>
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                mat-icon-button
                matTooltip="Mark as unread"
                (click)="markUnread()"
                class="text-slate-400 hover:text-white">
                <mat-icon>mark_email_unread</mat-icon>
              </button>
              <button
                mat-icon-button
                matTooltip="Snooze"
                (click)="snooze()"
                class="text-slate-400 hover:text-white">
                <mat-icon>schedule</mat-icon>
              </button>
              <button
                mat-icon-button
                matTooltip="Archive"
                (click)="archive()"
                class="text-slate-400 hover:text-white">
                <mat-icon>archive</mat-icon>
              </button>
              <button
                mat-icon-button
                matTooltip="Delete"
                (click)="deleteMsg()"
                class="text-rose-400 hover:text-rose-300">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>

          <!-- Email Content -->
          <div class="p-8">
            <h1 class="text-3xl font-bold text-white mb-6">
              {{ message()?.subject || '(No Subject)' }}
            </h1>

            <div class="flex items-start justify-between mb-8 pb-8 border-b border-slate-800">
              <div class="flex items-center gap-4">
                <div
                  class="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {{ message()?.name?.charAt(0)?.toUpperCase() || 'A' }}
                </div>
                <div>
                  <div class="font-bold text-white text-lg">{{ message()?.name }}</div>
                  <div class="text-slate-400 text-sm">&lt;{{ message()?.email }}&gt;</div>
                </div>
              </div>
              <div class="text-slate-400 text-sm">
                {{ message()?.created_at | date: 'medium' }}
              </div>
            </div>

            <div class="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
              {{ message()?.message }}
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactDetail implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isLoading = signal(true);
  protected readonly message = signal<ContactMessage | undefined>(undefined);

  ngOnInit() {
    this.loadMessage();
  }

  private async loadMessage() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const msg = await this.contactService.getMessage(id);
      this.message.set(msg);

      // Auto-mark as read when opened
      if (msg && !msg.is_read) {
        await this.contactService.updateMessage(id, { is_read: true });
        // Update local state without refetching
        this.message.set({ ...msg, is_read: true });
      }
    }
    this.isLoading.set(false);
  }

  protected async markUnread() {
    const msg = this.message();
    if (msg) {
      await this.contactService.updateMessage(msg.id, { is_read: false });
      this.router.navigate(['/contacts']);
    }
  }

  protected async archive() {
    const msg = this.message();
    if (!msg) return;

    await this.contactService.updateMessage(msg.id, { is_archived: true });
    this.router.navigate(['/contacts']);

    const snackBarRef = this.snackBar.open('Message archived', 'Undo', { duration: 5000 });
    snackBarRef.onAction().subscribe(async () => {
      await this.contactService.updateMessage(msg.id, { is_archived: false });
      this.snackBar.open('Message restored', '', { duration: 3000 });
    });
  }

  protected async snooze() {
    const msg = this.message();
    if (msg) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.contactService.updateMessage(msg.id, { snoozed_until: tomorrow.toISOString() });
      this.router.navigate(['/contacts']);
    }
  }

  protected async deleteMsg() {
    const msg = this.message();
    if (!msg) return;

    await this.contactService.updateMessage(msg.id, { deleted_at: new Date().toISOString() });
    this.router.navigate(['/contacts']);

    const snackBarRef = this.snackBar.open('Message moved to trash', 'Undo', { duration: 5000 });
    snackBarRef.onAction().subscribe(async () => {
      await this.contactService.updateMessage(msg.id, { deleted_at: null });
      this.snackBar.open('Message restored', '', { duration: 3000 });
    });
  }
}
