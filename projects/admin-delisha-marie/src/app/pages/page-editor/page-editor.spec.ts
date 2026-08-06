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

  it('should log error when loadPageData fails for unknown slug', async () => {
    pagesServiceSpy.getPage.mockRejectedValueOnce(new Error('API error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    await component['loadPageData']('unknown');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should show success snackbar on save', async () => {
    pagesServiceSpy.savePage.mockResolvedValueOnce(null);
    const mockSnackbarRef = {
      onAction: () => ({ subscribe: vi.fn() }),
    } as unknown as import('@angular/material/snack-bar').MatSnackBarRef<
      import('@angular/material/snack-bar').TextOnlySnackBar
    >;
    const snackSpy = vi.spyOn(component['snackBar'], 'open').mockReturnValue(mockSnackbarRef);
    await component.save({ title: 'T', content: 'C', description: '', keywords: [] });
    expect(snackSpy).toHaveBeenCalledWith('Page saved successfully!', 'Close', { duration: 3000 });
  });

  it('should show error snackbar on save failure', async () => {
    pagesServiceSpy.savePage.mockRejectedValueOnce(new Error('Save failed'));
    const mockSnackbarRef = {
      onAction: () => ({ subscribe: vi.fn() }),
    } as unknown as import('@angular/material/snack-bar').MatSnackBarRef<
      import('@angular/material/snack-bar').TextOnlySnackBar
    >;
    const snackSpy = vi.spyOn(component['snackBar'], 'open').mockReturnValue(mockSnackbarRef);
    await component.save({ title: 'T', content: 'C', description: '', keywords: [] });
    expect(snackSpy).toHaveBeenCalledWith('Failed to save page.', 'Close', { duration: 3000 });
  });

  it('should set pageModel to empty strings if page title and content are missing', async () => {
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
    component['pageModel'].set({ title: 'Init', content: 'Init', description: '', keywords: [] });
    await component['loadPageData']('about');
    expect(component['pageModel']()).toEqual({
      title: 'Init',
      content: 'Init',
      description: '',
      keywords: [],
    });
  });
});
