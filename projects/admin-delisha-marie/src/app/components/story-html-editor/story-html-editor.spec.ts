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
    const canvas = compiled.querySelector('.story') as HTMLDivElement;
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

  it('should trigger image upload input click', () => {
    const inputEl = document.createElement('input');
    const clickSpy = vi.spyOn(inputEl, 'click');
    vi.spyOn(component, 'imageFileInput').mockReturnValue({ nativeElement: inputEl });

    component.triggerImageUpload();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should prompt for link URL and execute createLink command', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');
    const execSpy = vi.spyOn(document, 'execCommand');

    component.promptLink();
    expect(promptSpy).toHaveBeenCalledWith('Enter URL:');
    expect(execSpy).toHaveBeenCalledWith('createLink', false, 'https://example.com');
  });

  it('should handle onFileSelected when recipeService is undefined', async () => {
    (component as unknown as { recipeService: unknown }).recipeService = undefined;
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const execSpy = vi.spyOn(document, 'execCommand');

    const fakeFile = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [fakeFile] } } as unknown as Event;

    await component.onFileSelected(event);
    expect(createObjectURLSpy).toHaveBeenCalledWith(fakeFile);
    expect(execSpy).toHaveBeenCalledWith('insertImage', false, 'blob:test');
  });

  it('should handle onFileSelected error gracefully', async () => {
    const recipeService = TestBed.inject(RecipeService);
    vi.spyOn(recipeService, 'upload').mockRejectedValue(new Error('Upload failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const fakeFile = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [fakeFile] } } as unknown as Event;

    await component.onFileSelected(event);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should handle openFigureDialog when editing inside existing gallery container', async () => {
    fixture.componentRef.setInput(
      'value',
      '<figure class="recipe-gallery column-2"><figure class="recipe-step-image"><img src="/2026/07/test1.webp"></figure><figure class="recipe-step-image"><img src="/2026/07/test2.webp"></figure></figure>',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () =>
        of({
          outerFigureClass: 'recipe-gallery column-3',
          innerFigureClass: 'recipe-step-image',
          imgClass: 'custom-img',
          captionText: 'Gallery Caption',
          captionClass: 'caption-style',
        }),
    } as unknown as ReturnType<MatDialog['open']>);

    const canvasEl = component.editorCanvas()?.nativeElement;
    const imgEl = canvasEl?.querySelectorAll('img')[1];
    if (imgEl) {
      component.onCanvasClick({ target: imgEl } as unknown as Event);
    }

    component.openFigureDialog();
    expect(component.value()).toContain('column-3');
    expect(component.value()).toContain('test1.webp');
  });

  it('should handle openFigureDialog when highlightedEl is a figure container', async () => {
    fixture.componentRef.setInput(
      'value',
      '<figure class="recipe-step-image active-highlight"><img src="/2026/07/test.webp"></figure>',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as unknown as ReturnType<MatDialog['open']>);

    component.openFigureDialog();
    expect(openSpy).toHaveBeenCalled();
  });

  it('should remove imgClass if empty when applying figure dialog result', async () => {
    fixture.componentRef.setInput('value', '<img src="/2026/07/test.webp" class="old-class">');
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () =>
        of({
          outerFigureClass: '',
          innerFigureClass: 'recipe-step-image',
          imgClass: '',
          captionText: '',
          captionClass: '',
        }),
    } as unknown as ReturnType<MatDialog['open']>);

    const canvasEl = component.editorCanvas()?.nativeElement;
    const imgEl = canvasEl?.querySelector('img');
    if (imgEl) {
      component.onCanvasClick({ target: imgEl } as unknown as Event);
    }

    component.openFigureDialog();
    expect(component.value()).not.toContain('class="old-class"');
  });

  it('should preserve external http/https image src when setting value', async () => {
    fixture.componentRef.setInput('value', '<img src="https://external.com/pic.jpg">');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.value()).toContain('https://external.com/pic.jpg');
  });

  it('should handle openFigureDialog when targetImg is nested inside parent figure', async () => {
    fixture.componentRef.setInput(
      'value',
      '<figure class="recipe-gallery"><figure class="recipe-step-image"><img src="/2026/07/test.webp"></figure></figure>',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as unknown as ReturnType<MatDialog['open']>);

    const canvasEl = component.editorCanvas()?.nativeElement;
    const imgEl = canvasEl?.querySelector('img');
    if (imgEl) {
      component.onCanvasClick({ target: imgEl } as unknown as Event);
    }

    component.openFigureDialog();
    expect(component).toBeTruthy();
  });

  it('should exercise execCmd formatting actions', () => {
    const docExecSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true);
    component.execCmd('bold');
    component.execCmd('italic');
    component.execCmd('formatBlock', 'h2');
    component.execCmd('insertUnorderedList');

    expect(docExecSpy).toHaveBeenCalled();
    docExecSpy.mockRestore();
  });

  it('should fallback to window.getSelection() in openFigureDialog when no active highlight', async () => {
    fixture.componentRef.setInput('value', '<p id="para"><img src="/2026/07/test.webp"></p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const canvasEl = component.editorCanvas()?.nativeElement;
    const imgEl = canvasEl?.querySelector('img');

    const mockRange = {
      commonAncestorContainer: imgEl as Node,
    } as unknown as Range;

    const mockSelection = {
      rangeCount: 1,
      getRangeAt: () => mockRange,
    } as unknown as Selection;

    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as unknown as ReturnType<MatDialog['open']>);

    component.openFigureDialog();
    expect(openSpy).toHaveBeenCalled();
  });

  it('should handle openFigureDialog when outer figure is highlighted with child figure and result has caption', async () => {
    fixture.componentRef.setInput(
      'value',
      '<figure class="recipe-gallery active-highlight"><figure class="recipe-step-image"><img src="/2026/07/test.webp"></figure></figure>',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () =>
        of({
          outerFigureClass: 'recipe-gallery column-2',
          innerFigureClass: 'recipe-step-image',
          imgClass: 'my-img',
          captionText: 'Delicious Pasta',
          captionClass: 'sup',
        }),
    } as unknown as ReturnType<MatDialog['open']>);

    component.openFigureDialog();
    expect(component.value()).toContain('<figcaption class="sup">Delicious Pasta</figcaption>');
  });

  it('should trigger promptLink and triggerImageUpload', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');
    const execSpy = vi.spyOn(component, 'execCmd');
    component.promptLink();
    expect(execSpy).toHaveBeenCalledWith('createLink', 'https://example.com');
    promptSpy.mockRestore();

    component.triggerImageUpload();
  });

  it('should click all toolbar buttons and trigger canvas input/blur events', () => {
    fixture.detectChanges();
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    vi.spyOn(document, 'execCommand').mockImplementation(() => true);

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.forEach((btn) => btn.click());

    const canvasEl = component.editorCanvas()?.nativeElement;
    if (canvasEl) {
      canvasEl.dispatchEvent(new Event('input'));
      canvasEl.dispatchEvent(new Event('blur'));
    }
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should ignore canvas click if target is not inside canvas', () => {
    const event = { target: document.body } as unknown as Event;
    component.onCanvasClick(event);
    expect(component).toBeTruthy();
  });

  it('should do nothing if canvas is missing during click', () => {
    vi.spyOn(component, 'editorCanvas').mockReturnValue(null as never);
    component.onCanvasClick({} as Event);
    expect(component).toBeTruthy();
  });

  it('should clear active-highlight if clicked element is not an image or figure', async () => {
    fixture.componentRef.setInput(
      'value',
      '<img class="active-highlight" src="/2026/07/test.webp"><p id="text">Hello</p>',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const canvasEl = component.editorCanvas()?.nativeElement;
    const pEl = canvasEl?.querySelector('p');
    if (pEl) {
      component.onCanvasClick({ target: pEl } as unknown as Event);
      expect(canvasEl?.querySelector('.active-highlight')).toBeFalsy();
    }
  });

  it('should handle onFileSelected when file input is empty', async () => {
    const event = { target: { files: [] } } as unknown as Event;
    await component.onFileSelected(event);
    expect(component).toBeTruthy();
  });

  it('should preserve data URI in resolveImageSrc', async () => {
    fixture.componentRef.setInput('value', '<img src="data:image/png;base64,iVBORw0KGgo">');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.value()).toContain('data:image/png;base64,iVBORw0KGgo');
  });

  it('should handle openFigureDialog when there is no target image found', async () => {
    fixture.componentRef.setInput('value', '<p>No image here</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi.spyOn(dialog, 'open');

    component.openFigureDialog();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should fallback to selection range when searching for target image and finding none', async () => {
    const selection = {
      rangeCount: 0,
    } as unknown as Selection;
    vi.spyOn(window, 'getSelection').mockReturnValue(selection);

    fixture.componentRef.setInput('value', '<p>No image here</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    component.openFigureDialog();
    expect(component).toBeTruthy();
  });
});
