import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KeywordsComponent } from './keywords';
import { By } from '@angular/platform-browser';

describe('KeywordsComponent', () => {
  let component: KeywordsComponent;
  let fixture: ComponentFixture<KeywordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeywordsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KeywordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a keyword', () => {
    component.value.set(['test']);
    component.addKeyword();
    expect(component.value()).toEqual(['test', '']);
  });

  it('should remove a keyword', () => {
    component.value.set(['test1', 'test2', 'test3']);
    component.removeKeyword(1);
    expect(component.value()).toEqual(['test1', 'test3']);
  });

  it('should update a keyword on input', () => {
    component.value.set(['test1', 'test2']);
    const event = { target: { value: 'updated' } } as unknown as Event;
    component.onKeywordInput(1, event);
    expect(component.value()).toEqual(['test1', 'updated']);
  });

  it('should handle undefined model gracefully on update', () => {
    component.value.set(undefined as unknown as string[]);
    const event = { target: { value: 'updated' } } as unknown as Event;
    component.onKeywordInput(0, event);
    expect(component.value()).toEqual([]);
  });

  it('should call addKeyword when add button is clicked', () => {
    vi.spyOn(component, 'addKeyword');
    const addButton = fixture.debugElement.query(By.css('button'));
    addButton.triggerEventHandler('click', null);
    expect(component.addKeyword).toHaveBeenCalled();
  });

  it('should call removeKeyword when close button is clicked', () => {
    component.value.set(['test1']);
    fixture.detectChanges();
    vi.spyOn(component, 'removeKeyword');
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    // First button is 'Add Keyword', second is the close button on the chip
    buttons[1].triggerEventHandler('click', null);
    expect(component.removeKeyword).toHaveBeenCalledWith(0);
  });

  it('should call onKeywordInput when input value changes', () => {
    component.value.set(['test1']);
    fixture.detectChanges();
    vi.spyOn(component, 'onKeywordInput');
    const input = fixture.debugElement.query(By.css('input'));
    const eventObj = { target: { value: 'test2' } };
    input.triggerEventHandler('input', eventObj);
    expect(component.onKeywordInput).toHaveBeenCalledWith(0, eventObj);
  });

  it('should calculate size correctly for long and short keywords in template', () => {
    component.value.set(['short', 'verylongkeyword']);
    fixture.detectChanges();

    const inputs = fixture.debugElement.queryAll(By.css('input'));
    expect(inputs[0].attributes['size']).toBe('10');
    expect(inputs[1].attributes['size']).toBe('17');
  });

  it('should show empty message when no keywords', () => {
    component.value.set([]);
    fixture.detectChanges();
    const emptyMsg = fixture.debugElement.query(By.css('span.italic'));
    expect(emptyMsg.nativeElement.textContent.trim()).toContain('No keywords added yet');
  });

  it('should hide empty message when there are keywords', () => {
    component.value.set(['test']);
    fixture.detectChanges();
    const emptyMsg = fixture.debugElement.query(By.css('span.italic'));
    expect(emptyMsg).toBeNull();
  });

  it('should show empty message when keywords array is falsy', () => {
    component.value.set(undefined as unknown as string[]);
    fixture.detectChanges();
    const emptyMsg = fixture.debugElement.query(By.css('span.italic'));
    expect(emptyMsg.nativeElement.textContent.trim()).toContain('No keywords added yet');
  });
});
