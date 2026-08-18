/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactsPage } from './contacts';
import { ContactService, ContactMessage } from '../../services/contact.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';

describe('ContactsPage', () => {
  let component: ContactsPage;
  let fixture: ComponentFixture<ContactsPage>;
  let mockContactService: any;
  let mockRouter: any;
  let mockDialog: any;
  let mockSnackBar: any;

  let paramMapSubject: Subject<any>;
  let queryParamMapSubject: Subject<any>;

  const mockMessages: ContactMessage[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test 1',
      message: 'Body 1',
      is_read: false,
      is_archived: false,
      snoozed_until: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Test 2',
      message: 'Body 2',
      is_read: true,
      is_archived: false,
      snoozed_until: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    mockContactService = {
      messages: signal(mockMessages),
      totalCount: signal(2),
      isLoading: signal(false),
      fetchMessages: vi.fn(),
      bulkUpdate: vi.fn(),
      bulkDelete: vi.fn(),
      updateMessage: vi.fn(),
      deleteMessage: vi.fn(),
      emptyTrash: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true),
      }),
    };

    mockSnackBar = {
      open: vi.fn().mockReturnValue({
        onAction: () => of(true),
      }),
    };

    paramMapSubject = new Subject();
    queryParamMapSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [ContactsPage],
      providers: [
        { provide: ContactService, useValue: mockContactService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
            queryParamMap: queryParamMapSubject.asObservable(),
          },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .overrideProvider(MatSnackBar, { useValue: mockSnackBar })
      .compileComponents();

    fixture = TestBed.createComponent(ContactsPage);
    component = fixture.componentInstance;
    
    vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as any);

    vi.spyOn(component['snackBar'], 'open').mockReturnValue({
      onAction: () => of(true),
    } as any);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Routing & Initialization', () => {
    it('should set page from paramMap', () => {
      paramMapSubject.next({ get: (key: string) => (key === 'page' ? '3' : null) });
      expect((component as any).currentPage()).toBe(3);
    });

    it('should set default page from paramMap', () => {
      paramMapSubject.next({ get: () => null });
      expect((component as any).currentPage()).toBe(1);
    });

    it('should set folder from queryParamMap', () => {
      queryParamMapSubject.next({ get: (key: string) => (key === 'folder' ? 'trash' : null) });
      expect((component as any).currentFolder()).toBe('trash');
    });

    it('should set default folder from queryParamMap', () => {
      queryParamMapSubject.next({ get: () => null });
      expect((component as any).currentFolder()).toBe('inbox');
    });
  });

  describe('Filtering', () => {
    it('should filter inbox correctly', () => {
      (component as any).currentFolder.set('inbox');
      expect((component as any).filteredMessages()).toHaveLength(2);
    });

    it('should filter trash correctly', () => {
      mockContactService.messages.set([
        ...mockMessages,
        { id: '3', deleted_at: new Date().toISOString() },
      ]);
      (component as any).currentFolder.set('trash');
      expect((component as any).filteredMessages()).toHaveLength(1);
    });

    it('should filter snoozed correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      mockContactService.messages.set([
        ...mockMessages,
        { id: '3', snoozed_until: futureDate.toISOString() },
      ]);
      (component as any).currentFolder.set('snoozed');
      expect((component as any).filteredMessages()).toHaveLength(1);
    });

    it('should render trash folder actions', () => {
      (component as any).currentFolder.set('trash');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.innerHTML).toContain('Empty Trash now');
    });
  });

  describe('Selection', () => {
    it('should toggle selection of a single item', () => {
      (component as any).selectItem('1');
      expect((component as any).selectedIds()).toContain('1');
      (component as any).deselectItem('1');
      expect((component as any).selectedIds()).not.toContain('1');
    });

    it('should calculate selection state correctly', () => {
      expect((component as any).selectionState()).toBe('none');
      (component as any).selectItem('1');
      expect((component as any).selectionState()).toBe('some');
      (component as any).selectItem('2');
      expect((component as any).selectionState()).toBe('all');
    });

    it('should test selection from template', () => {
      (component as any).selectAll();
      expect((component as any).selectedIds()).toHaveLength(2);
      (component as any).selectNone();
      expect((component as any).selectedIds()).toHaveLength(0);
    });

    it('should select read and unread', () => {
      (component as any).selectRead();
      expect((component as any).selectedIds()).toEqual(['2']);

      (component as any).selectUnread();
      expect((component as any).selectedIds()).toEqual(['1']);
    });


  });

  describe('Actions', () => {
    it('should bulk mark as read', async () => {
      (component as any).selectAll();
      await (component as any).bulkToggleRead();
      expect(mockContactService.bulkUpdate).toHaveBeenCalledWith(['1', '2'], { is_read: true });
    });

    it('should delete msg and show snackbar', async () => {
      await (component as any).deleteMsg(mockMessages[0]);
      expect(mockContactService.updateMessage).toHaveBeenCalled();
      expect(component['snackBar'].open).toHaveBeenCalled();
      // the snackbar onAction is mocked to return of(true) which triggers restore
      // wait a tick
      await new Promise((r) => setTimeout(r, 0));
      expect(mockContactService.updateMessage).toHaveBeenCalledTimes(2);
    });

    it('should hard delete msg if confirmed', async () => {
      await (component as any).hardDeleteMsg(mockMessages[0]);
      expect(component['dialog'].open).toHaveBeenCalled();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockContactService.deleteMessage).toHaveBeenCalledWith('1');
    });

    it('should markAllAsRead correctly', async () => {
      await (component as any).markAllAsRead();
      expect(mockContactService.bulkUpdate).toHaveBeenCalledWith(['1'], { is_read: true });
    });

    it('should change page', () => {
      (component as any).onPageChange({ pageIndex: 1 });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/contacts/page', 2], {
        queryParams: { folder: 'inbox' },
      });
    });

    it('should refresh', () => {
      (component as any).refresh();
      expect(mockContactService.fetchMessages).toHaveBeenCalled();
    });

    it('should bulk archive', async () => {
      (component as any).selectAll();
      await (component as any).bulkArchive();
      expect(mockContactService.bulkUpdate).toHaveBeenCalledWith(['1', '2'], { is_archived: true });
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should bulk delete', async () => {
      (component as any).selectAll();
      await (component as any).bulkDelete();
      expect(mockContactService.bulkUpdate).toHaveBeenCalledWith(
        ['1', '2'],
        expect.objectContaining({ deleted_at: expect.any(String) }),
      );
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should bulk hard delete', async () => {
      (component as any).selectAll();
      await (component as any).bulkHardDelete();
      expect(component['dialog'].open).toHaveBeenCalled();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockContactService.bulkDelete).toHaveBeenCalledWith(['1', '2']);
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should bulk restore', async () => {
      (component as any).selectAll();
      await (component as any).bulkRestore();
      expect(mockContactService.bulkUpdate).toHaveBeenCalledWith(['1', '2'], { deleted_at: null });
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should empty trash', async () => {
      await (component as any).emptyTrash();
      expect(component['dialog'].open).toHaveBeenCalled();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockContactService.emptyTrash).toHaveBeenCalled();
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should restore msg', async () => {
      await (component as any).restoreMsg(mockMessages[0]);
      expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { deleted_at: null });
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should archive', async () => {
      await (component as any).archive(mockMessages[0]);
      expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { is_archived: true });
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should toggle read', async () => {
      await (component as any).toggleRead(mockMessages[0]);
      expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { is_read: true });
    });

    it('should apply snooze to single message', async () => {
      const futureDate = new Date();
      await (component as any).applySnooze(futureDate, mockMessages[0]);
      expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', {
        snoozed_until: futureDate.toISOString(),
      });
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should apply snooze to multiple messages', async () => {
      (component as any).selectAll();
      const futureDate = new Date();
      await (component as any).applySnooze(futureDate, null);
      expect(mockContactService.bulkUpdate).toHaveBeenCalledWith(['1', '2'], {
        snoozed_until: futureDate.toISOString(),
      });
      expect(component['snackBar'].open).toHaveBeenCalled();
    });

    it('should calculate snooze options', () => {
      const options = (component as any).getSnoozeOptions();
      expect(options.length).toBeGreaterThan(0);
      expect(options[0].label).toBeTruthy();
      expect(options[0].date).toBeInstanceOf(Date);
    });

    it('should open snooze dialog', async () => {
      (component['dialog'].open as any).mockReturnValue({ afterClosed: () => of(new Date().toISOString()) });
      await (component as any).openSnoozeDialog(mockMessages[0]);
      expect(component['dialog'].open).toHaveBeenCalled();
      await new Promise((r) => setTimeout(r, 0));
      expect(mockContactService.updateMessage).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ snoozed_until: expect.any(String) }),
      );
    });
  });
});
