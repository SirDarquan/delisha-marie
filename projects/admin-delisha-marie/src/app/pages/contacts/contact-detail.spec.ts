import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ContactDetail } from './contact-detail';
import { ContactService, ContactMessage } from '../../services/contact.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

describe('ContactDetail Component', () => {
  let component: ContactDetail;
  let fixture: ComponentFixture<ContactDetail>;
  let mockContactService: any;
  let mockRouter: any;
  let mockSnackBar: any;
  let snackBarActionSubject: Subject<void>;

  const mockMessage: ContactMessage = {
    id: '1',
    name: 'Test',
    email: 'test@test.com',
    subject: 'Test Subject',
    message: 'Test message body',
    created_at: new Date().toISOString(),
    is_read: false,
    is_archived: false,
    snoozed_until: null,
    deleted_at: null,
  };

  beforeEach(async () => {
    snackBarActionSubject = new Subject<void>();

    mockContactService = {
      getMessage: vi.fn().mockResolvedValue({ ...mockMessage }),
      updateMessage: vi.fn().mockResolvedValue({}),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContactDetail],
      providers: [
        provideRouter([]),
        { provide: ContactService, useValue: mockContactService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('1'),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactDetail);
    component = fixture.componentInstance;
    
    vi.spyOn(component['snackBar'], 'open').mockReturnValue({
      onAction: () => snackBarActionSubject.asObservable(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize and load message', async () => {
    expect(component['isLoading']()).toBe(true);
    await component['loadMessage']();
    expect(mockContactService.getMessage).toHaveBeenCalledWith('1');
    expect(component['message']()).toBeTruthy();
    expect(component['message']()?.id).toBe('1');
    expect(component['isLoading']()).toBe(false);
  });

  it('should auto-mark unread messages as read when loaded', async () => {
    await component['loadMessage']();
    expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { is_read: true });
    expect(component['message']()?.is_read).toBe(true);
  });

  it('should not mark message as read if already read', async () => {
    mockContactService.getMessage.mockResolvedValueOnce({ ...mockMessage, is_read: true });
    await component['loadMessage']();
    expect(mockContactService.updateMessage).not.toHaveBeenCalled();
    expect(component['message']()?.is_read).toBe(true);
  });

  it('should handle missing message id from route', async () => {
    const route = TestBed.inject(ActivatedRoute);
    vi.mocked(route.snapshot.paramMap.get).mockReturnValueOnce(null);
    await component['loadMessage']();
    expect(mockContactService.getMessage).not.toHaveBeenCalled();
    expect(component['message']()).toBeUndefined();
    expect(component['isLoading']()).toBe(false);
  });

  it('should mark message unread and navigate back', async () => {
    await component['loadMessage']();
    mockContactService.updateMessage.mockClear();
    await component['markUnread']();
    expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { is_read: false });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/contacts']);
  });

  it('should archive message, navigate, and allow undo', async () => {
    await component['loadMessage']();
    mockContactService.updateMessage.mockClear();
    
    await component['archive']();
    expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { is_archived: true });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/contacts']);
    expect(component['snackBar'].open).toHaveBeenCalledWith('Message archived', 'Undo', expect.any(Object));
    snackBarActionSubject.next();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { is_archived: false });
    expect(component['snackBar'].open).toHaveBeenCalledWith('Message restored', '', expect.any(Object));
  });

  it('should snooze message for tomorrow and navigate', async () => {
    await component['loadMessage']();
    mockContactService.updateMessage.mockClear();
    await component['snooze']();
    expect(mockContactService.updateMessage).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ snoozed_until: expect.any(String) })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/contacts']);
  });

  it('should delete message, navigate, and allow undo', async () => {
    await component['loadMessage']();
    mockContactService.updateMessage.mockClear();
    await component['deleteMsg']();
    expect(mockContactService.updateMessage).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/contacts']);
    expect(component['snackBar'].open).toHaveBeenCalledWith('Message moved to trash', 'Undo', expect.any(Object));
    snackBarActionSubject.next();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockContactService.updateMessage).toHaveBeenCalledWith('1', { deleted_at: null });
    expect(component['snackBar'].open).toHaveBeenCalledWith('Message restored', '', expect.any(Object));
  });


  it.each([
    'markUnread',
    'archive',
    'snooze',
    'deleteMsg',
  ])('should not execute %s if message is undefined', async (method) => {
    component['message'].set(undefined);
    await (component as any)[method]();
    expect(mockContactService.updateMessage).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
