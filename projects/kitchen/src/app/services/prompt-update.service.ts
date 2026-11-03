import { DOCUMENT, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PromptUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          const ref = this.snackBar.open(
            'A new version is available.',
            'Reload',
            { duration: 0 }, // ← stays until user clicks
          );

          ref.onAction().subscribe(async () => {
            await this.swUpdate.activateUpdate();
            this.document.location.reload();
          });
        });
    }
  }
}
