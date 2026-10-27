import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
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
  }, 30000);

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

  it('should execute execCmd using Selection and Range on selected text', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>Hello World</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.execCmd('bold');
    expect(component.value()).toContain('<strong>Hello</strong> World');
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
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = () => 'blob:http://localhost/test';
    }
    const execSpy = vi.spyOn(component, 'execCmd');

    const fakeFile = new File(['fake content'], 'test.png', { type: 'image/png' });
    const event = {
      target: {
        files: [fakeFile],
      },
    } as unknown as Event;

    await component.onFileSelected(event);

    expect(execSpy).toHaveBeenCalledWith(
      'insertImage',
      'https://ik.imagekit.io/delishamarie/2026/07/uploaded.webp',
    );
    expect(component.value()).toContain('src="/2026/07/uploaded.webp"');
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
    const execSpy = vi.spyOn(component, 'execCmd');

    component.promptLink();
    expect(promptSpy).toHaveBeenCalledWith('Enter URL:');
    expect(execSpy).toHaveBeenCalledWith('createLink', 'https://example.com');
    expect(component.value()).toContain('<a href="https://example.com">https://example.com</a>');
  });

  it('should handle onFileSelected when recipeService is undefined', async () => {
    (component as unknown as { recipeService: unknown }).recipeService = undefined;
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const execSpy = vi.spyOn(component, 'execCmd');

    const fakeFile = new File(['fake'], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [fakeFile] } } as unknown as Event;

    await component.onFileSelected(event);
    expect(createObjectURLSpy).toHaveBeenCalledWith(fakeFile);
    expect(execSpy).toHaveBeenCalledWith('insertImage', 'blob:test');
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

  it('should exercise all Selection/Range inline, block, list, divider, and clear formatting actions', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;

    // 1. Non-collapsed inline formatting (italic, underline, strikeThrough, highlight, code, createLink)
    for (const [cmd, tag, val] of [
      ['italic', 'em', undefined],
      ['underline', 'u', undefined],
      ['strikeThrough', 's', undefined],
      ['highlight', 'mark', undefined],
      ['code', 'code', undefined],
      ['createLink', 'a', 'https://delishamarie.com'],
    ] as const) {
      canvasEl.innerHTML = '<p>Format me</p>';
      const textNode = canvasEl.querySelector('p')!.firstChild!;
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 6);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      component.execCmd(cmd, val);
      expect(component.value()).toContain(`<${tag}`);
    }

    // 2. Block formatting when an existing block is selected vs non-collapsed text node directly in canvas vs empty canvas
    canvasEl.innerHTML = '<p>Heading text</p>';
    const pText = canvasEl.querySelector('p')!.firstChild!;
    const blockRange = document.createRange();
    blockRange.setStart(pText, 0);
    blockRange.setEnd(pText, 7);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(blockRange);

    component.execCmd('formatBlock', '<h2>');
    expect(component.value()).toContain('<h2>Heading text</h2>');

    component.execCmd('formatBlock', '<h3>');
    expect(component.value()).toContain('<h3>Heading text</h3>');

    component.execCmd('formatBlock', '<h4>');
    expect(component.value()).toContain('<h4>Heading text</h4>');

    component.execCmd('formatBlock', '<blockquote>');
    expect(component.value()).toContain('<blockquote>Heading text</blockquote>');

    component.execCmd('callout');
    expect(component.value()).toContain('<div class="recipe-tip">Heading text</div>');

    component.execCmd('formatBlock');
    expect(component.value()).toContain('<p>Heading text</p>');

    // 3. List formatting on existing block & on raw text selection
    component.execCmd('insertUnorderedList');
    expect(component.value()).toContain('<ul><li>Heading text</li></ul>');

    component.execCmd('insertOrderedList');
    expect(component.value()).toContain('<ol><li>');

    // Non-collapsed range directly on text child of canvasEl (no existing Element block)
    canvasEl.innerHTML = 'Raw text in canvas';
    const rawText = canvasEl.firstChild!;
    const rawRange = document.createRange();
    rawRange.setStart(rawText, 0);
    rawRange.setEnd(rawText, 8);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(rawRange);
    component.execCmd('formatBlock', '<h2>');
    expect(component.value()).toContain('<h2>Raw text</h2>');

    canvasEl.innerHTML = 'Raw list item';
    const rawListText = canvasEl.firstChild!;
    const rawListRange = document.createRange();
    rawListRange.setStart(rawListText, 0);
    rawListRange.setEnd(rawListText, 13);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(rawListRange);
    component.execCmd('insertUnorderedList');
    expect(component.value()).toContain('<ul><li>Raw list item</li></ul>');

    // 4. Clear formatting on non-collapsed selection and on collapsed selection with existing block
    canvasEl.innerHTML = '<p><strong>Bold text</strong></p>';
    const strongText = canvasEl.querySelector('strong')!.firstChild!;
    const clearRange = document.createRange();
    clearRange.setStart(strongText, 0);
    clearRange.setEnd(strongText, 9);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(clearRange);
    component.execCmd('removeFormat');
    expect(component.value()).toContain('Bold text');

    canvasEl.innerHTML = '<h2>Title to reset</h2>';
    window.getSelection()!.removeAllRanges();
    component.execCmd('removeFormat');
    expect(component.value()).toBe('<p>Title to reset</p>');

    // 5. Horizontal rule & empty canvas block/list fallback
    canvasEl.innerHTML = '';
    window.getSelection()!.removeAllRanges();
    component.execCmd('formatBlock', '<h2>');
    expect(component.value()).toContain('<h2></h2>');

    canvasEl.innerHTML = '';
    component.execCmd('insertUnorderedList');
    expect(component.value()).toContain('<ul><li></li></ul>');

    component.execCmd('insertHorizontalRule');
    expect(component.value()).toContain('<hr>');

    // 6. Guard when editorCanvas is null
    const spyCanvas = vi.spyOn(component, 'editorCanvas').mockReturnValue(undefined);
    component.execCmd('bold');
    spyCanvas.mockRestore();
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

    const selSpy = vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection);

    const dialog = (component as unknown as { dialog: MatDialog }).dialog;
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as unknown as ReturnType<MatDialog['open']>);

    component.openFigureDialog();
    expect(openSpy).toHaveBeenCalled();
    selSpy.mockRestore();
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

  it('should click all toolbar buttons and trigger canvas input, blur, and keyup events', () => {
    fixture.detectChanges();
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.forEach((btn) => btn.click());

    const canvasEl = component.editorCanvas()?.nativeElement;
    if (canvasEl) {
      canvasEl.dispatchEvent(new Event('input'));
      canvasEl.dispatchEvent(new Event('blur'));
      canvasEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
    }
    expect(buttons.length).toBeGreaterThanOrEqual(17);
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
    const selSpy2 = vi.spyOn(window, 'getSelection').mockReturnValue(selection);

    fixture.componentRef.setInput('value', '<p>No image here</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    component.openFigureDialog();
    expect(component).toBeTruthy();
    selSpy2.mockRestore();
  });

  it('should apply paragraph and heading types and update type labels', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>Sample Text</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 6);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.applyType('h1-title');
    expect(component.value()).toContain('<h1 class="story-title">Sample Text</h1>');
    expect(component.currentTypeLabel()).toBe('Title');

    component.applyType('subtitle');
    expect(component.value()).toContain('<p class="story-subtitle">Sample Text</p>');
    expect(component.currentTypeLabel()).toBe('Subtitle');

    component.applyType('h1');
    expect(component.value()).toContain('<h1>Sample Text</h1>');
    expect(component.currentTypeLabel()).toBe('Heading 1');

    component.applyType('h2');
    expect(component.value()).toContain('<h2>Sample Text</h2>');
    expect(component.currentTypeLabel()).toBe('Heading 2');

    component.applyType('h3');
    expect(component.value()).toContain('<h3>Sample Text</h3>');
    expect(component.currentTypeLabel()).toBe('Heading 3');

    component.applyType('blockquote');
    expect(component.value()).toContain('<blockquote>Sample Text</blockquote>');
    expect(component.currentTypeLabel()).toBe('Quote');

    component.applyType('recipe-tip');
    expect(component.value()).toContain('<div class="recipe-tip">Sample Text</div>');
    expect(component.currentTypeLabel()).toBe('Recipe Tip');

    component.applyType('p');
    expect(component.value()).toContain('<p>Sample Text</p>');
    expect(component.currentTypeLabel()).toBe('Normal text');
  });

  it('should apply font family and font size inline styles', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>Styled Text</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 6);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.applyFontFamily("'Inter', sans-serif", 'Inter');
    expect(component.currentFontLabel()).toBe('Inter');
    expect(component.value()).toContain('style="font-family: \'Inter\', sans-serif;"');

    component.applyFontSize(24);
    expect(component.currentFontSize()).toBe(24);
    expect(component.value()).toContain('style="font-size: 24px;"');

    component.changeFontSize(2);
    expect(component.currentFontSize()).toBe(26);

    component.changeFontSize(-4);
    expect(component.currentFontSize()).toBe(22);
  });

  it('should apply text alignments to enclosing blocks', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>Aligned Text</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 7);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.applyAlignment('center');
    expect(component.currentAlign()).toBe('center');
    expect(canvasEl.querySelector('p')!.style.textAlign).toBe('center');

    component.applyAlignment('right');
    expect(component.currentAlign()).toBe('right');
    expect(canvasEl.querySelector('p')!.style.textAlign).toBe('right');

    component.applyAlignment('justify');
    expect(component.currentAlign()).toBe('justify');
    expect(canvasEl.querySelector('p')!.style.textAlign).toBe('justify');

    component.applyAlignment('left');
    expect(component.currentAlign()).toBe('left');
    expect(canvasEl.querySelector('p')!.style.textAlign).toBe('');
  });

  it('should apply bulleted and numbered list variants', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>List item text</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 4);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.applyBulletList('circle');
    expect(component.value()).toContain('list-style-type: circle');

    component.applyBulletList('square');
    expect(component.value()).toContain('list-style-type: square');

    component.applyNumberedList('lower-alpha');
    expect(component.value()).toContain('list-style-type: lower-alpha');

    component.applyNumberedList('upper-alpha');
    expect(component.value()).toContain('list-style-type: upper-alpha');

    component.applyNumberedList('lower-roman');
    expect(component.value()).toContain('list-style-type: lower-roman');
  });

  it('should adjust block and list indentation', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>Indented paragraph</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 8);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.adjustIndent('increase');
    expect(canvasEl.querySelector('p')!.style.marginLeft).toBe('1.5rem');

    component.adjustIndent('increase');
    expect(canvasEl.querySelector('p')!.style.marginLeft).toBe('3rem');

    component.adjustIndent('decrease');
    expect(canvasEl.querySelector('p')!.style.marginLeft).toBe('1.5rem');

    component.adjustIndent('decrease');
    expect(canvasEl.querySelector('p')!.style.marginLeft).toBe('');

    // List indentation nesting
    canvasEl.innerHTML = '<ul><li>First</li><li>Second</li></ul>';
    const secondLi = canvasEl.querySelectorAll('li')[1];
    const liRange = document.createRange();
    liRange.selectNodeContents(secondLi);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(liRange);

    component.adjustIndent('increase');
    expect(canvasEl.innerHTML).toContain('<ul><li>First<ul><li>Second</li></ul></li></ul>');

    component.adjustIndent('decrease');
    expect(canvasEl.innerHTML).toBe('<ul><li>First</li><li>Second</li></ul>');

    // Outdenting top-level list item turns it into a paragraph
    const topLi = canvasEl.querySelectorAll('li')[1];
    const topLiRange = document.createRange();
    topLiRange.selectNodeContents(topLi);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(topLiRange);

    component.adjustIndent('decrease');
    expect(canvasEl.querySelectorAll('li')).toHaveLength(1);
    expect(canvasEl.querySelector('p')?.textContent).toBe('Second');
  });

  it('should inspect, add, remove, and erase CSS classes on elements', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p class="lead">Styled intro paragraph</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 6);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    component.onClassMenuOpened();
    expect(component.inspectedElementTag()).toBe('<p>');
    expect(component.inspectedClasses()).toContain('lead');

    // Add class via method
    component.addClassToInspected('text-center');
    expect(component.inspectedClasses()).toContain('text-center');
    expect(canvasEl.querySelector('p')!.classList.contains('text-center')).toBe(true);
    expect(component.classHistory()).toContain('text-center');

    // Add class via input element
    const fakeInput = document.createElement('input');
    fakeInput.value = 'custom-badge';
    component.addClassFromInput(fakeInput);
    expect(component.inspectedClasses()).toContain('custom-badge');
    expect(fakeInput.value).toBe('');

    // Remove single class
    component.removeClassFromInspected('lead');
    expect(component.inspectedClasses()).not.toContain('lead');

    // Erase all classes
    component.eraseAllClassesFromInspected();
    expect(component.inspectedClasses()).toHaveLength(0);
    expect(canvasEl.querySelector('p')!.getAttribute('class')).toBeNull();
  });

  it('should apply first-letter drop cap to initial block letter and preserve it', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<p>Once upon a time in the kitchen</p>';
    const textNode = canvasEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 4);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    component.applyFirstLetterDropCap();
    expect(component.value()).toContain('<span class="story-first-letter">O</span>nce upon');
    expect(component.inspectedClasses()).toContain('story-first-letter');

    // Calling it again when already present shouldn't duplicate
    component.applyFirstLetterDropCap();
    const matches = component.value().match(/story-first-letter/g);
    expect(matches).toHaveLength(1);
  });

  it('should update toolbar state on selection change in canvas', () => {
    const canvasEl = component.editorCanvas()!.nativeElement;
    canvasEl.innerHTML = '<h2 style="text-align: right;">Heading Two</h2><p>Normal text</p>';
    const h2El = canvasEl.querySelector('h2')!;

    component.onCanvasClick({ target: h2El } as unknown as Event);
    expect(component.currentTypeLabel()).toBe('Heading 2');
    expect(component.currentAlign()).toBe('right');
  });

  describe('button visibility control (hiddenButtons & disabledButtons)', () => {
    it('should show all buttons by default', () => {
      expect(component.isButtonVisible('bold')).toBe(true);
      expect(component.isButtonVisible('code')).toBe(true);
      expect(component.isButtonVisible('figure')).toBe(true);
      expect(component.isButtonVisible('horizontalRule')).toBe(true);
      expect(component.isButtonVisible('classes')).toBe(true);
    });

    it('should hide button when specified in hiddenButtons input', () => {
      fixture.componentRef.setInput('hiddenButtons', ['code', 'figure']);
      fixture.detectChanges();

      expect(component.isButtonVisible('code')).toBe(false);
      expect(component.isButtonVisible('figure')).toBe(false);
      expect(component.isButtonVisible('bold')).toBe(true);
    });

    it('should hide button when specified in disabledButtons signal', () => {
      component.disabledButtons.set(['highlight', 'clearFormat']);
      fixture.detectChanges();

      expect(component.isButtonVisible('highlight')).toBe(false);
      expect(component.isButtonVisible('clearFormat')).toBe(false);
      expect(component.isButtonVisible('bold')).toBe(true);
    });

    it('should handle case-insensitivity and aliases properly', () => {
      // Test alias 'divider' for 'horizontalRule'
      fixture.componentRef.setInput('hiddenButtons', ['divider']);
      fixture.detectChanges();
      expect(component.isButtonVisible('horizontalRule')).toBe(false);

      // Test alias 'bullets' for 'bulletList'
      fixture.componentRef.setInput('hiddenButtons', ['bullets']);
      fixture.detectChanges();
      expect(component.isButtonVisible('bulletList')).toBe(false);

      // Test alias 'strike' for 'strikeThrough'
      fixture.componentRef.setInput('hiddenButtons', ['STRIKE']);
      fixture.detectChanges();
      expect(component.isButtonVisible('strikeThrough')).toBe(false);
    });

    it('should remove the hidden button elements from the DOM', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      // Initially, code button exists
      expect(compiled.querySelector('button[matTooltip="Inline code"]')).toBeTruthy();

      // Hide code button
      fixture.componentRef.setInput('hiddenButtons', ['code']);
      fixture.detectChanges();

      expect(compiled.querySelector('button[matTooltip="Inline code"]')).toBeNull();
    });

    it('should support hiding the html button via aliases', () => {
      expect(component.isButtonVisible('html')).toBe(true);

      fixture.componentRef.setInput('hiddenButtons', ['source']);
      fixture.detectChanges();
      expect(component.isButtonVisible('html')).toBe(false);
    });
  });

  describe('HTML source mode toggle', () => {
    it('should render HTML toggle button by default', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const htmlBtn = compiled.querySelector(
        'button[data-testid="html-toggle-btn"]',
      ) as HTMLButtonElement;
      expect(htmlBtn).toBeTruthy();
      expect(component.isHtmlMode()).toBe(false);
    });

    it('should toggle between visual canvas and raw HTML textarea', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const canvasEl = compiled.querySelector('.story') as HTMLDivElement;
      const textareaEl = compiled.querySelector('textarea') as HTMLTextAreaElement;

      expect(canvasEl.classList.contains('hidden')).toBe(false);
      expect(textareaEl.classList.contains('hidden')).toBe(true);

      component.toggleHtmlMode();
      fixture.detectChanges();

      expect(component.isHtmlMode()).toBe(true);
      expect(canvasEl.classList.contains('hidden')).toBe(true);
      expect(textareaEl.classList.contains('hidden')).toBe(false);
    });

    it('should format HTML content when toggling into HTML mode', async () => {
      fixture.componentRef.setInput('value', '<p>First line</p><p>Second line</p>');
      fixture.detectChanges();
      await fixture.whenStable();

      component.toggleHtmlMode();
      fixture.detectChanges();

      expect(component.rawHtmlValue()).toContain('<p>First line</p>');
      expect(component.rawHtmlValue()).toContain('<p>Second line</p>');
    });

    it('should update component value when typing in HTML source mode', () => {
      component.toggleHtmlMode();
      fixture.detectChanges();

      const textareaEl = component.htmlTextarea()?.nativeElement;
      if (textareaEl) {
        textareaEl.value = '<h3>Custom raw heading</h3><p>Direct HTML edit</p>';
        component.onHtmlSourceInput({ target: textareaEl } as unknown as Event);
      }

      expect(component.value()).toBe('<h3>Custom raw heading</h3><p>Direct HTML edit</p>');

      // Toggle back to visual mode and verify canvas innerHTML
      component.toggleHtmlMode();
      fixture.detectChanges();

      expect(component.isHtmlMode()).toBe(false);
      const canvasEl = component.editorCanvas()?.nativeElement;
      expect(canvasEl?.innerHTML).toContain('<h3>Custom raw heading</h3><p>Direct HTML edit</p>');
    });

    it('should prevent execCmd execution while in HTML mode', () => {
      component.value.set('<p>Protected text</p>');
      component.isHtmlMode.set(true);

      const before = component.value();
      component.execCmd('bold');

      expect(component.value()).toBe(before);
    });
  });

  describe('extended branch coverage tests', () => {
    interface PrivateEditor {
      resolveImageSrc: (html: string) => string;
      stripImageBaseUrl: (html: string) => string;
      applyBlockTag: (
        canvasEl: HTMLElement,
        range: Range,
        tagName: string,
        className?: string,
      ) => void;
      wrapBlockAsList: (canvasEl: HTMLElement, range: Range, listTag: 'ul' | 'ol') => HTMLElement;
      clearRangeFormatting: (canvasEl: HTMLElement, range: Range) => void;
      getTargetImage: (canvasEl: HTMLElement) => HTMLImageElement | null;
      applyDialogResult: (
        result: unknown,
        targetImg: HTMLImageElement,
        innerFigure: HTMLElement | null,
        outerFigure: HTMLElement | null,
        isGalleryContainer: boolean,
      ) => void;
      saveClassHistory: (cls: string) => void;
      loadClassHistory: () => void;
      resolveActiveTargetForClasses: (canvasEl: HTMLElement) => HTMLElement | null;
    }

    const getPriv = (c: StoryHtmlEditorComponent): PrivateEditor => c as unknown as PrivateEditor;
    it('should cover all block types and alignment in updateToolbarStateFromSelection', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;

      // Subtitle
      canvasEl.innerHTML = '<p class="story-subtitle">My Subtitle</p>';
      component.onCanvasClick({ target: canvasEl.querySelector('p') } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Subtitle');

      // Recipe Tip
      canvasEl.innerHTML = '<div class="recipe-tip">Cooking Tip</div>';
      component.onCanvasClick({ target: canvasEl.querySelector('div') } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Recipe Tip');

      // Heading 1
      canvasEl.innerHTML = '<h1>Main Header</h1>';
      component.onCanvasClick({ target: canvasEl.querySelector('h1') } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Heading 1');

      // Heading 3
      canvasEl.innerHTML = '<h3 style="text-align: center;">Small Header</h3>';
      component.onCanvasClick({ target: canvasEl.querySelector('h3') } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Heading 3');
      expect(component.currentAlign()).toBe('center');

      // Quote / blockquote with justify
      canvasEl.innerHTML = '<blockquote style="text-align: justify;">Quote text</blockquote>';
      component.onCanvasClick({ target: canvasEl.querySelector('blockquote') } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Quote');
      expect(component.currentAlign()).toBe('justify');

      // Normal text with left alignment clearing style
      canvasEl.innerHTML = '<p style="text-align: left;">Paragraph text</p>';
      component.onCanvasClick({ target: canvasEl.querySelector('p') } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Normal text');
    });

    it('should cover applyAlignment branches (left clears style, center, justify)', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p style="text-align: right;">Text</p>';
      const textNode = canvasEl.querySelector('p')!.firstChild!;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);

      component.applyAlignment('left');
      expect(canvasEl.querySelector('p')!.style.textAlign).toBe('');

      component.applyAlignment('center');
      expect(canvasEl.querySelector('p')!.style.textAlign).toBe('center');

      component.applyAlignment('justify');
      expect(canvasEl.querySelector('p')!.style.textAlign).toBe('justify');
    });

    it('should cover changeFontSize bounds clamping', () => {
      component.currentFontSize.set(60);
      component.changeFontSize(10);
      expect(component.currentFontSize()).toBe(64); // Clamped at 64

      component.currentFontSize.set(15);
      component.changeFontSize(-10);
      expect(component.currentFontSize()).toBe(10); // Clamped at 10
    });

    it('should cover converting lists between OL and UL', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;

      // 1. Convert OL to UL
      canvasEl.innerHTML = '<ol><li>Numbered item</li></ol>';
      const olLi = canvasEl.querySelector('li')!;
      const r1 = document.createRange();
      r1.selectNodeContents(olLi);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r1);

      component.applyBulletList('disc');
      expect(canvasEl.querySelector('ul')).toBeTruthy();
      expect(canvasEl.querySelector('ol')).toBeNull();

      // 2. Convert UL to OL
      const ulLi = canvasEl.querySelector('li')!;
      const r2 = document.createRange();
      r2.selectNodeContents(ulLi);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r2);

      component.applyNumberedList('decimal');
      expect(canvasEl.querySelector('ol')).toBeTruthy();
      expect(canvasEl.querySelector('ul')).toBeNull();

      // 3. Update existing OL style
      component.applyNumberedList('upper-roman');
      expect(canvasEl.querySelector('ol')!.style.listStyleType).toBe('upper-roman');
    });

    it('should cover list nesting when sublist already exists', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<ul><li>First<ul><li>Sub 1</li></ul></li><li>Second</li></ul>';
      const secondLi = canvasEl.querySelector('ul')!.children[1] as HTMLElement;
      const r = document.createRange();
      r.selectNodeContents(secondLi);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      component.adjustIndent('increase');
      expect(canvasEl.innerHTML).toContain('<ul><li>Sub 1</li><li>Second</li></ul>');
    });

    it('should cover unnesting when nested inside grandparent LI', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<ul><li>Parent<ul><li id="child">Nested</li></ul></li></ul>';
      const childLi = canvasEl.querySelector('#child')!;
      const r = document.createRange();
      r.selectNodeContents(childLi);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      component.adjustIndent('decrease');
      expect(canvasEl.querySelectorAll('ul > li')).toHaveLength(2);
    });

    it('should cover class inspector on span elements and removing all classes from attribute', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p><span class="story-first-letter">W</span>ord</p>';
      const span = canvasEl.querySelector('span')!;
      const r = document.createRange();
      r.selectNodeContents(span);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      component.onClassMenuOpened();
      expect(component.inspectedClasses()).toContain('story-first-letter');

      component.removeClassFromInspected('story-first-letter');
      expect(span.getAttribute('class')).toBeNull();
    });

    it('should cover applyFirstLetterDropCap with empty text or no alphanumeric match', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p>---</p>';
      const r = document.createRange();
      r.selectNodeContents(canvasEl.querySelector('p')!);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      component.applyFirstLetterDropCap();
      expect(canvasEl.innerHTML).toBe('<p>---</p>');
    });

    it('should cover resolveImageSrc with relative path missing leading slash and data/http URIs', () => {
      expect(getPriv(component).resolveImageSrc('<img src="2026/08/cake.webp">')).toContain(
        'https://ik.imagekit.io/delishamarie/2026/08/cake.webp',
      );

      expect(
        getPriv(component).resolveImageSrc(
          '<mat-icon class="!text-3xl">spa</mat-icon><mat-icon>star</mat-icon>',
        ),
      ).toContain(
        '<span class="material-icons !text-3xl">spa</span><span class="material-icons">star</span>',
      );

      expect(getPriv(component).resolveImageSrc('<img alt="no src">')).toBe('<img alt="no src">');

      expect(getPriv(component).resolveImageSrc('')).toBe('');
    });

    it('should cover stripImageBaseUrl with non-base image and missing src', () => {
      expect(
        getPriv(component).stripImageBaseUrl('<img src="https://example.com/pic.jpg">'),
      ).toContain('https://example.com/pic.jpg');

      expect(getPriv(component).stripImageBaseUrl('<img alt="no src">')).toBe('<img alt="no src">');

      expect(getPriv(component).stripImageBaseUrl('')).toBe('');
    });

    it('should cover execCmd commands (formatBlock, callout, insertUnorderedList, insertOrderedList)', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p>Block command test</p>';
      const r = document.createRange();
      r.selectNodeContents(canvasEl.querySelector('p')!);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      component.execCmd('callout');
      expect(canvasEl.querySelector('.recipe-tip')).toBeTruthy();

      component.execCmd('formatBlock', '<h3>');
      expect(canvasEl.querySelector('h3')).toBeTruthy();

      component.execCmd('insertUnorderedList');
      expect(canvasEl.querySelector('ul')).toBeTruthy();

      component.execCmd('insertOrderedList');
      expect(canvasEl.querySelector('ol')).toBeTruthy();
    });

    it('should cover applyBlockTag when non-collapsed selection has no existing block', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '';
      const text = document.createTextNode('Floating text without block');
      canvasEl.appendChild(text);

      const r = document.createRange();
      r.selectNodeContents(text);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      getPriv(component).applyBlockTag(canvasEl, r, 'h2', 'custom-h2');
      expect(canvasEl.querySelector('h2.custom-h2')).toBeTruthy();
    });

    it('should cover applyBlockTag when range is collapsed and appends to canvas', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '';
      const r = document.createRange();
      r.setStart(canvasEl, 0);
      r.collapse(true);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      getPriv(component).applyBlockTag(canvasEl, r, 'p', 'appended-p');
      expect(canvasEl.querySelector('p.appended-p')).toBeTruthy();
    });

    it('should cover wrapBlockAsList with non-collapsed text without existing block', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '';
      const text = document.createTextNode('Item without block');
      canvasEl.appendChild(text);

      const r = document.createRange();
      r.selectNodeContents(text);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      const list = getPriv(component).wrapBlockAsList(canvasEl, r, 'ul');
      expect(list.tagName.toLowerCase()).toBe('ul');
      expect(canvasEl.querySelector('li')?.textContent).toBe('Item without block');
    });

    it('should cover clearRangeFormatting on collapsed selection', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<h2 class="some-title">Heading text</h2>';
      const r = document.createRange();
      r.selectNodeContents(canvasEl.querySelector('h2')!);
      r.collapse(true);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      getPriv(component).clearRangeFormatting(canvasEl, r);
      expect(canvasEl.querySelector('p')?.textContent).toBe('Heading text');
      expect(canvasEl.querySelector('h2')).toBeNull();
    });

    it('should cover getTargetImage via selection range containing image', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p><img src="/test.jpg" alt="test"></p>';
      const img = canvasEl.querySelector('img')!;
      const r = document.createRange();
      r.selectNode(img);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);

      const found = getPriv(component).getTargetImage(canvasEl);
      expect(found).toBe(img);
    });

    it('should cover applyDialogResult with outerFigureClass without gallery', () => {
      const targetImg = document.createElement('img');
      targetImg.src = '/image.webp';
      const container = document.createElement('div');
      container.appendChild(targetImg);

      getPriv(component).applyDialogResult(
        {
          imgClass: 'custom-img',
          innerFigureClass: 'inner-fig',
          outerFigureClass: 'outer-fig',
          captionText: 'My Caption',
          captionClass: 'cap-style',
        },
        targetImg,
        null,
        null,
        false,
      );

      const outerFig = container.querySelector('figure.outer-fig');
      expect(outerFig).toBeTruthy();
      expect(outerFig?.querySelector('figure.inner-fig')).toBeTruthy();
      expect(outerFig?.querySelector('figcaption.cap-style')?.textContent).toBe('My Caption');
    });

    it('should cover formatHtmlForEditor with empty string, figures, hr and div tags', () => {
      expect(component.formatHtmlForEditor('')).toBe('');
      const raw =
        '<figure><img src="/pic.webp"><figcaption>Cap</figcaption></figure><hr><div>Note</div>';
      const formatted = component.formatHtmlForEditor(raw);
      expect(formatted).toContain('<figure>\n<img');
      expect(formatted).toContain('<hr>\n<div>');
    });

    it('should cover _syncEffect updating rawHtmlValue when in HTML mode', () => {
      component.isHtmlMode.set(true);
      component.rawHtmlValue.set('<p>Initial</p>');
      fixture.componentRef.setInput('value', '<p>Externally updated value</p>');
      fixture.detectChanges();

      expect(component.rawHtmlValue()).toContain('Externally updated value');
    });

    it('should cover aliases in isButtonVisible for all groups', () => {
      fixture.componentRef.setInput('hiddenButtons', [
        'font-family',
        'font-size',
        'headings',
        'alignment',
        'indents',
        'classinspector',
      ]);
      fixture.detectChanges();

      expect(component.isButtonVisible('fontFamily')).toBe(false);
      expect(component.isButtonVisible('fontSize')).toBe(false);
      expect(component.isButtonVisible('type')).toBe(false);
      expect(component.isButtonVisible('align')).toBe(false);
      expect(component.isButtonVisible('indent')).toBe(false);
      expect(component.isButtonVisible('classes')).toBe(false);
    });

    it('should cover template alignment icon switch branches', () => {
      component.currentAlign.set('center');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('format_align_center');

      component.currentAlign.set('justify');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('format_align_justify');
    });

    it('should cover reverse alias check when key is hidden', () => {
      fixture.componentRef.setInput('hiddenButtons', ['align']);
      fixture.detectChanges();
      expect(component.isButtonVisible('text-align')).toBe(false);
      expect(component.isButtonVisible('alignment')).toBe(false);
    });

    it('should cover empty inputs and edge cases for class adding/removing', () => {
      const emptyInput = document.createElement('input');
      emptyInput.value = '   ';
      component.addClassFromInput(emptyInput);

      component.addClassToInspected('');
      component.removeClassFromInspected('');

      getPriv(component).saveClassHistory('');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dm_story_class_history', JSON.stringify({ invalid: true }));
        getPriv(component).loadClassHistory();
        localStorage.removeItem('dm_story_class_history');
        getPriv(component).loadClassHistory();
      }
      expect(component.inspectedClasses()).toBeDefined();
      expect(component.classHistory()).toBeDefined();
    });

    it('should cover promptLink when user cancels prompt', () => {
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      component.promptLink();
      expect(component.value()).not.toContain('<a href');
    });

    it('should cover execCmd createLink and insertImage with empty values', () => {
      component.execCmd('createLink', '');
      component.execCmd('insertImage', '');
      expect(component.value()).toBe('');
    });

    it('should render a required asterisk in the label when required input is true', () => {
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();
      const labelSpan = fixture.nativeElement.querySelector('span.text-xs');
      expect(labelSpan).toBeTruthy();
      expect(labelSpan.textContent).toContain('*');
    });

    it('should cover loadClassHistory and saveClassHistory with working localStorage', () => {
      const mockStore: Record<string, string> = {
        dm_story_class_history: JSON.stringify(['highlight', 'lead', 'badge']),
      };
      const fakeStorage = {
        getItem: vi.fn((key: string) => mockStore[key] ?? null),
        setItem: vi.fn((key: string, val: string) => {
          mockStore[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStore[key];
        }),
      };
      vi.stubGlobal('localStorage', fakeStorage);

      getPriv(component).loadClassHistory();
      expect(component.classHistory()).toContain('highlight');

      getPriv(component).saveClassHistory('new-tag');
      expect(component.classHistory()).toContain('new-tag');
      expect(fakeStorage.setItem).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('should cover all type options and specific CSS tag classes in onCanvasClick', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML =
        '<h1 class="story-title">Title text</h1><p class="recipe-tip">Tip text</p><p class="story-subtitle">Subtitle</p>';
      const h1 = canvasEl.querySelector('h1')!;
      component.onCanvasClick({ target: h1 } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Title');

      const tip = canvasEl.querySelector('.recipe-tip')!;
      component.onCanvasClick({ target: tip } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Recipe Tip');

      const sub = canvasEl.querySelector('.story-subtitle')!;
      component.onCanvasClick({ target: sub } as unknown as Event);
      expect(component.currentTypeLabel()).toBe('Subtitle');

      const allTypes = [
        'p',
        'h1-title',
        'subtitle',
        'h1',
        'h2',
        'h3',
        'blockquote',
        'recipe-tip',
        'lead',
      ];
      allTypes.forEach((type) => {
        canvasEl.innerHTML = '<p>Format target</p>';
        const p = canvasEl.querySelector('p')!;
        const r = document.createRange();
        r.selectNodeContents(p);
        window.getSelection()!.removeAllRanges();
        window.getSelection()!.addRange(r);
        component.applyType(type);
        expect(canvasEl.innerHTML).toBeDefined();
      });
    });

    it('should cover all alignments and list styles with existing lists', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      const aligns: ('left' | 'center' | 'right' | 'justify')[] = [
        'left',
        'center',
        'right',
        'justify',
      ];
      aligns.forEach((align) => {
        canvasEl.innerHTML = '<p>Align target</p>';
        const p = canvasEl.querySelector('p')!;
        const r = document.createRange();
        r.selectNodeContents(p);
        window.getSelection()!.removeAllRanges();
        window.getSelection()!.addRange(r);
        component.applyAlignment(align);
      });

      // Calling applyBulletList on existing UL
      canvasEl.innerHTML = '<ul><li>Existing list item</li></ul>';
      const li = canvasEl.querySelector('li')!;
      const r = document.createRange();
      r.selectNodeContents(li);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);
      component.applyBulletList('square');
      expect(canvasEl.querySelector('ul')?.style.listStyleType).toBe('square');

      // Calling applyNumberedList on existing OL
      canvasEl.innerHTML = '<ol><li>Numbered item</li></ol>';
      const numLi = canvasEl.querySelector('li')!;
      const rNum = document.createRange();
      rNum.selectNodeContents(numLi);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(rNum);
      component.applyNumberedList('lower-roman');
      expect(canvasEl.querySelector('ol')?.style.listStyleType).toBe('lower-roman');
    });

    it('should cover wrapBlock preserving custom class and wrapBlock on non-collapsed range without block', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p class="my-custom-note">Custom text</p>';
      const p = canvasEl.querySelector('p')!;
      const r = document.createRange();
      r.selectNodeContents(p);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);
      getPriv(component).applyBlockTag(canvasEl, r, 'blockquote', '');
      expect(canvasEl.querySelector('blockquote')?.className).toBe('my-custom-note');

      // Non-collapsed range with raw text node
      canvasEl.innerHTML = 'Just raw text inside canvas';
      const textNode = canvasEl.firstChild!;
      const r2 = document.createRange();
      r2.setStart(textNode, 0);
      r2.setEnd(textNode, 4);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r2);
      getPriv(component).applyBlockTag(canvasEl, r2, 'h2', 'banner-h2');
      expect(canvasEl.querySelector('h2')?.className).toBe('banner-h2');
    });

    it('should cover resolveActiveTargetForClasses fallback to findDirectBlockChild', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p>Fallback text</p>';
      const r = document.createRange();
      r.selectNode(canvasEl);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);
      const target = getPriv(component).resolveActiveTargetForClasses(canvasEl);
      expect(target).toBeDefined();
    });

    it('should cover template event listeners for keyup, textarea input/blur, and class operations', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));

      // HTML mode textarea input and blur events
      component.toggleHtmlMode();
      fixture.detectChanges();
      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
      expect(textarea).toBeTruthy();
      textarea.value = '<p>Edited in textarea</p>';
      textarea.dispatchEvent(new Event('input'));
      textarea.dispatchEvent(new Event('blur'));
      expect(component.value()).toBe('<p>Edited in textarea</p>');
      component.toggleHtmlMode();
      fixture.detectChanges();

      // Class inspector template buttons
      component.inspectedClasses.set(['first-tag', 'second-tag']);
      fixture.detectChanges();
      const removeBtns = fixture.nativeElement.querySelectorAll('button[title="Remove class"]');
      if (removeBtns.length > 0) {
        (removeBtns[0] as HTMLButtonElement).click();
        expect(component.inspectedClasses()).not.toContain('first-tag');
      }

      // Enter key on customClassInput
      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector(
        'input[placeholder*="Type class name"]',
      );
      if (inputEl) {
        inputEl.value = 'typed-class';
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(component.inspectedClasses()).toContain('typed-class');
      }
    });

    it('should cover resolveActiveTargetForClasses fallback to findDirectBlockChild when detached or comment node', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p>Direct block</p>';
      const comment = document.createComment('test comment');
      canvasEl.appendChild(comment);
      const r = document.createRange();
      r.selectNode(comment);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);
      const target = getPriv(component).resolveActiveTargetForClasses(canvasEl);
      expect(target).toBe(canvasEl);

      // Cover template justify align icon & canvas keyup
      component.currentAlign.set('justify');
      fixture.detectChanges();
      canvasEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'ArrowDown' }));
    });

    it('should cover applyBulletList and applyNumberedList when direct block is already list element', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<ul><li>First item</li></ul>';
      const r = document.createRange();
      r.setStart(canvasEl, 0);
      r.setEnd(canvasEl, 0);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r);
      component.applyBulletList('square');
      expect(canvasEl.querySelector('ul')?.style.listStyleType).toBe('square');

      canvasEl.innerHTML = '<ol><li>Numbered item</li></ol>';
      const r2 = document.createRange();
      r2.setStart(canvasEl, 0);
      r2.setEnd(canvasEl, 0);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(r2);
      component.applyNumberedList('lower-greek');
      expect(canvasEl.querySelector('ol')?.style.listStyleType).toBe('lower-greek');
    });

    it('should open all toolbar mat-menus and click their buttons to cover all template listeners', () => {
      fixture.detectChanges();
      const triggers = fixture.debugElement.queryAll(By.directive(MatMenuTrigger));
      expect(triggers.length).toBeGreaterThan(0);
      for (const trigger of triggers) {
        const matTrigger = trigger.injector.get(MatMenuTrigger);
        matTrigger.openMenu();
        fixture.detectChanges();

        const overlayContainer = document.querySelector('.cdk-overlay-container');
        if (overlayContainer) {
          const addBtn = overlayContainer.querySelector(
            'button.bg-indigo-600',
          ) as HTMLButtonElement;
          addBtn?.click();
          const menuButtons = overlayContainer.querySelectorAll('button[mat-menu-item], button');
          menuButtons.forEach((btn: Element) => {
            (btn as HTMLButtonElement).click();
          });
        }
        matTrigger.closeMenu();
        fixture.detectChanges();
      }
      expect(component).toBeTruthy();
    });

    it('should cover promptLink when user cancels or enters empty string', () => {
      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
      const execSpy = vi.spyOn(component, 'execCmd');
      component.promptLink();
      expect(execSpy).not.toHaveBeenCalled();

      promptSpy.mockReturnValue('');
      component.promptLink();
      expect(execSpy).not.toHaveBeenCalled();
      promptSpy.mockRestore();
    });

    it('should cover onFileSelected when no file is present or upload returns empty path', async () => {
      // No file selected
      const eventNoFiles = { target: { files: [] } } as unknown as Event;
      await component.onFileSelected(eventNoFiles);

      // Upload returns null/empty
      const recipeService = (
        component as unknown as { recipeService: { upload: ReturnType<typeof vi.fn> } }
      ).recipeService;
      recipeService.upload.mockResolvedValueOnce('');
      const fakeFile = new File(['hello'], 'test.png', { type: 'image/png' });
      const eventWithFile = { target: { files: [fakeFile] } } as unknown as Event;
      const execSpy = vi.spyOn(component, 'execCmd');
      await component.onFileSelected(eventWithFile);
      expect(execSpy).not.toHaveBeenCalledWith('insertImage', expect.any(String));
    });

    it('should cover execCmd early returns when in html mode or value is undefined', () => {
      component.isHtmlMode.set(true);
      const canvasEl = component.editorCanvas()!.nativeElement;
      const initialHtml = canvasEl.innerHTML;
      component.execCmd('bold');
      expect(canvasEl.innerHTML).toBe(initialHtml);

      component.isHtmlMode.set(false);
      component.execCmd('createLink', undefined);
      component.execCmd('insertImage', undefined);
      expect(canvasEl.innerHTML).toBe(initialHtml);
    });

    it('should cover applyBlockTag when existingBlock class is recipe-tip', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<div class="recipe-tip">Existing Tip Content</div>';
      const range = document.createRange();
      range.selectNodeContents(canvasEl.firstChild!);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      component.execCmd('formatBlock', 'p');
      const p = canvasEl.querySelector('p');
      expect(p).toBeTruthy();
      expect(p?.className).not.toBe('recipe-tip');
    });

    it('should cover class inspection edge cases when target or className is empty', () => {
      // Call with empty className
      component.addClassToInspected('');
      component.removeClassFromInspected('');

      // Call addClassFromInput with empty input
      const input = document.createElement('input');
      input.value = '   ';
      component.addClassFromInput(input);
      expect(input.value).toBe('   ');
    });

    it('should cover applyFirstLetterDropCap when span already exists or text does not match', () => {
      const canvasEl = component.editorCanvas()!.nativeElement;
      canvasEl.innerHTML = '<p><span class="story-first-letter">T</span>est paragraph</p>';
      const range = document.createRange();
      range.selectNodeContents(canvasEl.querySelector('.story-first-letter')!);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      component.applyFirstLetterDropCap();
      expect(component.inspectedClasses()).toContain('story-first-letter');

      // Paragraph starting with punctuation that does not match [A-Za-z0-9]
      canvasEl.innerHTML = '<p>--- Non matching start</p>';
      const range2 = document.createRange();
      range2.selectNodeContents(canvasEl.firstChild!);
      sel.removeAllRanges();
      sel.addRange(range2);

      component.applyFirstLetterDropCap();
      expect(canvasEl.querySelector('.story-first-letter')).toBeNull();
    });
  });
});
