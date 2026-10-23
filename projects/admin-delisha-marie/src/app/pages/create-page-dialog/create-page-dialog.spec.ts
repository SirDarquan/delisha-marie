import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePageDialogComponent } from './create-page-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('CreatePageDialogComponent', () => {
  let component: CreatePageDialogComponent;
  let fixture: ComponentFixture<CreatePageDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CreatePageDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { activePost: 'kitchen' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with injected activePost', () => {
    expect(component).toBeTruthy();
    expect(component['activePost']).toBe('kitchen');
  });

  it('should auto-slugify title if slug has not been manually edited', () => {
    component.onTitleChange('Frequently Asked Questions');
    expect(component['slug']).toBe('frequently-asked-questions');
  });

  it('should preserve manual slug edits and not overwrite when title changes', () => {
    component.onSlugChange('custom-faq');
    expect(component['slug']).toBe('custom-faq');

    component.onTitleChange('New Title Here');
    expect(component['slug']).toBe('custom-faq');
  });

  it('should close dialog with title, slug, and fullSlug on submit', () => {
    component.onTitleChange('Privacy Policy');
    component.onSubmit();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      fullSlug: 'kitchen:privacy-policy',
    });
  });

  it('should not submit if title or slug is empty', () => {
    component['title'] = '   ';
    component['slug'] = '';
    component.onSubmit();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
