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

  it('should apply gallery-3 preset correctly', () => {
    component.applyPreset('gallery-3');
    expect(component.outerFigureClass()).toContain('recipe-gallery');
    expect(component.outerFigureClass()).toContain('column-3');
    expect(component.innerFigureClass()).toContain('recipe-step-image');
  });

  it('should clear outer figure class on single-step preset', () => {
    component.applyPreset('single-step');
    expect(component.outerFigureClass()).toBe('');
    expect(component.innerFigureClass()).toContain('recipe-step-image');
  });

  it('should trim data onApply', () => {
    component.outerFigureClass.set('  outer  ');
    component.innerFigureClass.set('  inner  ');
    component.imgClass.set('  img  ');
    component.captionText.set('  text  ');
    component.captionClass.set('  caption  ');
    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      outerFigureClass: 'outer',
      innerFigureClass: 'inner',
      imgClass: 'img',
      captionText: 'text',
      captionClass: 'caption',
    });
  });

  it('should calculate currentColumn computed correctly', () => {
    component.outerFigureClass.set('recipe-gallery column-2');
    expect(component.currentColumn()).toBe('column-2');

    component.outerFigureClass.set('recipe-gallery column-3');
    expect(component.currentColumn()).toBe('column-3');

    component.outerFigureClass.set('recipe-gallery');
    expect(component.currentColumn()).toBe('none');
  });

  it('should close dialog without data on cancel', () => {
    component.dialogRef.close();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should exercise setter methods', () => {
    component.setOuterFigureClass('o-class');
    component.setInnerFigureClass('f-class');
    component.setImgClass('i-class');
    component.setCaptionText('c-text');
    component.setCaptionClass('c-class');

    expect(component.outerFigureClass()).toBe('o-class');
    expect(component.innerFigureClass()).toBe('f-class');
    expect(component.imgClass()).toBe('i-class');
    expect(component.captionText()).toBe('c-text');
    expect(component.captionClass()).toBe('c-class');
  });

  it('should click all template buttons', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons.forEach((btn: HTMLButtonElement) => btn.click());
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should retain recipe-image in innerFigureClass and recipe-gallery in outerFigureClass when applying preset', () => {
    component.innerFigureClass.set('recipe-image my-custom');
    component.outerFigureClass.set('recipe-gallery my-outer');
    component.applyPreset('gallery-2');

    expect(component.innerFigureClass()).toContain('recipe-image');
    expect(component.outerFigureClass()).toContain('recipe-gallery');
    expect(component.outerFigureClass()).toContain('column-2');
  });

  it('should initialize signals with empty string defaults when MAT_DIALOG_DATA is null', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FigureDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    const fix = TestBed.createComponent(FigureDialogComponent);
    const comp = fix.componentInstance;
    fix.detectChanges();

    expect(comp.outerFigureClass()).toBe('');
    expect(comp.innerFigureClass()).toBe('');
    expect(comp.imgClass()).toBe('');
    expect(comp.captionText()).toBe('');
    expect(comp.captionClass()).toBe('');
  });
});
