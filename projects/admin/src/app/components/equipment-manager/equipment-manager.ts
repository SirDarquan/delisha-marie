import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ImageUploaderComponent } from '../image-uploader/image-uploader';
import { FormValueControl } from '@angular/forms/signals';

export interface EquipmentItem {
  title: string;
  url: string;
  image: string;
}

@Component({
  selector: 'app-equipment-manager',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ImageUploaderComponent],
  template: `
    <div class="flex flex-col gap-6">
      @for (item of value(); track $index) {
        <div
          class="p-4 rounded-xl border border-slate-700/60 bg-slate-800/20 relative group transition hover:border-slate-600">
          <button
            type="button"
            (click)="removeItem($index)"
            class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer z-10">
            <span class="material-icons text-sm">close</span>
          </button>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Equipment Title</mat-label>
                <input
                  matInput
                  required
                  [value]="item.title"
                  (input)="updateItem($index, 'title', $event)"
                  placeholder="e.g. Cast Iron Skillet" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Affiliate URL</mat-label>
                <input
                  matInput
                  required
                  type="url"
                  [value]="item.url"
                  (input)="updateItem($index, 'url', $event)"
                  placeholder="https://example.com/..." />
              </mat-form-field>
            </div>

            <div>
              <app-image-uploader
                [value]="item.image"
                [required]="true"
                folder="equipment"
                (valueChange)="updateImage($index, $event)"></app-image-uploader>
            </div>
          </div>
        </div>
      }

      <button
        type="button"
        mat-stroked-button
        (click)="addItem()"
        class="border-dashed border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/40 py-6 rounded-xl transition cursor-pointer">
        <div class="flex items-center justify-center gap-2">
          <span class="material-icons">add</span>
          <span class="font-semibold">Add Equipment</span>
        </div>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentManagerComponent implements FormValueControl<EquipmentItem[]> {
  readonly value = model<EquipmentItem[]>([]);

  addItem() {
    this.value.update((val) => [...val, { title: '', url: '', image: '' }]);
  }

  removeItem(index: number) {
    this.value.update((val) => val.filter((_, i) => i !== index));
  }

  updateItem(index: number, field: keyof EquipmentItem, event: Event) {
    const target = event.target as HTMLInputElement;
    this.value.update((val) => {
      const copy = [...val];
      copy[index] = { ...copy[index], [field]: target.value };
      return copy;
    });
  }

  updateImage(index: number, imagePath: string) {
    this.value.update((val) => {
      const copy = [...val];
      copy[index] = { ...copy[index], image: imagePath };
      return copy;
    });
  }
}
