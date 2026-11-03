import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesListComponent } from './pages-list';
import { PagesService, Page } from '../../services/pages.service';
import { AuthService } from '../../services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AddPostDialogComponent } from '../../components/add-post-dialog/add-post-dialog';
import { CreatePageDialogComponent } from '../create-page-dialog/create-page-dialog';

describe('PagesListComponent', () => {
  let component: PagesListComponent;
  let fixture: ComponentFixture<PagesListComponent>;
  let pagesServiceSpy: { getPages: ReturnType<typeof vi.fn> };
  let dialogSpy: { open: ReturnType<typeof vi.fn> };
  let router: Router;

  const mockPages: Page[] = [
    {
      id: '1',
      slug: 'home:about',
      title: 'Home About',
      content: '<p>Welcome home</p>',
      updated_at: '2026-10-20',
    },
    {
      id: '2',
      slug: 'home:contact',
      title: 'Home Contact',
      content: '<p>Contact us</p>',
      updated_at: '2026-10-21',
    },
    {
      id: '3',
      slug: 'kitchen:recipes',
      title: 'Kitchen Recipes',
      content:
        '<p>Story</p><div class="story-component-block" data-component-block="true" data-block-height="450" data-block-label="Kitchen Widget"></div>',
      updated_at: '2026-10-22',
    },
    {
      id: '4',
      slug: 'about',
      title: 'Legacy About',
      content: '<p>Legacy about content</p>',
      updated_at: '2026-10-18',
    },
    {
      id: '5',
      slug: 'thank-you',
      title: 'Legacy Thank You',
      content: '<p>Thank you!</p>',
      updated_at: '2026-10-19',
    },
    {
      id: '6',
      slug: 'garden:tips-101',
      title: 'Garden Tips',
      content: '<p>Gardening advice</p>',
      updated_at: '2026-10-23',
    },
  ];

  beforeEach(async () => {
    pagesServiceSpy = {
      getPages: vi.fn().mockResolvedValue([]),
    };
    dialogSpy = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [PagesListComponent],
      providers: [
        provideRouter([]),
        { provide: PagesService, useValue: pagesServiceSpy },
        { provide: AuthService, useValue: { tenant: () => ({ name: 'Test Tenant' }) } },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component['activePost']()).toBe('home');
  });

  it('should load pages and derive post categories', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce(mockPages);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['pages']()).toHaveLength(6);
    // Should include home, kitchen, and dynamically discovered garden
    expect(component['posts']()).toEqual(['home', 'kitchen', 'garden']);
  });

  it('should filter pages for home (only home: slugs)', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce(mockPages);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectPost('home');
    const filtered = component['filteredPages']();
    expect(filtered.map((p) => p.slug)).toEqual(['home:about', 'home:contact']);
  });

  it('should filter pages for kitchen (kitchen: slugs and legacy unprefixed slugs)', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce(mockPages);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectPost('kitchen');
    const filtered = component['filteredPages']();
    expect(filtered.map((p) => p.slug)).toEqual(['kitchen:recipes', 'about', 'thank-you']);
  });

  it('should filter pages for custom post garden', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce(mockPages);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectPost('garden');
    const filtered = component['filteredPages']();
    expect(filtered.map((p) => p.slug)).toEqual(['garden:tips-101']);
  });

  it('should correctly calculate post count', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce(mockPages);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.getPostCount('home')).toBe(2);
    expect(component.getPostCount('kitchen')).toBe(3);
    expect(component.getPostCount('garden')).toBe(1);
    expect(component.getPostCount('nonexistent')).toBe(0);
  });

  it('should extract block info correctly', () => {
    const pageWithBlock: Page = {
      id: '1',
      slug: 'test',
      title: 'Test',
      content:
        '<div class="story-component-block" data-component-block="true" data-block-height="500" data-block-label="Promo Box"></div>',
      updated_at: '2026-10-20',
    };
    const blockInfo = component.getBlockInfo(pageWithBlock);
    expect(blockInfo.hasBlock).toBe(true);
    expect(blockInfo.height).toBe(500);
    expect(blockInfo.label).toBe('Promo Box');

    const pageWithoutBlock: Page = {
      id: '2',
      slug: 'test2',
      title: 'Test 2',
      content: '<p>Regular story content</p>',
      updated_at: '2026-10-20',
    };
    expect(component.getBlockInfo(pageWithoutBlock)).toEqual({ hasBlock: false });
  });

  it('should open AddPostDialog and add new post', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () => of('lifestyle'),
    });

    component.openAddPostDialog();

    expect(dialogSpy.open).toHaveBeenCalledWith(AddPostDialogComponent, {
      width: '460px',
      panelClass: 'transparent-dialog-panel',
    });
    expect(component['posts']()).toContain('lifestyle');
    expect(component['activePost']()).toBe('lifestyle');
  });

  it('should open CreatePageDialog and navigate on submit', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () =>
        of({
          title: 'New Page',
          slug: 'new-page',
          fullSlug: 'home:new-page',
        }),
    });

    component.openAddPageDialog();

    expect(dialogSpy.open).toHaveBeenCalledWith(CreatePageDialogComponent, {
      width: '500px',
      panelClass: 'transparent-dialog-panel',
      data: { activePost: 'home' },
    });
    expect(router.navigate).toHaveBeenCalledWith(['/pages', 'home:new-page']);
  });

  it('should handle getPages error gracefully', async () => {
    pagesServiceSpy.getPages.mockRejectedValueOnce(new Error('API error'));
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component['loading']()).toBe(false);
    expect(component['pages']()).toEqual([]);
  });

  it('should handle tenant fallback when authService.tenant is undefined or not a function', () => {
    (component as unknown as { authService: { tenant?: unknown } })['authService'].tenant =
      undefined;
    expect(component.tenant()).toBeNull();
  });

  it('should deduplicate pages with identical slugs in pages computed', async () => {
    const duplicatePages: Page[] = [
      { id: '1', slug: 'home:about', title: 'First', content: '', updated_at: '2026-10-20' },
      { id: '2', slug: 'home:about', title: 'Duplicate', content: '', updated_at: '2026-10-21' },
      { id: '3', slug: 'kitchen:recipes', title: 'Recipes', content: '', updated_at: '2026-10-22' },
    ];
    pagesServiceSpy.getPages.mockResolvedValueOnce(duplicatePages);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component['pages']()).toHaveLength(2);
    expect(component['pages']().map((p) => p.title)).toEqual(['First', 'Recipes']);
  });

  it('should handle cancellation in openAddPostDialog and openAddPageDialog', () => {
    // When add post dialog is dismissed without a name
    dialogSpy.open.mockReturnValueOnce({
      afterClosed: () => of(undefined),
    });
    const postsBefore = component['posts']().length;
    component.openAddPostDialog();
    expect(component['posts']()).toHaveLength(postsBefore);

    // When add post dialog returns an existing post name
    dialogSpy.open.mockReturnValueOnce({
      afterClosed: () => of('home'),
    });
    component.openAddPostDialog();
    expect(component['activePost']()).toBe('home');

    // When add page dialog is dismissed without a result
    dialogSpy.open.mockReturnValueOnce({
      afterClosed: () => of(undefined),
    });
    component.openAddPageDialog();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should extract block info with default height and undefined label', () => {
    const pageWithMinimalBlock: Page = {
      id: 'block-min',
      slug: 'min-block',
      title: 'Minimal Block',
      content: "<div class='story-component-block'></div>",
      updated_at: '2026-10-20',
    };
    const info = component.getBlockInfo(pageWithMinimalBlock);
    expect(info.hasBlock).toBe(true);
    expect(info.height).toBe(380);
    expect(info.label).toBeUndefined();

    // Page with null content
    const pageWithNoContent: Page = {
      id: 'null-content',
      slug: 'null',
      title: 'Null Content',
      content: undefined as unknown as string,
      updated_at: '2026-10-20',
    };
    expect(component.getBlockInfo(pageWithNoContent)).toEqual({ hasBlock: false });
  });

  it('should trigger openAddPageDialog and openAddPostDialog from template buttons', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce([]);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    const addPostSpy = vi.spyOn(component, 'openAddPostDialog');
    const addPageSpy = vi.spyOn(component, 'openAddPageDialog');

    // Top header Add Page button
    const headerAddPageBtn = fixture.nativeElement.querySelector(
      'button[mat-flat-button]',
    ) as HTMLButtonElement;
    headerAddPageBtn?.click();
    expect(addPageSpy).toHaveBeenCalled();

    // New Post button
    const newPostBtn = fixture.nativeElement.querySelector(
      'button[title="Add another blog post section"]',
    ) as HTMLButtonElement;
    newPostBtn?.click();
    expect(addPostSpy).toHaveBeenCalled();

    // Empty state Add Page button
    const emptyAddPageBtn = fixture.nativeElement.querySelector(
      '.col-span-full button',
    ) as HTMLButtonElement;
    emptyAddPageBtn?.click();
    expect(addPageSpy).toHaveBeenCalledTimes(2);
  });

  it('should render template with block badges, kitchen explanation, and post selection buttons', async () => {
    const pagesWithBlock: Page[] = [
      {
        id: 'k1',
        slug: 'kitchen:widget',
        title: 'Kitchen Page',
        content: '<div class="story-component-block" data-block-height="420"></div>',
        updated_at: '',
      },
    ];
    pagesServiceSpy.getPages.mockResolvedValueOnce(pagesWithBlock);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    // Select kitchen post
    component.selectPost('kitchen');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('finds kitchen:slug and legacy unprefixed slugs');
    expect(compiled.textContent).toContain('Block: 420px');
    expect(compiled.textContent).toContain('Never');

    // Select home post and check else branch of post explanation
    component.selectPost('home');
    fixture.detectChanges();
    expect(compiled.textContent).toContain('(finds home: slugs)');

    // Click post button in template
    const postBtn = compiled.querySelector('.bg-slate-900\\/90 button') as HTMLButtonElement;
    postBtn?.click();
    fixture.detectChanges();
    expect(component['activePost']()).toBeDefined();
  });

  it('should not duplicate custom post if already in customPosts', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () => of('events'),
    });
    component.openAddPostDialog();
    expect(component['customPosts']()).toContain('events');

    // Call again with same name
    component.openAddPostDialog();
    expect(component['customPosts']().filter((p) => p === 'events')).toHaveLength(1);
  });
});
