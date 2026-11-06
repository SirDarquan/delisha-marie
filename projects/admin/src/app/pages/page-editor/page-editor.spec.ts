import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageEditorComponent } from './page-editor';
import { PagesService } from '../../services/pages.service';
import { RecipeService } from '../../services/recipe.service';
import { provideRouter } from '@angular/router';
import { Location } from '@angular/common';

describe('PageEditorComponent', () => {
  let component: PageEditorComponent;
  let fixture: ComponentFixture<PageEditorComponent>;
  let pagesServiceSpy: { getPage: ReturnType<typeof vi.fn>; savePage: ReturnType<typeof vi.fn> };
  let recipeServiceSpy: { upload: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pagesServiceSpy = {
      getPage: vi
        .fn()
        .mockResolvedValue({ slug: 'about', title: 'About', content: '<p>Content</p>' }),
      savePage: vi.fn(),
    };
    recipeServiceSpy = {
      upload: vi.fn().mockResolvedValue('uploaded-profile.webp'),
    };

    await TestBed.configureTestingModule({
      imports: [PageEditorComponent],
      providers: [
        provideRouter([{ path: 'pages', component: PageEditorComponent }]),
        { provide: PagesService, useValue: pagesServiceSpy },
        { provide: RecipeService, useValue: recipeServiceSpy },
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

  it('should set pageModel to default values if page title and content are missing', async () => {
    pagesServiceSpy.getPage.mockResolvedValueOnce({ slug: 'about' });
    await component['loadPageData']('about');
    expect(component['pageModel']()).toEqual({
      title: '',
      content: '',
      description: '',
      keywords: [],
      featuredRecipes1: '/recipes/dinner',
      featuredRecipes2: '/recipes/breakfast',
      featuredRecipes3: '/recipes/lunch',
      picture: 'delisha_marie_profile_2.png',
      picture1: 'delisha_marie_profile.png',
      picture2: 'delisha_marie_profile_2.png',
    });
  });

  it('should not update pageModel if getPage returns falsy', async () => {
    pagesServiceSpy.getPage.mockResolvedValueOnce(null);
    component['pageModel'].set({
      title: 'Init',
      content: 'Init',
      description: '',
      keywords: [],
      featuredRecipes1: '',
      featuredRecipes2: '',
      featuredRecipes3: '',
      picture: '',
      picture1: '',
      picture2: '',
    });
    await component['loadPageData']('about');
    expect(component['pageModel']()).toEqual({
      title: 'Init',
      content: 'Init',
      description: '',
      keywords: [],
      featuredRecipes1: '',
      featuredRecipes2: '',
      featuredRecipes3: '',
      picture: '',
      picture1: '',
      picture2: '',
    });
  });

  it('should load kitchen:home json configuration and save stringified json', async () => {
    component['slug'].set('kitchen:home');
    expect(component.isKitchenHome()).toBe(true);

    pagesServiceSpy.getPage.mockResolvedValueOnce({
      slug: 'kitchen:home',
      title: 'Kitchen Home',
      content: JSON.stringify({
        featuredRecipes: ['/recipes/custom-1', '', '/recipes/custom-3'],
        picture1: 'custom-about.png',
        picture2: 'custom-kitchen.png',
        picture: 'custom-about.png',
        content: '<p>Custom Home Blocks</p>',
      }),
    });

    await component['loadPageData']('kitchen:home');
    expect(component['pageModel']().featuredRecipes1).toBe('/recipes/custom-1');
    expect(component['pageModel']().featuredRecipes2).toBe('');
    expect(component['pageModel']().featuredRecipes3).toBe('/recipes/custom-3');
    expect(component['pageModel']().picture1).toBe('custom-about.png');
    expect(component['pageModel']().picture2).toBe('custom-kitchen.png');
    expect(component['pageModel']().picture).toBe('custom-about.png');
    expect(component['pageModel']().content).toBe('<p>Custom Home Blocks</p>');

    // Now test save
    pagesServiceSpy.savePage.mockResolvedValueOnce(null);
    await component.save({
      title: 'Kitchen Home',
      content: '<p>Updated Blocks</p>',
      description: 'Home SEO',
      keywords: ['kitchen', 'home'],
      featuredRecipes1: '/recipes/dinner',
      featuredRecipes2: '',
      featuredRecipes3: '/recipes/lunch',
      picture1: 'custom-about.png',
      picture2: 'custom-kitchen.png',
      picture: 'custom-about.png',
    });

    expect(pagesServiceSpy.savePage).toHaveBeenCalledWith('kitchen:home', {
      title: 'Kitchen Home',
      content: JSON.stringify({
        featuredRecipes: ['/recipes/dinner', '', '/recipes/lunch'],
        picture1: 'custom-about.png',
        picture2: 'custom-kitchen.png',
        picture: 'custom-about.png',
        content: '<p>Updated Blocks</p>',
      }),
      description: 'Home SEO',
      keywords: ['kitchen', 'home'],
    });
  });

  it('should render 2 picture cards when isKitchenHome is true and select picture on click', async () => {
    component['slug'].set('kitchen:home');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('About Me Profile Pictures');
    expect(compiled.textContent).toContain('About Page Picture');
    expect(compiled.textContent).toContain('Kitchen Home Picture');

    const aboutPicBtn = compiled.querySelector(
      '[data-testid="editor-pic-about-pic"]',
    ) as HTMLButtonElement;
    expect(aboutPicBtn).toBeTruthy();
    aboutPicBtn.click();
    fixture.detectChanges();

    expect(component['pageForm'].picture().value()).toBe('delisha_marie_profile.png');
  });

  it('should upload a replacement photo via file input and update picture slot and active picture', async () => {
    component['slug'].set('kitchen:home');
    component['pageModel'].update((m) => ({
      ...m,
      picture: 'delisha_marie_profile.png',
      picture1: 'delisha_marie_profile.png',
      picture2: 'delisha_marie_profile_2.png',
    }));
    fixture.detectChanges();

    const file = new File(['mock'], 'new_photo.png', { type: 'image/png' });
    recipeServiceSpy.upload.mockResolvedValueOnce('/uploads/new_photo.webp');

    await component.uploadFile(file, 'picture1');

    expect(recipeServiceSpy.upload).toHaveBeenCalledWith(file, 'profile');
    expect(component['pageModel']().picture1).toBe('/uploads/new_photo.webp');
    // Active picture was picture1, so it should also update
    expect(component['pageModel']().picture).toBe('/uploads/new_photo.webp');
  });

  it('should upload a replacement photo for picture2 and keep picture active if different', async () => {
    component['slug'].set('kitchen:home');
    component['pageModel'].update((m) => ({
      ...m,
      picture: 'delisha_marie_profile.png',
      picture1: 'delisha_marie_profile.png',
      picture2: 'delisha_marie_profile_2.png',
    }));
    fixture.detectChanges();

    const file = new File(['mock'], 'kitchen_photo.png', { type: 'image/png' });
    recipeServiceSpy.upload.mockResolvedValueOnce('/uploads/kitchen_photo.webp');

    await component.uploadFile(file, 'picture2');

    expect(recipeServiceSpy.upload).toHaveBeenCalledWith(file, 'profile');
    expect(component['pageModel']().picture2).toBe('/uploads/kitchen_photo.webp');
    // Active picture was picture1, so picture remains picture1
    expect(component['pageModel']().picture).toBe('delisha_marie_profile.png');
  });

  it('should handle drag and drop and file selection events', () => {
    const mockDragEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [new File([''], 'drop.png', { type: 'image/png' })],
      },
    } as unknown as DragEvent;

    component.onDragOver(mockDragEvent, 'picture1');
    expect(component['isDragOver']().picture1).toBe(true);

    component.onDragLeave('picture1');
    expect(component['isDragOver']().picture1).toBe(false);

    const uploadSpy = vi.spyOn(component, 'uploadFile').mockResolvedValue();
    component.onDrop(mockDragEvent, 'picture1');
    expect(uploadSpy).toHaveBeenCalled();

    const mockChangeEvent = {
      target: {
        files: [new File([''], 'input.png', { type: 'image/png' })],
      },
    } as unknown as Event;
    component.onFileSelected(mockChangeEvent, 'picture2');
    expect(uploadSpy).toHaveBeenCalled();
  });

  it('should correctly identify absolute and local URLs', () => {
    expect(component.isAbsoluteUrl('https://example.com/pic.png')).toBe(true);
    expect(component.isAbsoluteUrl('http://example.com/pic.png')).toBe(true);
    expect(component.isAbsoluteUrl('blob:http://localhost/123')).toBe(true);
    expect(component.isAbsoluteUrl('data:image/png;base64,...')).toBe(true);
    expect(component.isAbsoluteUrl('delisha_marie_profile.png')).toBe(false);
    expect(component.isAbsoluteUrl('')).toBe(false);
  });

  it('should load slug from route in ngOnInit, submit form, and handle cancel button clicks', async () => {
    const route = TestBed.inject((await import('@angular/router')).ActivatedRoute);
    vi.spyOn(route.snapshot.paramMap, 'get').mockReturnValue('about');
    component.ngOnInit();
    expect(component['slug']()).toBe('about');

    // Trigger form submission action when valid
    component['pageModel'].set({
      title: 'Valid Title',
      content: '<p>Body</p>',
      description: 'Desc',
      keywords: ['tag'],
      featuredRecipes1: '',
      featuredRecipes2: '',
      featuredRecipes3: '',
      picture: '',
      picture1: '',
      picture2: '',
    });
    fixture.detectChanges();
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    formEl.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    // Trigger cancel buttons in template
    const location = TestBed.inject(Location);
    const locationSpy = vi.spyOn(location, 'back');
    const cancelBtns = fixture.nativeElement.querySelectorAll('button[type="button"]');
    cancelBtns.forEach((btn: HTMLElement) => btn.click());
    expect(locationSpy).toHaveBeenCalled();
  }, 15000);
});
