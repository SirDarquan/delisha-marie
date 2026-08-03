import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WakeLock } from './wake-lock';

describe('WakeLock Component', () => {
  let component: WakeLock;
  let fixture: ComponentFixture<WakeLock>;

  class MockWakeLockSentinel extends EventTarget {
    released = false;
    async release(): Promise<void> {
      this.released = true;
      this.dispatchEvent(new Event('release'));
    }
  }

  let mockSentinel: MockWakeLockSentinel;
  let requestSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockSentinel = new MockWakeLockSentinel();
    requestSpy = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: requestSpy,
      },
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [WakeLock],
    }).compileComponents();

    fixture = TestBed.createComponent(WakeLock);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not render anything when wakeLock is not in navigator', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const unsuppFixture = TestBed.createComponent(WakeLock);
    unsuppFixture.detectChanges();

    const compiled = unsuppFixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-slide-toggle')).toBeNull();
  });

  it('should render slide-toggle when wakeLock is supported', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-slide-toggle')).not.toBeNull();
  });

  it('should request wake lock on toggle(true)', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    expect(requestSpy).toHaveBeenCalledWith('screen');
    expect((component as unknown as { isActive: () => boolean }).isActive()).toBe(true);
  });

  it('should release wake lock on toggle(false)', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    expect((component as unknown as { isActive: () => boolean }).isActive()).toBe(true);

    const releaseSpy = vi.spyOn(mockSentinel, 'release');
    await testInstance.toggle(false);

    expect(releaseSpy).toHaveBeenCalled();
    expect((component as unknown as { isActive: () => boolean }).isActive()).toBe(false);
  });

  it('should handle release event listener when sentinel releases', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);

    // Simulate external release
    mockSentinel.dispatchEvent(new Event('release'));
    expect((component as unknown as { isActive: () => boolean }).isActive()).toBe(false);
  });

  it('should handle exception during requestWakeLock gracefully', async () => {
    requestSpy.mockImplementation(async () => {
      throw new Error('Permission denied');
    });
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    expect((component as unknown as { isActive: () => boolean }).isActive()).toBe(false);
  });

  it('should handle exception during release gracefully', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    vi.spyOn(mockSentinel, 'release').mockImplementation(async () => {
      throw new Error('Release failed');
    });

    await testInstance.toggle(false);
    expect((component as unknown as { isActive: () => boolean }).isActive()).toBe(false);
  });

  it('should re-request wake lock on visibilitychange if user wants lock and document is visible', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    requestSpy.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(requestSpy).toHaveBeenCalledWith('screen');
  });

  it('should not re-request wake lock on visibilitychange if document is hidden', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    requestSpy.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('should clean up on destroy', async () => {
    fixture.detectChanges();
    const testInstance = component as unknown as { toggle: (val: boolean) => Promise<void> };

    await testInstance.toggle(true);
    const releaseSpy = vi.spyOn(mockSentinel, 'release');

    fixture.destroy();
    expect(releaseSpy).toHaveBeenCalled();
  });
});
