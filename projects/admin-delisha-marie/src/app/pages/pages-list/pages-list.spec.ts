import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesListComponent } from './pages-list';
import { PagesService } from '../../services/pages.service';
import { provideRouter } from '@angular/router';

describe('PagesListComponent', () => {
  let component: PagesListComponent;
  let fixture: ComponentFixture<PagesListComponent>;
  let pagesServiceSpy: { getPages: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pagesServiceSpy = {
      getPages: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [PagesListComponent],
      providers: [provideRouter([]), { provide: PagesService, useValue: pagesServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load pages on init', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce([{ slug: 'test', title: 'Test', content: '' }]);
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    // Should have called getPages
    expect(pagesServiceSpy.getPages).toHaveBeenCalled();
    expect(component['pages']().length).toBeGreaterThan(0);
  });

  it('should handle getPages error', async () => {
    pagesServiceSpy.getPages.mockRejectedValueOnce(new Error('API error'));

    // We recreate the component so constructor is called with rejected value
    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
    // Error logged to console, loading set to false
    expect(component['loading']()).toBe(false);
  });

  it('should add db pages that are not in defaults', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce([
      { slug: 'new-page', title: 'New', content: '' },
    ]);

    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
    expect(component['pages']().some((p) => p.slug === 'new-page')).toBe(true);
  });

  it('should merge db pages that ARE in defaults', async () => {
    pagesServiceSpy.getPages.mockResolvedValueOnce([
      { slug: 'about', title: 'DB About', content: 'DB Content' },
    ]);

    fixture = TestBed.createComponent(PagesListComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
    const aboutPage = component['pages']().find((p) => p.slug === 'about');
    expect(aboutPage?.title).toBe('DB About');
    expect(aboutPage?.content).toBe('DB Content');
  });
});
