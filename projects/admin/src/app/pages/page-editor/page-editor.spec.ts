import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageEditorComponent } from './page-editor';
import { PagesService } from '../../services/pages.service';
import { provideRouter } from '@angular/router';
import { Location } from '@angular/common';

describe('PageEditorComponent', () => {
  let component: PageEditorComponent;
  let fixture: ComponentFixture<PageEditorComponent>;
  let pagesServiceSpy: { getPage: ReturnType<typeof vi.fn>; savePage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pagesServiceSpy = {
      getPage: vi
        .fn()
        .mockResolvedValue({ slug: 'about', title: 'About', content: '<p>Content</p>' }),
      savePage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PageEditorComponent],
      providers: [
        provideRouter([{ path: 'pages', component: PageEditorComponent }]),
        { provide: PagesService, useValue: pagesServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle cancel', () => {
    const location = TestBed.inject(Location);
    const locationSpy = vi.spyOn(location, 'back');
    component['onCancel']();
    expect(locationSpy).toHaveBeenCalled();
  });

  it('should log warning when loadPageData fails', async () => {
    pagesServiceSpy.getPage.mockRejectedValueOnce(new Error('API error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    await component['loadPageData']('unknown');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should show success snackbar and navigate on save', async () => {
    pagesServiceSpy.savePage.mockResolvedValueOnce(null);
    const snackSpy = vi.spyOn(component['snackBar'], 'open').mockReturnValue({} as never);
    const routerNavigateSpy = vi.spyOn(component['router'], 'navigate').mockResolvedValue(true);

    await component.save({
      title: 'New Title',
      content: 'New Content',
      description: 'Desc',
      keywords: ['tag'],
    });

    expect(pagesServiceSpy.savePage).toHaveBeenCalledWith('', {
      title: 'New Title',
      content: 'New Content',
      description: 'Desc',
      keywords: ['tag'],
    });
    expect(snackSpy).toHaveBeenCalledWith('Page saved successfully!', 'Close', { duration: 3000 });
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/pages']);
  });

  it('should show error snackbar on save failure', async () => {
    pagesServiceSpy.savePage.mockRejectedValueOnce(new Error('Save failed'));
    const snackSpy = vi.spyOn(component['snackBar'], 'open').mockReturnValue({} as never);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    await component.save({ title: 'T', content: 'C', description: '', keywords: [] });

    expect(snackSpy).toHaveBeenCalledWith('Failed to save page.', 'Close', { duration: 3000 });
    consoleErrorSpy.mockRestore();
  });

  it('should set pageModel to default values if page data has missing fields', async () => {
    pagesServiceSpy.getPage.mockResolvedValueOnce({ slug: 'about' });
    await component['loadPageData']('about');
    expect(component['pageModel']()).toEqual({
      title: '',
      content: '',
      description: '',
      keywords: [],
    });
  });

  it('should not update pageModel if getPage returns falsy', async () => {
    pagesServiceSpy.getPage.mockResolvedValueOnce(null);
    component['pageModel'].set({
      title: 'Init',
      content: 'Init',
      description: '',
      keywords: [],
    });
    await component['loadPageData']('about');
    expect(component['pageModel']()).toEqual({
      title: 'Init',
      content: 'Init',
      description: '',
      keywords: [],
    });
  });

  it('should load slug from route in ngOnInit and submit form', async () => {
    const route = TestBed.inject((await import('@angular/router')).ActivatedRoute);
    vi.spyOn(route.snapshot.paramMap, 'get').mockReturnValue('about');
    component.ngOnInit();
    expect(component['slug']()).toBe('about');

    component['pageModel'].set({
      title: 'Valid Title',
      content: '<p>Body</p>',
      description: 'Desc',
      keywords: ['tag'],
    });
    fixture.detectChanges();
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const location = TestBed.inject(Location);
    const locationSpy = vi.spyOn(location, 'back');
    const cancelBtns = fixture.nativeElement.querySelectorAll('button[type="button"]');
    cancelBtns.forEach((btn: HTMLElement) => btn.click());
    expect(locationSpy).toHaveBeenCalled();
  });
});
