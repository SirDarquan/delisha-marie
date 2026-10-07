import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfileItem, UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users-page',
  imports: [CommonModule, FormsModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span class="material-icons text-purple-400 text-3xl">people</span>
            Users & Tenant Management
          </h1>
          <p class="text-slate-400 text-sm mt-1">
            Manage member tenant sandboxes, approve pending signups in the waiting room, and launch
            impersonation sessions.
          </p>
        </div>

        <button
          mat-stroked-button
          (click)="loadData()"
          class="border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer self-start md:self-auto">
          <span class="material-icons text-sm mr-1">refresh</span> Refresh
        </button>
      </div>

      <!-- Alert / Notice message -->
      @if (actionMessage()) {
        <div
          class="mb-6 p-4 rounded-2xl flex items-center justify-between"
          [ngClass]="{
            'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300': !isErrorMessage(),
            'bg-rose-500/10 border border-rose-500/20 text-rose-300': isErrorMessage(),
          }">
          <div class="flex items-center gap-2">
            <span class="material-icons text-lg">{{
              isErrorMessage() ? 'error_outline' : 'check_circle'
            }}</span>
            <span class="text-sm font-medium">{{ actionMessage() }}</span>
          </div>
          <button
            (click)="actionMessage.set(null)"
            class="text-slate-400 hover:text-white cursor-pointer">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      }

      <!-- Tabs Navigation -->
      <div class="flex border-b border-slate-800 mb-6 gap-2">
        <button
          (click)="activeTab.set('all-users')"
          class="py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer"
          [ngClass]="{
            'border-purple-500 text-purple-400': activeTab() === 'all-users',
            'border-transparent text-slate-400 hover:text-slate-200': activeTab() !== 'all-users',
          }">
          <span class="material-icons text-base">group</span>
          All Users & Tenants
          <span
            class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            {{ users().length }}
          </span>
        </button>

        <button
          (click)="activeTab.set('waiting-room')"
          class="py-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer"
          [ngClass]="{
            'border-purple-500 text-purple-400': activeTab() === 'waiting-room',
            'border-transparent text-slate-400 hover:text-slate-200':
              activeTab() !== 'waiting-room',
          }">
          <span class="material-icons text-base">hourglass_top</span>
          Waiting Room
          @if (pendingUsers().length > 0) {
            <span
              class="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {{ pendingUsers().length }}
            </span>
          }
        </button>
      </div>

      <!-- Tab 1: All Users & Tenants -->
      @if (activeTab() === 'all-users') {
        @if (isLoading()) {
          <div class="p-12 text-center text-slate-500">Loading user directory...</div>
        } @else {
          <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-slate-300">
                <thead
                  class="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="py-4 px-6">User</th>
                    <th class="py-4 px-6">Role</th>
                    <th class="py-4 px-6">Status</th>
                    <th class="py-4 px-6">Tenant Sandbox</th>
                    <th class="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  @for (user of users(); track user.id) {
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="py-4 px-6">
                        <div class="font-bold text-white">{{ user.email }}</div>
                        <div class="text-xs text-slate-500 font-mono">{{ user.userId }}</div>
                      </td>
                      <td class="py-4 px-6">
                        @if (user.role === 'admin') {
                          <span
                            class="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Administrator
                          </span>
                        } @else if (user.role === 'member') {
                          <span
                            class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Member
                          </span>
                        } @else {
                          <span
                            class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 text-slate-400">
                            Unassigned
                          </span>
                        }
                      </td>
                      <td class="py-4 px-6">
                        @if (user.status === 'active') {
                          <span
                            class="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        } @else if (user.status === 'pending') {
                          <span
                            class="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400">
                            Pending
                          </span>
                        } @else {
                          <span
                            class="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400">
                            Blocked
                          </span>
                        }
                      </td>
                      <td class="py-4 px-6">
                        @if (user.tenant) {
                          <div>
                            <div class="font-semibold text-white text-xs">
                              {{ user.tenant.name }}
                            </div>
                            <div class="text-xs text-slate-400 font-mono">
                              slug: {{ user.tenant.slug }}
                            </div>
                            @if (user.tenant.custom_domain) {
                              <div class="text-xs text-purple-400 font-mono">
                                domain: {{ user.tenant.custom_domain }}
                              </div>
                            }
                          </div>
                        } @else if (user.role === 'admin') {
                          <span class="text-xs text-slate-500 italic"
                            >Platform Admin (no tenant)</span
                          >
                        } @else {
                          <span class="text-xs text-amber-500/80">No tenant provisioned</span>
                        }
                      </td>
                      <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <!-- Impersonate Member (only for active members) -->
                          @if (user.role === 'member' && user.status === 'active') {
                            <button
                              (click)="onImpersonate(user)"
                              title="Log in as this member without password"
                              class="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 font-bold text-xs border border-purple-500/30 transition flex items-center gap-1 cursor-pointer">
                              <span class="material-icons text-xs">login</span>
                              Login As
                            </button>
                          }

                          <!-- Edit Tenant -->
                          @if (user.tenant) {
                            <button
                              (click)="openEditTenant(user)"
                              title="Edit Tenant Configuration"
                              class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer">
                              <span class="material-icons text-sm">edit</span>
                            </button>
                          }

                          <!-- Block / Unblock -->
                          @if (user.role !== 'admin') {
                            @if (user.status === 'blocked') {
                              <button
                                (click)="onUnblockUser(user)"
                                class="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold cursor-pointer">
                                Unblock
                              </button>
                            } @else {
                              <button
                                (click)="onBlockUser(user)"
                                class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold cursor-pointer">
                                Block
                              </button>
                            }
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- Tab 2: Waiting Room (Pending Approvals) -->
      @if (activeTab() === 'waiting-room') {
        @if (isLoading()) {
          <div class="p-12 text-center text-slate-500">Loading pending signups...</div>
        } @else if (pendingUsers().length === 0) {
          <div class="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span class="material-icons text-3xl">done_all</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">Waiting room is clear!</h3>
            <p class="text-slate-400 text-sm">There are no pending user approvals at this time.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4">
            @for (user of pendingUsers(); track user.id) {
              <div
                class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-base">{{ user.email }}</span>
                      <span
                        class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Pending Approval
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                      Signed up on {{ user.createdAt | date: 'medium' }}
                    </p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      mat-flat-button
                      (click)="toggleApproveForm(user.id)"
                      class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3 rounded-xl cursor-pointer">
                      {{ selectedUserIdForApproval() === user.id ? 'Cancel' : 'Approve as Member' }}
                    </button>
                    <button
                      mat-stroked-button
                      (click)="onApproveAdmin(user)"
                      class="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 text-xs py-2 px-3 rounded-xl cursor-pointer">
                      Make Admin
                    </button>
                    <button
                      mat-stroked-button
                      (click)="onBlockUser(user)"
                      class="border-rose-500 text-rose-400 hover:bg-rose-500/10 text-xs py-2 px-3 rounded-xl cursor-pointer">
                      Block
                    </button>
                  </div>
                </div>

                <!-- Expanded Member Tenant Configuration -->
                @if (selectedUserIdForApproval() === user.id) {
                  <div
                    class="mt-2 p-4 rounded-xl bg-slate-950/60 border border-purple-500/30 flex flex-col gap-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Provision Member Tenant Sandbox
                    </h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          for="approvalTenantName_{{ user.id }}"
                          class="block text-xs font-medium text-slate-400 mb-1"
                          >Kitchen / Tenant Name</label
                        >
                        <input
                          id="approvalTenantName_{{ user.id }}"
                          type="text"
                          [(ngModel)]="approvalTenantName"
                          placeholder="e.g. Delisha's Kitchen"
                          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label
                          for="approvalSlug_{{ user.id }}"
                          class="block text-xs font-medium text-slate-400 mb-1"
                          >Slug (Tenant URL ID)</label
                        >
                        <input
                          id="approvalSlug_{{ user.id }}"
                          type="text"
                          [(ngModel)]="approvalSlug"
                          placeholder="e.g. delisha-kitchen"
                          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                      <div>
                        <label
                          for="approvalCustomDomain_{{ user.id }}"
                          class="block text-xs font-medium text-slate-400 mb-1"
                          >Custom Domain (Optional)</label
                        >
                        <input
                          id="approvalCustomDomain_{{ user.id }}"
                          type="text"
                          [(ngModel)]="approvalCustomDomain"
                          placeholder="e.g. myrecipes.com"
                          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500" />
                      </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                      <button
                        (click)="submitMemberApproval(user.id)"
                        class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs hover:brightness-110 cursor-pointer">
                        Confirm & Provision Tenant
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- Edit Tenant Modal / Overlay -->
      @if (editingTenantUser()) {
        <div
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 class="text-lg font-bold text-white mb-1">
              Edit Tenant: {{ editingTenantUser()?.tenant?.name }}
            </h3>
            <p class="text-xs text-slate-400 mb-4">Owner: {{ editingTenantUser()?.email }}</p>

            <div class="space-y-4 mb-6">
              <div>
                <label for="editTenantName" class="block text-xs font-medium text-slate-400 mb-1"
                  >Tenant Name</label
                >
                <input
                  id="editTenantName"
                  type="text"
                  [(ngModel)]="editTenantName"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label for="editTenantSlug" class="block text-xs font-medium text-slate-400 mb-1"
                  >Slug</label
                >
                <input
                  id="editTenantSlug"
                  type="text"
                  [(ngModel)]="editTenantSlug"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label for="editTenantDomain" class="block text-xs font-medium text-slate-400 mb-1"
                  >Custom Domain</label
                >
                <input
                  id="editTenantDomain"
                  type="text"
                  [(ngModel)]="editTenantDomain"
                  placeholder="e.g. delisha-marie.com"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <button
                mat-stroked-button
                (click)="editingTenantUser.set(null)"
                class="border-slate-700 text-slate-400 hover:bg-slate-800 cursor-pointer">
                Cancel
              </button>
              <button
                mat-flat-button
                (click)="saveTenantChanges()"
                class="bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class UsersPageComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly users = signal<UserProfileItem[]>([]);
  readonly pendingUsers = signal<UserProfileItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly activeTab = signal<'waiting-room' | 'all-users'>('all-users');
  readonly actionMessage = signal<string | null>(null);
  readonly isErrorMessage = signal<boolean>(false);

  // Approval form state
  readonly selectedUserIdForApproval = signal<string | null>(null);
  approvalTenantName = '';
  approvalSlug = '';
  approvalCustomDomain = '';

  // Edit tenant modal state
  readonly editingTenantUser = signal<UserProfileItem | null>(null);
  editTenantName = '';
  editTenantSlug = '';
  editTenantDomain = '';

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [all, pending] = await Promise.all([
        this.usersService.getUsers(),
        this.usersService.getWaitingRoom(),
      ]);
      this.users.set(all);
      this.pendingUsers.set(pending);
    } catch {
      this.showMessage('Failed to load users data', true);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleApproveForm(userId: string): void {
    if (this.selectedUserIdForApproval() === userId) {
      this.selectedUserIdForApproval.set(null);
      return;
    }
    const target = this.pendingUsers().find((u) => u.id === userId);
    const localPart = target?.email ? target.email.split('@')[0] : 'chef';
    this.approvalTenantName = `${localPart}'s Kitchen`;
    this.approvalSlug = localPart.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    this.approvalCustomDomain = '';
    this.selectedUserIdForApproval.set(userId);
  }

  async submitMemberApproval(userId: string): Promise<void> {
    try {
      await this.usersService.approveUser(userId, {
        role: 'member',
        tenantName: this.approvalTenantName,
        slug: this.approvalSlug,
        customDomain: this.approvalCustomDomain || undefined,
      });
      this.showMessage('User approved as member and tenant sandbox provisioned successfully!');
      this.selectedUserIdForApproval.set(null);
      await this.loadData();
    } catch {
      this.showMessage('Failed to approve member', true);
    }
  }

  async onApproveAdmin(user: UserProfileItem): Promise<void> {
    if (
      !confirm(
        `Are you sure you want to promote ${user.email} to Administrator? Admins cannot own a tenant.`,
      )
    ) {
      return;
    }
    try {
      await this.usersService.approveUser(user.id, { role: 'admin' });
      this.showMessage(`User ${user.email} approved as Administrator.`);
      await this.loadData();
    } catch {
      this.showMessage('Failed to approve administrator', true);
    }
  }

  async onBlockUser(user: UserProfileItem): Promise<void> {
    if (
      !confirm(`Are you sure you want to block ${user.email}? They will not be able to log in.`)
    ) {
      return;
    }
    try {
      await this.usersService.blockUser(user.id);
      this.showMessage(`User ${user.email} has been blocked.`);
      await this.loadData();
    } catch {
      this.showMessage('Failed to block user', true);
    }
  }

  async onUnblockUser(user: UserProfileItem): Promise<void> {
    try {
      await this.usersService.unblockUser(user.id);
      this.showMessage(`User ${user.email} has been unblocked.`);
      await this.loadData();
    } catch {
      this.showMessage('Failed to unblock user', true);
    }
  }

  async onImpersonate(user: UserProfileItem): Promise<void> {
    try {
      await this.usersService.impersonateUser(user.id);
      await this.auth.checkSession();
      this.showMessage(`Now impersonating ${user.email}`);
      this.router.navigate(['/recipes']);
    } catch {
      this.showMessage(`Failed to impersonate ${user.email}`, true);
    }
  }

  openEditTenant(user: UserProfileItem): void {
    if (!user.tenant) return;
    this.editingTenantUser.set(user);
    this.editTenantName = user.tenant.name;
    this.editTenantSlug = user.tenant.slug;
    this.editTenantDomain = user.tenant.custom_domain || '';
  }

  async saveTenantChanges(): Promise<void> {
    const user = this.editingTenantUser();
    if (!user?.tenant) return;
    try {
      await this.usersService.updateTenant(user.tenant.id, {
        name: this.editTenantName,
        slug: this.editTenantSlug,
        customDomain: this.editTenantDomain || undefined,
      });
      this.showMessage('Tenant configuration updated successfully!');
      this.editingTenantUser.set(null);
      await this.loadData();
    } catch {
      this.showMessage('Failed to update tenant', true);
    }
  }

  private showMessage(msg: string, isError = false): void {
    this.actionMessage.set(msg);
    this.isErrorMessage.set(isError);
  }
}
