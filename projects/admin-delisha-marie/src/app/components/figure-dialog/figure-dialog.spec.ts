import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FigureDialogComponent, FigureDialogData } from './figure-dialog';
import { vi } from 'vitest';

describe('FigureDialogComponent', () => {
  let component: FigureDialogComponent;
  let fixture: ComponentFixture<FigureDialogComponent>;
  const mockDialogRef = {
    close: vi.fn(),
  };

  const initialData: FigureDialogData = {
    outerFigureClass: 'outer-class',
    innerFigureClass: 'inner-class',
    imgClass: 'img-class',
    captionText: 'Test Caption',
    captionClass: 'caption-class',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FigureDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: initialData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FigureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create FigureDialogComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should pre-populate form signals with dialog data', () => {
    expect(component.outerFigureClass()).toBe('outer-class');
    expect(component.innerFigureClass()).toBe('inner-class');
    expect(component.imgClass()).toBe('img-class');
    expect(component.captionText()).toBe('Test Caption');
    expect(component.captionClass()).toBe('caption-class');
  });

  it('should close dialog with updated data onApply', () => {
    component.outerFigureClass.set('new-outer');
    component.captionText.set('New Caption');
    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      outerFigureClass: 'new-outer',
      innerFigureClass: 'inner-class',
      imgClass: 'img-class',
      captionText: 'New Caption',
      captionClass: 'caption-class',
    });
  });

  it('should apply gallery-2 preset correctly', () => {
    component.applyPreset('gallery-2');
    expect(component.outerFigureClass()).toContain('recipe-gallery');
    expect(component.outerFigureClass()).toContain('column-2');
    expect(component.outerFigureClass()).not.toContain('column-3');
    expect(component.innerFigureClass()).toContain('recipe-step-image');
  });

  it('should clear outer figure class on single-step preset', () => {
    component.applyPreset('single-step');
    expect(component.outerFigureClass()).toBe('');
    expect(component.innerFigureClass()).toContain('recipe-step-image');
  });
});
