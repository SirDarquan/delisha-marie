import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { About } from './about';
import { PagesService } from '../../services/pages.service';

describe('About', () => {
  let pagesServiceSpy: { getPage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pagesServiceSpy = {
      getPage: vi.fn().mockResolvedValue(null),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideRouter([]), { provide: PagesService, useValue: pagesServiceSpy }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(About);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the personal story when no page is found', async () => {
    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Delisha Marie');
    expect(compiled.textContent).toContain('culinary adventures');
  });

  it('should render the sidebar', async () => {
    const fixture = TestBed.createComponent(About);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dml-sidebar')).toBeTruthy();
  });

  it('should render the dynamic page when found', async () => {
    pagesServiceSpy.getPage.mockResolvedValueOnce({
      slug: 'about',
      title: 'Dynamic About',
      content: '<p>Dynamic content</p>',
    });

    const fixture = TestBed.createComponent(About);
    fixture.detectChanges(); // Triggers ngOnInit
    await fixture.whenStable(); // Waits for getPage promise
    fixture.detectChanges(); // Updates template with the new signal value

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Dynamic About');
    expect(compiled.innerHTML).toContain('<p>Dynamic content</p>');
    // Should NOT contain the hardcoded text
    expect(compiled.textContent).not.toContain('culinary adventures');
  });
});
