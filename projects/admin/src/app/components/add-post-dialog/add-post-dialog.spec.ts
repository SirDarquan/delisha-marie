import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submit } from '@angular/forms/signals';
import { AddPostDialogComponent } from './add-post-dialog';
import { MatDialogRef } from '@angular/material/dialog';

describe('AddPostDialogComponent', () => {
  let component: AddPostDialogComponent;
  let fixture: ComponentFixture<AddPostDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddPostDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPostDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sanitize input and update previewSlug', () => {
    component.onNameChange('Garden & Backyard!');
    expect(component['sanitizedName']()).toBe('gardenbackyard');
    expect(component['previewSlug']()).toBe('gardenbackyard');

    component.onNameChange('   ');
    expect(component['sanitizedName']()).toBe('');
    expect(component['previewSlug']()).toBe('post-name');
  });

  it('should close dialog with sanitized name on submit', () => {
    component.onNameChange('Garden');
    component.onSubmit();
    expect(mockDialogRef.close).toHaveBeenCalledWith('garden');
  });

  it('should not close on submit if sanitized name is empty', () => {
    component.onNameChange('   ');
    component.onSubmit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
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
    component.onNameChange('Baking');
    await submit(component['addPostForm']);
    expect(mockDialogRef.close).toHaveBeenCalledWith('baking');
  });

  it('should handle empty or null values in onNameChange gracefully', () => {
    component.onNameChange('');
    expect(component['sanitizedName']()).toBe('');
    expect(component['previewSlug']()).toBe('post-name');

    component.onNameChange(null as unknown as string);
    expect(component['sanitizedName']()).toBe('');
  });
});
