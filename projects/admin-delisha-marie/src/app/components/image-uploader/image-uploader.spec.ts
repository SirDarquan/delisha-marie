import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ImageUploaderComponent } from './image-uploader';
import { RecipeService } from '../../services/recipe.service';

describe('ImageUploaderComponent', () => {
  let component: ImageUploaderComponent;
  let fixture: ComponentFixture<ImageUploaderComponent>;

  const originalImage = globalThis.Image;
  let triggerImageLoadSuccess = true;
  let mockNaturalWidth = 800;
  let mockNaturalHeight = 600;

  beforeAll(() => {
    // Highly sophisticated jsdom image class mock to control onload/onerror dimensions synchronously
    class MockImage {
      private _src = '';
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;

      get naturalWidth() {
        return mockNaturalWidth;
      }

      get naturalHeight() {
        return mockNaturalHeight;
      }

      set src(val: string) {
        this._src = val;
        // Asynchronously invoke the appropriate callback in microtask to simulate loading
        setTimeout(() => {
          if (triggerImageLoadSuccess) {
            if (this.onload) this.onload();
          } else {
            if (this.onerror) this.onerror(new Error('Image failed to load'));
          }
        }, 0);
      }

      get src() {
        return this._src;
      }
    }

    globalThis.Image = MockImage as unknown as typeof Image;
  });

  afterAll(() => {
    globalThis.Image = originalImage;
  });

  beforeEach(async () => {
    triggerImageLoadSuccess = true;
    mockNaturalWidth = 800;
    mockNaturalHeight = 600;

    await TestBed.configureTestingModule({
      imports: [ImageUploaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploaderComponent);
    component = fixture.componentInstance;

    const recipeService = TestBed.inject(RecipeService);
    vi.spyOn(recipeService, 'upload').mockImplementation(async (file: File) => file.name);
  });

  it('should create the image uploader component with default empty states', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component['previewUrl']()).toBe('');
    expect(component['currentPath']()).toBe('');
    expect(component['currentWidth']()).toBe('');
    expect(component['currentHeight']()).toBe('');
    expect(component['currentType']()).toBe('');
  });

  it('should populate reactive signals when initialImage input changes', () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.componentRef.setInput('initialWidth', '1024');
    fixture.componentRef.setInput('initialHeight', '768');
    fixture.componentRef.setInput('initialType', 'image/png');
    fixture.detectChanges();

    expect(component['previewUrl']()).toBe('/images/recipes/2026/06/pasta.png');
    expect(component['currentPath']()).toBe('/images/recipes/2026/06/pasta.png');
    expect(component['currentWidth']()).toBe('1024');
    expect(component['currentHeight']()).toBe('768');
    expect(component['currentType']()).toBe('image/png');
  });

  it('should automatically sync and extract dimensions in the background during initialization if width/height inputs are blank', async () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.componentRef.setInput('initialWidth', '');
    fixture.componentRef.setInput('initialHeight', '');
    fixture.componentRef.setInput('initialType', 'image/png');

    mockNaturalWidth = 1920;
    mockNaturalHeight = 1080;

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentWidth']()).toBe('1920');
    expect(component['currentHeight']()).toBe('1080');
  });

  it('should handle dragover, dragleave, and drop events for file objects', async () => {
    fixture.detectChanges();
    let changePayload: {
      image: string;
      imageWidth: string;
      imageHeight: string;
      imageType: string;
    } | null = null;
    component.imageChange.subscribe((val) => (changePayload = val));

    // Mock ObjectURL behavior
    const testBlobUrl = 'blob:http://localhost/mock-blob-uuid';
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = () => testBlobUrl;
    URL.revokeObjectURL = vi.fn();

    // 1. Dragover
    const dragOverEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;
    component.onDragOver(dragOverEvent);
    expect(component['dragOver']()).toBe(true);

    // 2. Dragleave
    const dragLeaveEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;
    component.onDragLeave(dragLeaveEvent);
    expect(component['dragOver']()).toBe(false);

    // 3. Drop
    const file = new File(['mock content'], 'tasty-tacos.jpg', { type: 'image/jpeg' });
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentPath']()).toBe('tasty-tacos.jpg');
    expect(component['currentType']()).toBe('image/webp');
    expect(component['currentWidth']()).toBe('800');
    expect(component['currentHeight']()).toBe('600');
    expect(changePayload).toEqual({
      image: 'tasty-tacos.jpg',
      imageWidth: '800',
      imageHeight: '600',
      imageType: 'image/webp',
    });

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should process dropped URL string text, formatting names and extracting dimensions', async () => {
    fixture.detectChanges();
    let changePayload: {
      image: string;
      imageWidth: string;
      imageHeight: string;
      imageType: string;
    } | null = null;
    component.imageChange.subscribe((val) => (changePayload = val));

    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [] as File[],
        getData: (format: string) =>
          format === 'text' ? 'https://images.example.com/blog/chili.png' : '',
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentPath']()).toBe('chili.png');
    expect(component['currentType']()).toBe('image/png');
    expect(component['currentWidth']()).toBe('800');
    expect(component['currentHeight']()).toBe('600');
    expect(changePayload).toEqual({
      image: 'chili.png',
      imageWidth: '800',
      imageHeight: '600',
      imageType: 'image/png',
    });
  });

  it('should fall back to recipe slug when dropped URL string contains no filename or extension', async () => {
    fixture.componentRef.setInput('recipeSlug', 'premium-lasagna');
    fixture.detectChanges();

    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [] as File[],
        getData: (format: string) =>
          format === 'text' ? 'https://images.example.com/api/image-loader?id=123' : '',
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentPath']()).toBe('premium-lasagna.jpg');
    expect(component['currentType']()).toBe('image/jpeg');
  });

  it('should fallback gracefully when dropped image fails to load or triggers onerror', async () => {
    fixture.detectChanges();
    triggerImageLoadSuccess = false; // Mock loading failure

    let changePayload: {
      image: string;
      imageWidth: string;
      imageHeight: string;
      imageType: string;
    } | null = null;
    component.imageChange.subscribe((val) => (changePayload = val));

    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [] as File[],
        getData: (format: string) => (format === 'text' ? 'https://bad-domain.xyz/empty.svg' : ''),
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentWidth']()).toBe('');
    expect(component['currentHeight']()).toBe('');
    const payload = changePayload as unknown as { imageWidth: string; imageHeight: string };
    expect(payload?.imageWidth).toBe('');
    expect(payload?.imageHeight).toBe('');
  });

  it('should process selected files from standard local folder input selection', async () => {
    fixture.detectChanges();

    const file = new File(['dummy'], 'rooster.webp', { type: 'image/webp' });
    const event = {
      target: {
        files: [file],
      },
    } as unknown as Event;

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:rooster';
    URL.revokeObjectURL = vi.fn();

    component.onFileSelected(event);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentType']()).toBe('image/webp');
    expect(component['currentWidth']()).toBe('800');

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should remove image and clear all state variables on removeImage() click', () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.detectChanges();
    expect(component['previewUrl']()).toBe('/images/recipes/2026/06/pasta.png');

    let changePayload: {
      image: string;
      imageWidth: string;
      imageHeight: string;
      imageType: string;
    } | null = null;
    component.imageChange.subscribe((val) => (changePayload = val));

    component.removeImage();
    fixture.detectChanges();

    expect(component['previewUrl']()).toBe('');
    expect(component['currentPath']()).toBe('');
    expect(component['currentWidth']()).toBe('');
    expect(component['currentHeight']()).toBe('');
    expect(component['currentType']()).toBe('');
    expect(changePayload).toEqual({
      image: '',
      imageWidth: '',
      imageHeight: '',
      imageType: '',
    });
  });

  it('should resolve file extension MIME types correctly', () => {
    fixture.detectChanges();
    expect(component['getMimeTypeFromExtension']('png')).toBe('image/png');
    expect(component['getMimeTypeFromExtension']('jpg')).toBe('image/jpeg');
    expect(component['getMimeTypeFromExtension']('jpeg')).toBe('image/jpeg');
    expect(component['getMimeTypeFromExtension']('webp')).toBe('image/webp');
    expect(component['getMimeTypeFromExtension']('gif')).toBe('image/gif');
    expect(component['getMimeTypeFromExtension']('svg')).toBe('image/svg+xml');
    expect(component['getMimeTypeFromExtension']('avif')).toBe('image/avif');
    expect(component['getMimeTypeFromExtension']('unknown')).toBe('image/jpeg');
  });

  it('should trigger click on fileInput when dropzone is focused and space/enter key is pressed', () => {
    fixture.detectChanges();
    const fileInputEl = fixture.componentInstance.fileInput()?.nativeElement;
    if (!fileInputEl) {
      throw new Error('fileInput element not found');
    }
    const fileInputSpy = vi.spyOn(fileInputEl, 'click');

    const dropzone = fixture.nativeElement.querySelector('[role="button"]');
    expect(dropzone).toBeTruthy();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    dropzone.dispatchEvent(enterEvent);
    expect(fileInputSpy).toHaveBeenCalledTimes(1);

    const spaceEvent = new KeyboardEvent('keydown', { key: 'Space' });
    dropzone.dispatchEvent(spaceEvent);
    expect(fileInputSpy).toHaveBeenCalledTimes(2);
  });

  it('should fallback gracefully when selected local file fails to load or triggers onerror', async () => {
    fixture.detectChanges();
    triggerImageLoadSuccess = false; // Mock loading failure

    let changePayload: {
      image: string;
      imageWidth: string;
      imageHeight: string;
      imageType: string;
    } | null = null;
    component.imageChange.subscribe((val) => (changePayload = val));

    const file = new File(['dummy'], 'rooster-bad.webp', { type: 'image/webp' });
    const event = {
      target: {
        files: [file],
      },
    } as unknown as Event;

    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:rooster-bad';
    URL.revokeObjectURL = vi.fn();

    component.onFileSelected(event);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['currentWidth']()).toBe('');
    expect(component['currentHeight']()).toBe('');
    const payload = changePayload as unknown as { imageWidth: string; imageHeight: string };
    expect(payload?.imageWidth).toBe('');
    expect(payload?.imageHeight).toBe('');

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should fall back to URL parser catch segment when URL parsing throws an error', () => {
    fixture.detectChanges();
    const result = component['getFilenameAndExtensionFromUrl'](
      '/not-a-valid-absolute-url/banana.png',
    );
    expect(result).toEqual({ name: 'banana', ext: 'png' });
  });

  it('should trigger drag and click handlers from template DOM interactions', () => {
    fixture.detectChanges();

    const dropzone = fixture.nativeElement.querySelector('[role="button"]');
    expect(dropzone).toBeTruthy();

    // Trigger dragover DOM event
    const dragoverEv = new CustomEvent('dragover');
    dropzone.dispatchEvent(dragoverEv);
    fixture.detectChanges();
    expect(component['dragOver']()).toBe(true);

    // Trigger dragleave DOM event
    const dragleaveEv = new CustomEvent('dragleave');
    dropzone.dispatchEvent(dragleaveEv);
    fixture.detectChanges();
    expect(component['dragOver']()).toBe(false);

    // Trigger click DOM event
    const fileInputEl = fixture.componentInstance.fileInput()?.nativeElement;
    if (!fileInputEl) {
      throw new Error('fileInput element not found');
    }
    const fileInputSpy = vi.spyOn(fileInputEl, 'click');
    const clickEv = new CustomEvent('click');
    dropzone.dispatchEvent(clickEv);
    expect(fileInputSpy).toHaveBeenCalled();
  });

  it('should trigger removeImage and onPreviewError DOM bindings when preview exists', async () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.componentRef.setInput('initialWidth', '800');
    fixture.componentRef.setInput('initialHeight', '600');
    fixture.componentRef.setInput('initialType', 'image/png');
    fixture.detectChanges();

    const imgEl = fixture.nativeElement.querySelector('img');
    expect(imgEl).toBeTruthy();

    // Trigger preview error DOM event
    const errorEv = new CustomEvent('error');
    imgEl.dispatchEvent(errorEv);
    fixture.detectChanges();

    // Assert that placeholder rendered and img is gone
    expect(fixture.nativeElement.querySelector('img')).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('Preview Unavailable');

    // Trigger remove click DOM event
    const removeBtn = fixture.nativeElement.querySelector('button[aria-label="Remove image"]');
    expect(removeBtn).toBeTruthy();

    let changePayload: {
      image: string;
      imageWidth: string;
      imageHeight: string;
      imageType: string;
    } | null = null;
    component.imageChange.subscribe((val) => (changePayload = val));

    removeBtn.click();
    fixture.detectChanges();

    expect(component['previewUrl']()).toBe('');
    const payload = changePayload as unknown as { image: string };
    expect(payload?.image).toBe('');
  });

  // --- NEW ADDITIONAL BOOSTERS ---
  it('should ignore initialImage updates if the incoming path is identical to currentPath (line 205 falsy)', () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.detectChanges();
    // Setting identical path again
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.detectChanges();
    expect(component['currentPath']()).toBe('/images/recipes/2026/06/pasta.png');
  });

  it('should ignore dropped files that are not images (line 244 falsy)', () => {
    const file = new File(['text content'], 'notes.txt', { type: 'text/plain' });
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    expect(component['currentPath']()).toBe(''); // Remains empty
  });

  it('should handle drop events where dataTransfer is missing or empty (lines 247/250 falsy)', () => {
    // 1. dataTransfer is null
    const dropEvent1 = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: null,
    } as unknown as DragEvent;
    component.onDrop(dropEvent1);
    expect(component['currentPath']()).toBe('');

    // 2. dataTransfer has no files and text is empty
    const dropEvent2 = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [] as File[],
        getData: () => '',
      },
    } as unknown as DragEvent;
    component.onDrop(dropEvent2);
    expect(component['currentPath']()).toBe('');
  });

  it('should handle onFileSelected when files array is empty or undefined (line 260 falsy)', () => {
    component.onFileSelected({ target: { files: null } } as unknown as Event);
    expect(component['currentPath']()).toBe('');

    component.onFileSelected({ target: { files: [] as unknown as FileList } } as unknown as Event);
    expect(component['currentPath']()).toBe('');
  });

  it('should handle URL parsing boundary cases (lines 387, 391, 397, 398, 400, 407)', () => {
    // URL with empty pathname (line 387 fallback)
    const result1 = component['getFilenameAndExtensionFromUrl']('https://example.com/');
    expect(result1.ext).toBe('jpg');

    // URL with trailing dot (line 391 fallback)
    const result2 = component['getFilenameAndExtensionFromUrl']('https://example.com/image.');
    expect(result2.ext).toBe('jpg');

    // Throwing error and trailing segment fallback missing (line 397/398 fallbacks)
    const result3 = component['getFilenameAndExtensionFromUrl']('/');
    expect(result3.ext).toBe('jpg');

    // Throwing error with no dot (line 398 falsy)
    const result4 = component['getFilenameAndExtensionFromUrl']('/recipes/lasagna');
    expect(result4.ext).toBe('jpg');

    // Throwing error with trailing dot (line 400 fallback)
    const result5 = component['getFilenameAndExtensionFromUrl']('/recipes/lasagna.');
    expect(result5.ext).toBe('jpg');

    // Slug fallback to "recipe-image" if recipeSlug is empty (line 407)
    fixture.componentRef.setInput('recipeSlug', '');
    fixture.detectChanges();
    const result6 = component['getFilenameAndExtensionFromUrl']('/');
    expect(result6.name).toBe('recipe-image');
  });

  it('should support DragEvent types natively inside drag DOM event handlers', () => {
    fixture.detectChanges();
    const dropzone = fixture.nativeElement.querySelector('[role="button"]');

    // Trigger dragover with proper Event
    dropzone.dispatchEvent(new Event('dragover'));
    fixture.detectChanges();
    expect(component['dragOver']()).toBe(true);

    // Trigger dragleave with proper Event
    dropzone.dispatchEvent(new Event('dragleave'));
    fixture.detectChanges();
    expect(component['dragOver']()).toBe(false);
  });

  it('should trigger dragleave via debugElement and natively to hit template line 33', () => {
    fixture.detectChanges();
    const dropzoneDe = fixture.debugElement.query(By.css('[role="button"]'));
    dropzoneDe.triggerEventHandler('dragleave', {
      preventDefault: () => {
        /* noop */
      },
      stopPropagation: () => {
        /* noop */
      },
    });
    fixture.detectChanges();

    // Natively dispatch to hit template binding compiler branch
    const dropzone = fixture.nativeElement.querySelector('[role="button"]') as HTMLElement;
    const dragEvent = new Event('dragleave');
    Object.defineProperty(dragEvent, 'preventDefault', { value: vi.fn() });
    Object.defineProperty(dragEvent, 'stopPropagation', { value: vi.fn() });
    dropzone.dispatchEvent(dragEvent);
    fixture.detectChanges();

    expect(component['dragOver']()).toBe(false);
  });

  it('should cover imgPath === currentPath branch in effect (line 205)', () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/rooster.jpg');
    fixture.componentRef.setInput('initialWidth', '800');
    fixture.detectChanges();

    // Pre-set the internal value to the same value
    component['value'].set('/images/recipes/2026/06/rooster.jpg');

    // Set a different width to trigger effect re-run, keeping the image path identical
    fixture.componentRef.setInput('initialWidth', '900');
    fixture.detectChanges();

    expect(component['currentPath']()).toBe('/images/recipes/2026/06/rooster.jpg');
  });

  it('should render a required asterisk in the label when required input is true', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    const labelSpan = fixture.nativeElement.querySelector('span.text-xs');
    expect(labelSpan).toBeTruthy();
    expect(labelSpan.textContent).toContain('*');
  });

  it('should hide individual metadata form fields when they contain nothing (empty, 0, None)', () => {
    // 1. Initial State: all are empty/nothing, so metadata container shouldn't even render
    fixture.detectChanges();
    let container = fixture.nativeElement.querySelector('.custom-metadata-fields');
    expect(container).toBeFalsy();

    // 2. Set only type, but width and height to '0' or 'none' (nothing values)
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.componentRef.setInput('initialWidth', '0');
    fixture.componentRef.setInput('initialHeight', 'None');
    fixture.componentRef.setInput('initialType', 'image/png');
    fixture.detectChanges();

    container = fixture.nativeElement.querySelector('.custom-metadata-fields');
    expect(container).toBeTruthy();

    const fields = fixture.nativeElement.querySelectorAll('mat-form-field');
    // Should only render the MIME type field (1 mat-form-field instead of 3)
    expect(fields).toHaveLength(1);
    expect(fields[0].textContent).toContain('MIME Type');
    expect(fields[0].textContent).not.toContain('Width');
    expect(fields[0].textContent).not.toContain('Height');

    // 3. Set valid width, height and type
    fixture.componentRef.setInput('initialWidth', '1024');
    fixture.componentRef.setInput('initialHeight', '768');
    fixture.detectChanges();

    const allFields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(allFields).toHaveLength(3);
  });

  it('should handle failed upload by removing the image', async () => {
    fixture.detectChanges();
    const recipeService = TestBed.inject(RecipeService);
    vi.spyOn(recipeService, 'upload').mockResolvedValue('');

    const file = new File(['mock content'], 'tasty-tacos.jpg', { type: 'image/jpeg' });
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
      },
    } as unknown as DragEvent;

    component.onDrop(dropEvent);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component['previewUrl']()).toBe('');
    expect(component['currentPath']()).toBe('');
  });

  it('should test isUploading state branch in template', () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    component['isUploading'].set(true);
    fixture.detectChanges();
    const uploadingDiv = fixture.nativeElement.querySelector('.bg-slate-900\\/80');
    expect(uploadingDiv).toBeTruthy();
  });

  it('should render standard img tag when previewUrl is a blob or data url', () => {
    fixture.componentRef.setInput(
      'initialImage',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    );
    fixture.componentRef.setInput('initialWidth', '800');
    fixture.componentRef.setInput('initialHeight', '600');
    fixture.detectChanges();

    // An NgOptimizedImage will have a ng-img attribute or class. A regular one won't have ngSrc.
    const imgElement = fixture.nativeElement.querySelector('img');
    expect(imgElement).toBeTruthy();
    expect(imgElement.getAttribute('src')).toContain('data:image');
    expect(imgElement.getAttribute('ng-reflect-ng-src')).toBeNull();

    // Trigger error on this standard image
    const errorEv = new CustomEvent('error');
    imgElement.dispatchEvent(errorEv);
    fixture.detectChanges();
    expect(component['previewError']()).toBe(true);
  });

  it('should trigger removeImage click on normal preview image', () => {
    fixture.componentRef.setInput('initialImage', '/images/recipes/2026/06/pasta.png');
    fixture.componentRef.setInput('initialWidth', '800');
    fixture.componentRef.setInput('initialHeight', '600');
    fixture.componentRef.setInput('initialType', 'image/png');
    fixture.detectChanges();

    // The normal remove button has class 'close-btn'
    const removeBtn = fixture.nativeElement.querySelector('.close-btn');
    expect(removeBtn).toBeTruthy();

    const spy = vi.spyOn(component, 'removeImage');
    removeBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should calculate aspectRatio computed property correctly', () => {
    fixture.detectChanges();
    expect(component.aspectRatio()).toBe('');

    component['currentWidth'].set('1600');
    component['currentHeight'].set('900');
    expect(component.aspectRatio()).toBe('1600 / 900');

    component['currentWidth'].set('invalid');
    expect(component.aspectRatio()).toBe('');

    component['currentWidth'].set('0');
    component['currentHeight'].set('0');
    expect(component.aspectRatio()).toBe('');
  });

  it('should handle null and undefined in hasValue', () => {
    fixture.detectChanges();
    expect(component['hasValue'](null)).toBe(false);
    expect(component['hasValue'](undefined)).toBe(false);
    expect(component['hasValue']('   ')).toBe(false);
    expect(component['hasValue']('null')).toBe(false);
    expect(component['hasValue']('undefined')).toBe(false);
  });

  it('should cover the !isUploading branch when previewError is true', () => {
    fixture.componentRef.setInput('initialImage', 'fake.jpg');
    component['previewError'].set(true);
    component['isUploading'].set(true);
    fixture.detectChanges();

    // The close button should NOT be present when isUploading is true, even if previewError is true
    const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Remove image"]');
    expect(closeBtn).toBeFalsy();
  });

  it('should test dragleave and destroyed component early return in upload', async () => {
    fixture.detectChanges();
    component.onDragLeave({
      preventDefault: () => undefined,
      stopPropagation: () => undefined,
    } as unknown as DragEvent);
    expect(component['dragOver']()).toBe(false);

    fixture.destroy();
    await (component as unknown as { processFile: (f: File) => Promise<void> }).processFile(
      new File([''], 'test.jpg'),
    );
  });

  it('should set previewError to true when onPreviewError is called', () => {
    component.onPreviewError();
    expect(component['previewError']()).toBe(true);
  });
});
