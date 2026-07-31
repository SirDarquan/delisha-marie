import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { WINDOW } from '../../services/global-tokens';
import { Comment, RecipeService } from '../../services/recipe.service';
import { RecipeComments } from './recipe-comments';

describe('RecipeComments', () => {
  let component: RecipeComments;
  let fixture: ComponentFixture<RecipeComments>;
  let router: Router;
  let windowMock: {
    scrollY?: number;
    scrollTo?: Mock;
    document: { getElementById: Mock };
  };

  const mockComments: Comment[] = Array.from({ length: 102 }, (_, i) => ({
    id: `c${i + 1}`,
    recipeId: '1',
    author: `Author ${i + 1}`,
    email: `author${i + 1}@example.com`,
    content: `Comment ${i + 1}`,
    rating: i === 101 ? 5 : undefined,
    createdAt: new Date(2024, 0, i + 1).toISOString(), // Incremental dates
  }));

  const recipeServiceMock = {
    getComments: vi.fn().mockImplementation((recipeId, page) => {
      const topLevel = mockComments.filter((c) => !c.parentId);
      const total = topLevel.length;
      const pageSize = 50;
      const lastPage = Math.max(1, Math.ceil(total / pageSize));
      const p = page !== undefined ? page : lastPage;
      const end = total - (lastPage - p) * pageSize;
      const start = Math.max(0, end - pageSize);
      const slice = topLevel.slice(start, end);
      return Promise.resolve({
        comments: slice,
        total: total,
      });
    }),
    addComment: vi
      .fn()
      .mockImplementation((c) =>
        Promise.resolve({ ...c, id: 'new', createdAt: new Date().toISOString() }),
      ),
  };

  beforeEach(async () => {
    windowMock = {
      scrollY: 0,
      scrollTo: vi.fn(),
      document: {
        getElementById: vi.fn().mockReturnValue({
          getBoundingClientRect: vi.fn().mockReturnValue({ top: 100 }),
        }),
      },
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RecipeComments],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeServiceMock },
        { provide: WINDOW, useValue: windowMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RecipeComments);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipe', { id: 1, title: 'Test Recipe', slug: 'test-recipe' });
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate last page correctly as default', () => {
    // 102 comments, pageSize 50 -> last page is 3
    expect(component.currentPage()).toBe(3);
  });

  it('should implement reverse-slice logic: Page 3 has 50 newest', () => {
    const paginated = component.paginatedComments();
    expect(paginated).toHaveLength(50);
    // Newest in the whole set is c102
    expect(paginated[0].id).toBe('c102');
    // Oldest in this block is c53
    expect(paginated[49].id).toBe('c53');
  });

  it('should implement reverse-slice logic: Page 1 has remainder', async () => {
    fixture.componentRef.setInput('page', '1');
    fixture.detectChanges();
    await fixture.whenStable();

    const paginated = component.paginatedComments();
    expect(paginated).toHaveLength(2);
    expect(paginated[0].id).toBe('c2'); // newest of the oldest
    expect(paginated[1].id).toBe('c1'); // oldest of all
  });

  it('should navigate on page change and land on last page for default route', () => {
    component.onPageChange(2);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/recipe/test-recipe/page/2'],
      expect.any(Object),
    );

    // Navigating to last page (3) should go to base URL
    component.onPageChange(3);
    expect(router.navigate).toHaveBeenCalledWith(['/recipe/test-recipe'], expect.any(Object));
  });

  it('should handle empty comments gracefully', async () => {
    recipeServiceMock.getComments.mockResolvedValueOnce({ comments: [], total: 0 });

    // Re-trigger resource
    fixture.componentRef.setInput('recipe', { id: 2, title: 'Empty', slug: 'empty' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.topLevelComments()).toHaveLength(0);
    expect(component.currentPage()).toBe(1);
    expect(component.paginatedComments()).toHaveLength(0);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Be the first to comment!');
  });

  it('should sort replies chronologically (oldest first)', async () => {
    const parentId = 'p1';
    const comments: Comment[] = [
      {
        id: 'r2',
        parentId,
        recipeId: '1',
        author: 'A',
        content: 'R2',
        createdAt: '2024-01-02T10:00:00Z',
        email: '',
      },
      {
        id: 'r1',
        parentId,
        recipeId: '1',
        author: 'B',
        content: 'R1',
        createdAt: '2024-01-01T10:00:00Z',
        email: '',
      },
    ];

    recipeServiceMock.getComments.mockResolvedValue({
      comments,
      total: comments.filter((c) => !c.parentId).length,
    });
    fixture.componentRef.setInput('recipe', { ...component.recipe(), id: 99 });
    fixture.detectChanges();
    await fixture.whenStable();

    const replies = component.getReplies(parentId);
    expect(replies[0].id).toBe('r1');
    expect(replies[1].id).toBe('r2');
  });

  it('should handle star rating change from template', () => {
    const starsEl = fixture.debugElement.query(By.css('dml-stars'));
    if (starsEl) {
      starsEl.triggerEventHandler('ratingChange', 5);
      fixture.detectChanges();
      expect(component['commentForm'].rating().value()).toBe(5);
    }
  });

  it('should handle page change from pagination controls', () => {
    // 102 comments -> 3 pages. Default is 3.
    const controls = fixture.debugElement.query(By.css('pagination-controls'));
    if (controls) {
      controls.triggerEventHandler('pageChange', 1);
      expect(router.navigate).toHaveBeenCalledWith(
        ['/recipe/test-recipe/page/1'],
        expect.any(Object),
      );
    }
  });

  it('should render nested replies in the DOM', async () => {
    // mockComments[101] is c102, which is on Page 3 (default)
    const parentId = mockComments[101].id;
    const reply: Comment = {
      id: 'reply1',
      parentId,
      recipeId: '1',
      author: 'Replier 1',
      content: 'Reply content',
      createdAt: new Date().toISOString(),
      email: '',
    };

    // Update the mock to return the reply as well
    recipeServiceMock.getComments.mockResolvedValue({
      comments: [...mockComments, reply],
      total: mockComments.filter((c) => !c.parentId).length + (reply.parentId ? 0 : 1),
    });

    // Trigger a re-fetch by updating the recipe input (using a new object reference)
    fixture.componentRef.setInput('recipe', { ...component.recipe(), id: 100 });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Replier 1');
    expect(compiled.textContent).toContain('Reply content');
  });

  it('should trigger reply mode when Reply button is clicked', () => {
    const replyBtn = fixture.debugElement.query(By.css('button[mat-stroked-button]'));
    if (replyBtn) {
      replyBtn.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(component.replyTo()).toBeTruthy();
    }
  });

  it('should update rating when setRating is called', () => {
    component.setRating(4);
    expect(component['commentForm'].rating().value()).toBe(4);
  });

  it('should manage replyTo state', () => {
    const comment = mockComments[0];
    component.replyToComment(comment);
    expect(component.replyTo()).toEqual(comment);

    component.cancelReply();
    expect(component.replyTo()).toBeNull();
  });

  it('should submit a comment and scroll to the comments section', async () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const authorInput = compiled.querySelector('#author') as HTMLInputElement;
    authorInput.value = 'New Author';
    authorInput.dispatchEvent(new Event('input'));

    const emailInput = compiled.querySelector('#email') as HTMLInputElement;
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const contentInput = compiled.querySelector('#content') as HTMLTextAreaElement;
    contentInput.value = 'New Comment';
    contentInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const formEl = compiled.querySelector('form') as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit'));

    await fixture.whenStable();

    expect(recipeServiceMock.addComment).toHaveBeenCalledWith(
      expect.objectContaining({
        author: 'New Author',
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(windowMock.document.getElementById).toHaveBeenCalledWith('comments');
  });

  it('should submit a reply and scroll to the new comment', async () => {
    const parent = mockComments[0];
    component.replyTo.set(parent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    const authorInput = compiled.querySelector('#author') as HTMLInputElement;
    authorInput.value = 'Replier';
    authorInput.dispatchEvent(new Event('input'));

    const emailInput = compiled.querySelector('#email') as HTMLInputElement;
    emailInput.value = 'replier@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const contentInput = compiled.querySelector('#content') as HTMLTextAreaElement;
    contentInput.value = 'Reply content';
    contentInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    // Mock addComment to return a specific ID
    recipeServiceMock.addComment.mockResolvedValueOnce({
      id: 'new-reply-id',
      author: 'Replier',
      createdAt: new Date().toISOString(),
      content: 'Reply content',
      recipeId: '1',
    });

    const formEl = compiled.querySelector('form') as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(recipeServiceMock.addComment).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: parent.id,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(windowMock.document.getElementById).toHaveBeenCalledWith('comment-new-reply-id');
  });

  it('should handle submission errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* ignore error */
    });
    recipeServiceMock.addComment.mockRejectedValueOnce(new Error('Network Error'));

    const compiled = fixture.nativeElement as HTMLElement;

    const authorInput = compiled.querySelector('#author') as HTMLInputElement;
    authorInput.value = 'Error Author';
    authorInput.dispatchEvent(new Event('input'));

    const emailInput = compiled.querySelector('#email') as HTMLInputElement;
    emailInput.value = 'error@example.com';
    emailInput.dispatchEvent(new Event('input'));

    const contentInput = compiled.querySelector('#content') as HTMLTextAreaElement;
    contentInput.value = 'Error content';
    contentInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    const formEl = compiled.querySelector('form') as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to post comment', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should show form validation errors when inputs are touched and invalid', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Trigger touched state
    const authorCtrl = component['commentForm'].author();
    authorCtrl.markAsTouched();
    const emailCtrl = component['commentForm'].email();
    emailCtrl.markAsTouched();
    const contentCtrl = component['commentForm'].content();
    contentCtrl.markAsTouched();

    fixture.detectChanges();

    expect(compiled.textContent).toContain('Name is required');
    expect(compiled.textContent).toContain('Email is required');
    expect(compiled.textContent).toContain('Comment is required');

    // Test invalid email format
    component['formModel'].set({
      author: 'Author',
      email: 'invalid-email',
      website: '',
      content: 'Comment',
      rating: null,
      alt_email: '',
      isNew: false,
    });
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Enter a valid email');
  });

  it('should add comment to empty list (commentsResource undefined)', async () => {
    component['commentsResource'].set(undefined);
    fixture.detectChanges();

    const saved = {
      id: 'first',
      author: 'User',
      content: 'hello',
      createdAt: new Date().toISOString(),
      recipeId: '1',
    };
    recipeServiceMock.addComment.mockResolvedValueOnce(saved);

    component['formModel'].set({
      author: 'User',
      email: 'user@example.com',
      website: '',
      content: 'hello',
      rating: null,
      alt_email: '',
      isNew: false,
    });
    fixture.detectChanges();

    const formEl = fixture.nativeElement.querySelector('form');
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(component.comments()).toEqual([saved]);
  });

  it('should handle falsy getReplies branch in template', async () => {
    const spy = vi
      .spyOn(component, 'getReplies')
      .mockReturnValue(undefined as unknown as Comment[]);
    fixture.componentRef.setInput('recipe', {
      id: 12345,
      title: 'New Recipe',
      slug: 'new-recipe-slug',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('should explicitly trigger template pageChange binding', () => {
    const controls = fixture.debugElement.query(By.css('pagination-controls'));
    expect(controls).toBeTruthy();
    controls.triggerEventHandler('pageChange', 2);
    fixture.detectChanges();
  });

  it('should execute timer scroll logic when replyToComment is called', async () => {
    const comment = mockComments[0];
    windowMock.document.getElementById.mockReturnValue({
      getBoundingClientRect: vi.fn().mockReturnValue({ top: 100 }),
    });
    component.replyToComment(comment);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(windowMock.document.getElementById).toHaveBeenCalledWith('respond');
  });

  it('should handle missing scroll target in replyToComment', async () => {
    const comment = mockComments[0];
    windowMock.document.getElementById.mockReturnValue(null);
    component.replyToComment(comment);
    await new Promise((resolve) => setTimeout(resolve, 150));
    // Assert target element check was attempted and signal state updated
    expect(component.replyTo()).toBe(comment);
    expect(windowMock.document.getElementById).toHaveBeenCalledWith('respond');
  });

  it('should handle missing scroll target in addComment', async () => {
    windowMock.document.getElementById.mockReturnValue(null);
    const saved = {
      id: 'new-scroll-test',
      author: 'User',
      content: 'hello',
      createdAt: new Date().toISOString(),
      recipeId: '1',
    };
    recipeServiceMock.addComment.mockResolvedValueOnce(saved);

    component['formModel'].set({
      author: 'User',
      email: 'user@example.com',
      website: '',
      content: 'hello',
      rating: null,
      alt_email: '',
      isNew: false,
    });
    fixture.detectChanges();

    const formEl = fixture.nativeElement.querySelector('form');
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 150));
    // Assert comment was saved successfully and getElementById was called
    expect(component.comments()).toContain(saved);
    expect(windowMock.document.getElementById).toHaveBeenCalledWith('comments');
  });
});
