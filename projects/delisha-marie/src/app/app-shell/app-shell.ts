import { Component } from '@angular/core';
import { Header } from '../components/header/header';

@Component({
  imports: [Header],
  selector: 'dm-app-shell',
  template: `
    <dm-header />
    <main class="flex-grow container mx-auto px-4 py-8">
      <section class="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
        <!-- Hero Skeleton -->
        <div class="h-[300px] md:h-[450px] w-full skeleton rounded-3xl mb-8"></div>
      </section>
    </main>
  `,
})
export class AppShell {}
