import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'dml-header-logo',
  imports: [RouterLink],
  template: `
    @if (href()) {
      <a class="flex items-center cursor-pointer logo-container" [href]="href()">
        @for (part of wordParts(); track $index) {
          <div class="logo-word">
            <span class="logo-letter-bold">{{ part.first }}</span>
            <span class="logo-letter-fade">{{ part.rest }}</span>
          </div>
        }
      </a>
    } @else {
      <a class="flex items-center cursor-pointer logo-container" [routerLink]="routerLink()">
        @for (part of wordParts(); track $index) {
          <div class="logo-word">
            <span class="logo-letter-bold">{{ part.first }}</span>
            <span class="logo-letter-fade">{{ part.rest }}</span>
          </div>
        }
      </a>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderLogo {
  readonly words = input<string[]>([]);
  readonly routerLink = input<string>('/');
  readonly href = input<string | undefined>(undefined);

  protected readonly wordParts = computed(() =>
    this.words()
      .filter((word) => word.length > 0)
      .map((word) => ({
        first: word.charAt(0),
        rest: word.slice(1),
      })),
  );
}
