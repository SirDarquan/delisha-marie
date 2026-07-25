import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { StoryHtmlEditorComponent } from './story-html-editor';
import { RecipeService } from '../../services/recipe.service';
import { vi } from 'vitest';
import { of } from 'rxjs';

describe('StoryHtmlEditorComponent', () => {
  let component: StoryHtmlEditorComponent;
  let fixture: ComponentFixture<StoryHtmlEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryHtmlEditorComponent],
      providers: [
        {
          provide: RecipeService,
          useValue: { upload: vi.fn().mockResolvedValue('/2026/07/uploaded.webp') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryHtmlEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render content inside contenteditable canvas', async () => {
    fixture.componentRef.setInput('value', '<p>Hello story world</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const canvas = compiled.querySelector('.recipe-story') as HTMLDivElement;
    expect(canvas).toBeTruthy();
    expect(canvas.innerHTML).toBe('<p>Hello story world</p>');
  });

  it('should update content signal on user input', () => {
    const canvasEl = component.editorCanvas()?.nativeElement;
    if (canvasEl) {
      canvasEl.innerHTML = '<p>Updated content</p>';
    }
    component.onInput();

    expect(component.content()).toBe('<p>Updated content</p>');
  });

  it('should execute execCmd', () => {
    if (typeof document.execCommand !== 'function') {
      document.execCommand = () => true;
    }
    const execSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true);
    component.execCmd('bold');

    expect(execSpy).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('should expand relative image src with base URL for display canvas', async () => {
    fixture.componentRef.setInput('value', '<img src="/2026/07/pic.webp">');
    fixture.detectChanges();
    await fixture.whenStable();

    const canvasEl = component.editorCanvas()?.nativeElement;
    expect(canvasEl?.innerHTML).toContain('https://ik.imagekit.io/delishamarie/2026/07/pic.webp');
  });

  it('should strip base URL on user input so format only stores relative path', () => {
    const canvasEl = component.editorCanvas()?.nativeElement;
    if (canvasEl) {
      canvasEl.innerHTML = '<img src="https://ik.imagekit.io/delishamarie/2026/07/pic.webp">';
    }
    component.onInput();

    expect(component.value()).toBe('<img src="/2026/07/pic.webp">');
  });

  it('should trigger image file input click', () => {
    const inputEl = component.imageFileInput()?.nativeElement;
    if (inputEl) {
      const spy = vi.spyOn(inputEl, 'click');
      component.triggerImageUpload();
      expect(spy).toHaveBeenCalled();
    }
  });

  it('should handle onFileSelected when file is selected', async () => {
    if (typeof document.execCommand !== 'function') {
      document.execCommand = () => true;
    }
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = () => 'blob:http://localhost/test';
    }
    const execSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true);
    execSpy.mockClear();

    const fakeFile = new File(['fake content'], 'test.png', { type: 'image/png' });
    const event = {
      target: {
        files: [fakeFile],
      },
    } as unknown as Event;

    await component.onFileSelected(event);

    expect(execSpy).toHaveBeenCalledWith(
      'insertImage',
      false,
      'https://ik.imagekit.io/delishamarie/2026/07/uploaded.webp',
    );
  });

  it('should open figure dialog and wrap image into nested figures on save', async () => {
    fixture.componentRef.setInput('value', '<img src="/2026/07/test.webp">');
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () =>
        of({
          outerFigureClass: 'outer-wrap',
          innerFigureClass: 'inner-wrap',
          imgClass: 'custom-img',
          captionText: 'My Test Caption',
          captionClass: 'caption-style',
        }),
    } as unknown as ReturnType<MatDialog['open']>);

    const canvasEl = component.editorCanvas()?.nativeElement;
    const imgEl = canvasEl?.querySelector('img');
    if (imgEl) {
      component.onCanvasClick({ target: imgEl } as unknown as Event);
    }

    component.openFigureDialog();

    expect(openSpy).toHaveBeenCalled();
    expect(component.value()).toContain('class="outer-wrap"');
    expect(component.value()).toContain('class="inner-wrap"');
    expect(component.value()).toContain('class="custom-img"');
    expect(component.value()).toContain('My Test Caption');
  });

  it('should add active-highlight class on element click', async () => {
    fixture.componentRef.setInput('value', '<img src="/2026/07/test.webp">');
    fixture.detectChanges();
    await fixture.whenStable();

    const canvasEl = component.editorCanvas()?.nativeElement;
    const imgEl = canvasEl?.querySelector('img');
    if (imgEl) {
      component.onCanvasClick({ target: imgEl } as unknown as Event);
      expect(imgEl.classList.contains('active-highlight')).toBe(true);
    }
  });
});
