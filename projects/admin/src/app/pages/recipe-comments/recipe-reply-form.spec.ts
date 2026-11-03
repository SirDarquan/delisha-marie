import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeReplyFormComponent } from './recipe-reply-form';
import { CommentsService, Comment } from '../../services/comments.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('RecipeReplyFormComponent', () => {
  let component: RecipeReplyFormComponent;
  let fixture: ComponentFixture<RecipeReplyFormComponent>;
  let mockCommentsService: { replyToComment: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockCommentsService = { replyToComment: vi.fn() };
    mockSnackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeReplyFormComponent],
      providers: [
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeReplyFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipeId', 'recipe1');
    fixture.componentRef.setInput('parentId', 'parent1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit canceled when cancel button is clicked', () => {
    const emitSpy = vi.spyOn(component.canceled, 'emit');
    const btn = fixture.nativeElement.querySelector('button.text-slate-400');
    btn.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not call replyToComment if text is empty', async () => {
    component.replyModel.set({ text: '   ' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(mockCommentsService.replyToComment).not.toHaveBeenCalled();
  });

  it('should call replyToComment and emit success on success', async () => {
    const emitSpy = vi.spyOn(component.success, 'emit');
    const mockReply = { id: 'reply1' } as Comment;
    mockCommentsService.replyToComment.mockReturnValue(of(mockReply));

    component.replyModel.set({ text: 'test reply' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(mockCommentsService.replyToComment).toHaveBeenCalledWith(
      'recipe1',
      'parent1',
      'test reply',
    );
    expect(emitSpy).toHaveBeenCalledWith(mockReply);
  });

  it('should not emit success if newReply is null/falsy', async () => {
    const emitSpy = vi.spyOn(component.success, 'emit');
    mockCommentsService.replyToComment.mockReturnValue(of(null as unknown as Comment));

    component.replyModel.set({ text: 'test reply' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(mockCommentsService.replyToComment).toHaveBeenCalled();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should open snackbar on error', async () => {
    mockCommentsService.replyToComment.mockReturnValue(throwError(() => new Error('Failed')));

    component.replyModel.set({ text: 'test reply' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to send reply', 'Close', {
      duration: 3000,
    });
  });

  it('should have required error when text is empty', () => {
    component.replyModel.set({ text: '' });
    fixture.detectChanges();
    const errors = component.replyForm.text().errors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe('Please enter a comment text');
  });
});
