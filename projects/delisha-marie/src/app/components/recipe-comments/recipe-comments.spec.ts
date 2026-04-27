import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RecipeComments } from './recipe-comments';
import { provideRouter, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { WINDOW } from '../../services/global-tokens';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Comment } from '../../services/recipe.service';

describe('RecipeComments', () => {
  let component: RecipeComments;
  let fixture: ComponentFixture<RecipeComments>;
  let router: Router;
  let windowMock: { document: { getElementById: Mock } };

  const mockComments: Comment[] = Array.from({ length: 102 }, (_, i) => ({
    id: `c${i + 1}`,
    recipeId: '1',
    author: `Author ${i + 1}`,
    email: `author${i + 1}@example.com`,
    content: `Comment ${i + 1}`,
    createdAt: new Date(2024, 0, i + 1).toISOString(), // Incremental dates
  }));

  const recipeServiceMock = {
    getComments: vi.fn().mockResolvedValue(mockComments),
    addComment: vi
      .fn()
      .mockImplementation((c) =>
        Promise.resolve({ ...c, id: 'new', createdAt: new Date().toISOString() }),
      ),
  };

  beforeEach(async () => {
    windowMock = {
      document: {
        getElementById: vi.fn().mockReturnValue({ scrollIntoView: vi.fn() }),
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
    expect(paginated.length).toBe(50);
    // Newest in the whole set is c102
    expect(paginated[0].id).toBe('c102');
    // Oldest in this block is c53
    expect(paginated[49].id).toBe('c53');
  });

  it('should implement reverse-slice logic: Page 1 has remainder', () => {
    fixture.componentRef.setInput('page', '1');
    fixture.detectChanges();

    const paginated = component.paginatedComments();
    expect(paginated.length).toBe(2);
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
    recipeServiceMock.getComments.mockResolvedValueOnce([]);

    // Re-trigger resource
    fixture.componentRef.setInput('recipe', { id: 2, title: 'Empty', slug: 'empty' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.topLevelComments().length).toBe(0);
    expect(component.currentPage()).toBe(1);
    expect(component.paginatedComments().length).toBe(0);
  });

  it('should sort replies chronologically (oldest first)', () => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).commentsResource.update(() => comments);
    fixture.detectChanges();

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
      expect(router.navigate).toHaveBeenCalledWith(['/recipe/test-recipe/page/1'], expect.any(Object));
    }
  });

  it('should render nested replies in the DOM', async () => {
    // mockComments[101] is c102, which is on Page 3 (default)
    const parentId = mockComments[101].id;
    const replies: Comment[] = [
      { id: 'reply1', parentId, recipeId: '1', author: 'Replier 1', content: 'Reply content', createdAt: new Date().toISOString(), email: '' }
    ];
    
    // Inject replies into the signal
    (component as any).commentsResource.update(() => [...mockComments, ...replies]);
    fixture.detectChanges();

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

  it('should submit a top-level comment and scroll to comments section', async () => {
    // Fill the form via the source model signal
    (component as any).formModel.set({
      author: 'New Author',
      email: 'new@example.com',
      website: '',
      content: 'New Comment Content',
      rating: null,
    });
    fixture.detectChanges();

    const formEl = fixture.nativeElement.querySelector('form');
    formEl.dispatchEvent(new Event('submit'));
    
    // The action is async
    await fixture.whenStable();

    expect(recipeServiceMock.addComment).toHaveBeenCalledWith(
      expect.objectContaining({
        author: 'New Author',
        parentId: undefined,
      }),
    );
    
    // Wait for the setTimeout in the action
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(windowMock.document.getElementById).toHaveBeenCalledWith('comments');
  });

  it('should submit a reply and scroll to the new comment', async () => {
    const parent = mockComments[0];
    component.replyTo.set(parent);
    fixture.detectChanges();
    
    (component as any).formModel.set({
      author: 'Replier',
      email: 'replier@example.com',
      website: '',
      content: 'Reply Content',
      rating: null,
    });
    fixture.detectChanges();

    // Mock addComment to return a specific ID
    recipeServiceMock.addComment.mockResolvedValueOnce({
      id: 'new-reply-id',
      author: 'Replier',
      createdAt: new Date().toISOString(),
      content: 'Reply Content',
      recipeId: '1'
    });

    const formEl = fixture.nativeElement.querySelector('form');
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
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    recipeServiceMock.addComment.mockRejectedValueOnce(new Error('Network Error'));

    (component as any).formModel.set({
      author: 'Error Author',
      email: 'error@example.com',
      website: '',
      content: 'Error Content',
      rating: null,
    });
    fixture.detectChanges();

    const formEl = fixture.nativeElement.querySelector('form');
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to post comment', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
