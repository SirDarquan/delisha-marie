import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  snoozed_until: string | null;
  deleted_at: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  private readonly _messages = signal<ContactMessage[]>([]);
  public readonly messages = computed(() => this._messages());

  private readonly _currentFolder = signal<string>('inbox');
  public readonly currentFolder = computed(() => this._currentFolder());

  private readonly _totalCount = signal(0);
  public readonly totalCount = computed(() => this._totalCount());

  private readonly _isLoading = signal(false);
  public readonly isLoading = computed(() => this._isLoading());

  public async fetchMessages(folder = 'inbox', page = 1, pageSize = 25) {
    this._isLoading.set(true);
    this._currentFolder.set(folder);
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: ContactMessage[]; count: number }>(
          `/api/contacts?folder=${folder}&page=${page}&pageSize=${pageSize}`,
        ),
      );
      this._messages.set(response.data);
      this._totalCount.set(response.count);
    } catch (e) {
      console.error('Failed to fetch contact messages', e);
    } finally {
      this._isLoading.set(false);
    }
  }

  public async getMessage(id: string): Promise<ContactMessage | undefined> {
    try {
      return await firstValueFrom(this.http.get<ContactMessage>(`/api/contacts/${id}`));
    } catch (e) {
      console.error('Failed to fetch contact message', e);
      return undefined;
    }
  }

  public async updateMessage(id: string, updates: Partial<ContactMessage>) {
    try {
      const oldMsg = this._messages().find((m) => m.id === id);
      const updated = await firstValueFrom(
        this.http.put<ContactMessage>(`/api/contacts/${id}`, updates),
      );
      this._messages.update((msgs) => msgs.map((m) => (m.id === id ? updated : m)));

      if (oldMsg) {
        const folder = this._currentFolder();
        const isNow = new Date().toISOString();

        const checkVisibility = (m: ContactMessage) => {
          if (folder === 'trash') return !!m.deleted_at;
          if (m.deleted_at) return false;
          if (folder === 'all') return true;
          if (folder === 'snoozed') return m.snoozed_until && m.snoozed_until > isNow;
          if (folder === 'inbox')
            return !m.is_archived && (!m.snoozed_until || m.snoozed_until <= isNow);
          return false;
        };

        const wasVisible = checkVisibility(oldMsg);
        const isVisible = checkVisibility(updated);

        if (wasVisible && !isVisible) {
          this._totalCount.update((c) => c - 1);
        } else if (!wasVisible && isVisible) {
          this._totalCount.update((c) => c + 1);
        }
      }
    } catch (e) {
      console.error('Failed to update message', e);
    }
  }

  public async deleteMessage(id: string) {
    try {
      await firstValueFrom(this.http.delete(`/api/contacts/${id}`));
      this._messages.update((msgs) => msgs.filter((m) => m.id !== id));
    } catch (e) {
      console.error('Failed to delete message', e);
    }
  }

  public async bulkUpdate(ids: string[], updates: Partial<ContactMessage>) {
    // In a real app we'd have a bulk update endpoint, but we can just run them in parallel
    await Promise.all(ids.map((id) => this.updateMessage(id, updates)));
  }

  public async bulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => this.deleteMessage(id)));
  }

  public async emptyTrash() {
    try {
      await firstValueFrom(this.http.delete(`/api/contacts/trash/empty`));
      this._messages.set([]);
      this._totalCount.set(0);
    } catch (e) {
      console.error('Failed to empty trash', e);
    }
  }
}
