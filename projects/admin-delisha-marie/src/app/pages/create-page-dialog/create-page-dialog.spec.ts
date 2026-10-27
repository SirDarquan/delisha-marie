import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submit } from '@angular/forms/signals';
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
    expect(component['normalizedSlug']()).toBe('frequently-asked-questions');
  });

  it('should preserve manual slug edits and not overwrite when title changes', () => {
    component.onSlugChange('custom-faq');
    expect(component['normalizedSlug']()).toBe('custom-faq');

    component.onTitleChange('New Title Here');
    expect(component['normalizedSlug']()).toBe('custom-faq');
  });

  it('should sanitize slug on direct input via onSlugInput', () => {
    component['createPageForm'].slug().value.set('My Custom Slug!');
    component.onSlugInput();
    expect(component['normalizedSlug']()).toBe('my-custom-slug');
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
    component.onTitleChange('   ');
    component.onSubmit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    component.onTitleChange('Valid Title');
    component.onSlugChange('   ');
    component.onSubmit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should trigger onSlugInput from template input event', async () => {
    const inputEl = fixture.nativeElement.querySelector('#pageSlug') as HTMLInputElement;
    expect(inputEl).toBeTruthy();
    inputEl.value = 'Custom Live Slug!';
    inputEl.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component['createPageForm'].slug().value()).toBe('custom-live-slug');
    expect(component['userEditedSlug']).toBe(true);
  });

  it('should close dialog when Cancel button is clicked in template', () => {
    const cancelBtn = fixture.nativeElement.querySelector(
      'button[type="button"]',
    ) as HTMLButtonElement;
    expect(cancelBtn).toBeTruthy();
    cancelBtn.click();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should execute form submission action callback and call onSubmit', async () => {
    component.onTitleChange('Terms of Service');
    await submit(component['createPageForm']);

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      title: 'Terms of Service',
      slug: 'terms-of-service',
      fullSlug: 'kitchen:terms-of-service',
    });
  });

  it('should evaluate canSubmit properly', () => {
    component.onTitleChange('');
    expect(component['canSubmit']()).toBe(false);

    component.onTitleChange('Some Title');
    expect(component['canSubmit']()).toBe(true);
  });

  it('should default activePost to "home" when MAT_DIALOG_DATA is not provided', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreatePageDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    const noDataFixture = TestBed.createComponent(CreatePageDialogComponent);
    expect(noDataFixture.componentInstance['activePost']).toBe('home');
  });

  it('should handle falsy values for activePost fallback, empty onSlugInput, empty onSlugChange, and non-string title', async () => {
    // Empty activePost string in data falls back to 'home'
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreatePageDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { activePost: '' } },
      ],
    }).compileComponents();
    const emptyPostFixture = TestBed.createComponent(CreatePageDialogComponent);
    expect(emptyPostFixture.componentInstance['activePost']).toBe('home');

    // Empty current value in onSlugInput
    component['createPageForm'].slug().value.set('');
    component.onSlugInput();
    expect(component['createPageForm'].slug().value()).toBe('');

    // Empty newSlug in onSlugChange
    component.onSlugChange('');
    expect(component['normalizedSlug']()).toBe('');

    // Non-string value in title signal subscription
    component['createPageForm'].title().value.set(null as unknown as string);
    fixture.detectChanges();
    await fixture.whenStable();

    // Title signal subscription when userEditedSlug is true
    component['userEditedSlug'] = true;
    component['createPageForm'].title().value.set('Ignored Auto Slug');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});
