import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePictureUploaderComponent } from './profile-picture-uploader';
import { RecipeService } from '../../services/recipe.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ProfilePictureUploaderComponent', () => {
  let component: ProfilePictureUploaderComponent;
  let fixture: ComponentFixture<ProfilePictureUploaderComponent>;
  let recipeServiceSpy: { upload: ReturnType<typeof vi.fn> };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    recipeServiceSpy = {
      upload: vi.fn().mockResolvedValue('/uploads/profile.webp'),
    };
    snackBarSpy = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfilePictureUploaderComponent],
      providers: [
        { provide: RecipeService, useValue: recipeServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePictureUploaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slotKey', 'picture1');
    fixture.componentRef.setInput('testId', 'about-pic');
    fixture.componentRef.setInput('label', 'About Page Picture');
    fixture.componentRef.setInput('description', 'Classic portrait');
    fixture.componentRef.setInput('picture', 'delisha_marie_profile.png');
    fixture.componentRef.setInput('isActive', false);
    fixture.componentRef.setInput('showActiveToggle', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label, description, and emit selectActive on button click', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('About Page Picture');
    expect(compiled.textContent).toContain('Classic portrait');

    const selectActiveSpy = vi.fn();
    component.selectActive.subscribe(selectActiveSpy);

    const btn = compiled.querySelector('[data-testid="editor-pic-about-pic"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(selectActiveSpy).toHaveBeenCalled();
  });

  it('should display Active on Home badge when isActive is true', () => {
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Active on Home');
  });

  it('should not render active button or badge when showActiveToggle is false', () => {
    fixture.componentRef.setInput('showActiveToggle', false);
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Active on Home');
    expect(compiled.querySelector('[data-testid="editor-pic-about-pic"]')).toBeNull();
  });

  it('should handle drag over and drag leave', () => {
    const mockDragEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;

    component.onDragOver(mockDragEvent);
    expect(component['isDragOver']()).toBe(true);

    component.onDragLeave();
    expect(component['isDragOver']()).toBe(false);
  });

  it('should upload file on drop event', async () => {
    const mockFile = new File(['content'], 'avatar.png', { type: 'image/png' });
    const mockDropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [mockFile],
      },
    } as unknown as DragEvent;

    const emitSpy = vi.fn();
    component.pictureChange.subscribe(emitSpy);

    component.onDrop(mockDropEvent);
    await fixture.whenStable();

    expect(recipeServiceSpy.upload).toHaveBeenCalledWith(mockFile, 'profile');
    expect(emitSpy).toHaveBeenCalledWith('/uploads/profile.webp');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Photo replaced successfully!', 'Close', {
      duration: 3000,
    });
  });

  it('should upload file on file input change', async () => {
    const mockFile = new File(['content'], 'avatar2.png', { type: 'image/png' });
    const mockChangeEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as Event;

    const emitSpy = vi.fn();
    component.pictureChange.subscribe(emitSpy);

    component.onFileSelected(mockChangeEvent);
    await fixture.whenStable();

    expect(recipeServiceSpy.upload).toHaveBeenCalledWith(mockFile, 'profile');
    expect(emitSpy).toHaveBeenCalledWith('/uploads/profile.webp');
  });

  it('should handle upload error gracefully', async () => {
    recipeServiceSpy.upload.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    await component.uploadFile(new File(['content'], 'err.png', { type: 'image/png' }));

    expect(snackBarSpy.open).toHaveBeenCalledWith('Upload error.', 'Close', { duration: 3000 });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle empty upload response', async () => {
    recipeServiceSpy.upload.mockResolvedValueOnce('');

    await component.uploadFile(new File(['content'], 'empty.png', { type: 'image/png' }));

    expect(snackBarSpy.open).toHaveBeenCalledWith('Upload failed. Please try again.', 'Close', {
      duration: 3000,
    });
  });

  it('should correctly identify absolute and local URLs', () => {
    expect(component.isAbsoluteUrl('https://example.com/pic.png')).toBe(true);
    expect(component.isAbsoluteUrl('http://example.com/pic.png')).toBe(true);
    expect(component.isAbsoluteUrl('blob:http://localhost/123')).toBe(true);
    expect(component.isAbsoluteUrl('data:image/png;base64,...')).toBe(true);
    expect(component.isAbsoluteUrl('delisha_marie_profile.png')).toBe(false);
    expect(component.isAbsoluteUrl('')).toBe(false);
  });
});
