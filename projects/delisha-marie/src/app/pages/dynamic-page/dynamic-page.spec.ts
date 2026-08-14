import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicPage } from './dynamic-page';
import { ActivatedRoute } from '@angular/router';
import { PagesService, Page } from '../../services/pages.service';
import { SeoService } from '../../services/seo.service';
import { BehaviorSubject } from 'rxjs';
import { Component, Input } from '@angular/core';
import { IMAGE_LOADER } from '@angular/common';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Sidebar } from '../../components/sidebar/sidebar';
import { ContactForm } from '../../components/contact-form/contact-form';
import { ColoredHeaderComponent } from '../../components/colored-header/colored-header';

@Component({
  selector: 'dml-sidebar',
  template: '<div></div>',
  standalone: true,
})
class MockSidebar {}

@Component({
  selector: 'dm-contact-form',
  template: '<div class="contact-form-mock"></div>',
  standalone: true,
})
class MockContactForm {}

@Component({
  selector: 'dm-colored-header',
  template: '<div></div>',
  standalone: true,
})
class MockColoredHeader {
  @Input() title!: string;
}

describe('DynamicPage', () => {
  let component: DynamicPage;
  let fixture: ComponentFixture<DynamicPage>;
  let mockPagesService: Record<string, ReturnType<typeof vi.fn>>;
  let mockSeoService: Record<string, ReturnType<typeof vi.fn>>;
  let routeParams$: BehaviorSubject<{ slug?: string }>;

  beforeEach(async () => {
    mockPagesService = {
      getPage: vi.fn(),
    };
    mockSeoService = {
      setSeoData: vi.fn(),
    };
    routeParams$ = new BehaviorSubject<{ slug?: string }>({ slug: 'about' });

    await TestBed.configureTestingModule({
      imports: [DynamicPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { params: routeParams$ },
        },
        { provide: PagesService, useValue: mockPagesService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: IMAGE_LOADER, useValue: (config: { src: string }) => config.src },
      ],
    })
      .overrideComponent(DynamicPage, {
        remove: { imports: [Sidebar, ContactForm, ColoredHeaderComponent] },
        add: { imports: [MockSidebar, MockContactForm, MockColoredHeader] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DynamicPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load a page when slug is present', async () => {
    const mockPage: Page = {
      id: '1',
      title: 'About Us',
      slug: 'about',
      content: '<p>About Content</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('about');
    expect(component['page']()).toEqual(mockPage);
  });

  it('should handle error when page load fails', async () => {
    mockPagesService['getPage'].mockRejectedValue(new Error('Load Failed'));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('about');
    expect(component['page']()).toBeNull();
  });

  it('should not load a page if slug is missing', async () => {
    routeParams$.next({});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockPagesService['getPage']).not.toHaveBeenCalled();
    expect(component['page']()).toBeNull();
  });

  it('should show contact form if slug is "contact"', async () => {
    const mockPage: Page = {
      id: '2',
      title: 'Contact Us',
      slug: 'contact',
      content: '<p>Contact</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage);
    routeParams$.next({ slug: 'contact' });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.contact-form-mock')).toBeTruthy();
  });

  it('should correctly expose loading state', async () => {
    mockPagesService['getPage'].mockReturnValue(new Promise(() => undefined)); // Never resolves
    fixture.detectChanges();

    expect(component['loading']()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });
});
