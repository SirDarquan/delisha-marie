import { Component, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  encapsulation: ViewEncapsulation.None,
})
export class App {
  protected readonly title = signal('admin-delisha-marie');
}
