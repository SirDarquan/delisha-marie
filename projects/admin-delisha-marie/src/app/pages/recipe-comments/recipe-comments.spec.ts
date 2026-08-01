import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RecipeCommentsComponent } from './recipe-comments';
import { CommentsService, Comment } from '../../services/comments.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { vi } from 'vitest';

describe('RecipeCommentsComponent', () => {
  let component: RecipeCommentsComponent;
  let fixture: ComponentFixture<RecipeCommentsComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let commentsService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let snackBar: any;
  let snackBarActionSubject: Subject<void>;

  const mockComments: Comment[] = [
    {
      id: '1',
      recipe_id: 'r-1',
      parent_id: null,
      author: 'User1',
      email: null,
      content: 'Comment 1',
      is_admin: false,
      status: 'approved',
      created_at: new Date().toISOString(), // New
      is_new: true,
    },
    {
      id: '2',
      recipe_id: 'r-1',
      parent_id: '1',
      author: 'Delisha Marie',
      email: null,
      content: 'Reply 1',
      is_admin: true,
      status: 'approved',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Old
      is_new: false,
    },
  ];

  beforeEach(async () => {
    commentsService = {
      getComments: vi.fn(),
      replyToComment: vi.fn(),
      skipComment: vi.fn(),
      deleteComment: vi.fn(),
    };
    commentsService.getComments.mockReturnValue(of({ comments: mockComments }));

    snackBarActionSubject = new Subject<void>();
    snackBar = {
      open: vi.fn().mockReturnValue({
        onAction: () => snackBarActionSubject.asObservable(),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeCommentsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => (key === 'id' ? 'r-1' : null) }),
          },
        },
        { provide: CommentsService, useValue: commentsService },
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();

    fixture = TestBed.createComponent(RecipeCommentsComponent);
    component = fixture.componentInstance;
    component.recipeId.set('r-1');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    // Verify constructor logic
    expect(commentsService.getComments).toHaveBeenCalledWith('r-1');
  });

  it('should render no comments message when empty', () => {
    commentsService.getComments.mockReturnValue(of({ comments: [] }));
    component.loadComments('r-1');
    fixture.detectChanges();
    expect(component.topLevelComments()).toHaveLength(0);
  });

  it('should load comments on init', () => {
    component.loadComments('r-1');
    fixture.detectChanges();
    expect(commentsService.getComments).toHaveBeenCalledWith('r-1');
    expect(component.comments()).toHaveLength(2);
    expect(component.topLevelComments()).toHaveLength(1);
    expect(component.getReplies('1')).toHaveLength(1);
    expect(component.isNew(mockComments[0])).toBe(true);
    expect(component.isNew(mockComments[1])).toBe(false);
  });

  it('should handle load errors', () => {
    commentsService.getComments.mockReturnValue(throwError(() => ({ error: { error: 'Failed' } })));
    component.loadComments('r-1');
    fixture.detectChanges();
    expect(component.error()).toBe('Failed');
  });

  it('should open and cancel reply', () => {
    component.loadComments('r-1');
    fixture.detectChanges();

    component.openReply('1');
    fixture.detectChanges();
    expect(component.replying()['1']).toBe(true);

    component.cancelReply('1');
    fixture.detectChanges();
    expect(component.replying()['1']).toBe(false);
  });

  it('should handle successful reply', () => {
    component.loadComments('r-1');
    const mockReply: Comment = {
      id: '3',
      recipe_id: 'r-1',
      parent_id: '1',
      author: 'Delisha Marie',
      email: null,
      content: 'My reply text',
      is_admin: true,
      status: 'approved',
      created_at: new Date().toISOString(),
      is_new: true,
    };
    component.onReplySuccess('1', mockReply as unknown as Comment);
    expect(component.replying()['1']).toBe(false);
    expect(component.comments()).toHaveLength(3);
  });

  it('should undo send reply', () => {
    component.loadComments('r-1');
    component.openReply('1');

    const mockReply: Comment = {
      id: '3',
      recipe_id: 'r-1',
      parent_id: '1',
      author: 'Delisha Marie',
      email: null,
      content: 'My reply text',
      is_admin: true,
      status: 'approved',
      created_at: new Date().toISOString(),
      is_new: true,
    };
    commentsService.deleteComment.mockReturnValue(of({ success: true }));

    component.onReplySuccess('1', mockReply as unknown as Comment);
    expect(component.comments()).toHaveLength(3);

    // Trigger undo
    snackBarActionSubject.next();
    expect(commentsService.deleteComment).toHaveBeenCalledWith('r-1', '3');
    expect(component.comments()).toHaveLength(2); // Removed
    expect(component.replying()['1']).toBe(true); // Re-opened
  });

  it('should skip comment and handle undo', async () => {
    component.loadComments('r-1');

    commentsService.skipComment.mockReturnValue(of({ success: true }));

    await component.skipComment('1');
    expect(commentsService.skipComment).toHaveBeenCalledWith('r-1', '1', true);
    expect(component.comments()[0].status).toBe('skipped');

    // Trigger undo
    snackBarActionSubject.next();
    await new Promise((r) => setTimeout(r, 0));
    expect(commentsService.skipComment).toHaveBeenCalledWith('r-1', '1', false);
    expect(component.comments()[0].status).toBe('approved');
  });

  it('should skip comment and handle error', async () => {
    component.loadComments('r-1');

    commentsService.skipComment.mockReturnValue(throwError(() => new Error('Error')));

    await component.skipComment('1');
    expect(commentsService.skipComment).toHaveBeenCalledWith('r-1', '1', true);
    // Should revert back to approved
    expect(component.comments()[0].status).toBe('approved');
  });

  it('should handle error when undoing send reply', () => {
    component.loadComments('r-1');
    component.openReply('1');

    const mockReply = {
      id: '3',
      recipe_id: 'r-1',
      parent_id: '1',
      author: 'Delisha Marie',
      content: 'My reply text',
      is_admin: true,
      status: 'approved',
      created_at: new Date().toISOString(),
      email: null,
    };
    commentsService.deleteComment.mockReturnValue(throwError(() => new Error('Error')));

    component.onReplySuccess('1', mockReply as unknown as Comment);
    snackBarActionSubject.next();

    // Should still be in state since delete failed
    expect(component.comments()).toHaveLength(3);
    expect(snackBar.open).toHaveBeenCalledWith('Failed to undo reply', 'Close', { duration: 3000 });
  });

  it('should handle error when undoing skip comment', async () => {
    component.loadComments('r-1');
    commentsService.skipComment.mockReturnValue(of({ success: true }));

    await component.skipComment('1');

    // Mock the undo to fail
    commentsService.skipComment.mockReturnValue(throwError(() => new Error('Error')));
    snackBarActionSubject.next();
    await new Promise((r) => setTimeout(r, 0));

    // Should still be skipped
    expect(component.comments()[0].status).toBe('skipped');
    expect(snackBar.open).toHaveBeenCalledWith('Failed to undo skip', 'Close', { duration: 3000 });
  });
});
