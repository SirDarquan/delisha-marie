import { Component } from '@angular/core';

@Component({
  selector: 'dm-app-shell',
  template: `
    <main class="flex-grow container mx-auto px-4 py-8 animate-pulse">
      <section class="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
        <!-- Hero Skeleton -->
        <div class="h-[300px] md:h-[450px] w-full skeleton rounded-3xl mb-8"></div>
      </section>
    </main>
    <hr class="skeleton animate-pulse rounded-3xl m-8" />
  `,
})
export class AppShell {}
