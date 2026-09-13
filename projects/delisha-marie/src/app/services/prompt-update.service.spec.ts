import { TestBed } from '@angular/core/testing';
import { PromptUpdateService } from './prompt-update.service';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DOCUMENT } from '@angular/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Subject, of } from 'rxjs';

describe('PromptUpdateService', () => {
  let service: PromptUpdateService;
  let swUpdateMock: {
    isEnabled: boolean;
    versionUpdates: Subject<unknown>;
    activateUpdate: unknown;
  };
  let snackBarMock: { open: unknown };
  let documentMock: { location: { reload: unknown } };

  beforeEach(() => {
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: new Subject<unknown>(),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };

    snackBarMock = {
      open: vi.fn().mockReturnValue({
        onAction: () => of(void 0),
      }),
    };

    documentMock = {
      location: {
        reload: vi.fn(),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PromptUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: DOCUMENT, useValue: documentMock },
      ],
    });
  });

  it('should be created and not throw when isEnabled is false', () => {
    swUpdateMock.isEnabled = false;
    service = TestBed.inject(PromptUpdateService);
    expect(service).toBeTruthy();
  });

  it('should subscribe to versionUpdates and open snackBar on VERSION_READY', async () => {
    service = TestBed.inject(PromptUpdateService);

    // Emit irrelevant event
    swUpdateMock.versionUpdates.next({ type: 'VERSION_DETECTED' });
    expect(snackBarMock.open).not.toHaveBeenCalled();

    // Emit VERSION_READY
    const actionSubject = new Subject<void>();
    (snackBarMock.open as ReturnType<typeof vi.fn>).mockReturnValue({
      onAction: () => actionSubject.asObservable(),
    });

    swUpdateMock.versionUpdates.next({ type: 'VERSION_READY' });

    expect(snackBarMock.open).toHaveBeenCalledWith('A new version is available.', 'Reload', {
      duration: 0,
    });

    // Simulate clicking Reload
    actionSubject.next();

    // Wait for async activateUpdate
    await new Promise((r) => setTimeout(r, 0));
    expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
    expect(documentMock.location.reload).toHaveBeenCalled();
  });
});
