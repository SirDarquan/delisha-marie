import {
  Component,
  signal,
  ViewEncapsulation,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      @if (showHeader()) {
        <app-header />
      }
      <div class="flex-grow">
        <router-outlet />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('admin-delisha-marie');
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly showHeader = computed(() => {
    const url = this.currentUrl();
    return (
      this.auth.isAuthenticated() && url && !url.includes('/login') && !url.includes('/signup')
    );
  });
}
