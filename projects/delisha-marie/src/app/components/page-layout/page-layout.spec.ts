import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PageLayout } from './page-layout';
import { PagesService, Page } from '../../services/pages.service';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Component, input } from '@angular/core';

@Component({
  selector: 'dm-test-host',
  imports: [PageLayout],
  template: `<dm-page-layout [slug]="slug()"><div>Transcluded Content</div></dm-page-layout>`,
})
class TestHostComponent {
  slug = input('test-slug');
}

describe('PageLayout', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockPagesService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    mockPagesService = {
      getPage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PagesService, useValue: mockPagesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
  });

  it('should render page layout when page loads successfully', async () => {
    const mockPage: Page = {
      id: '1',
      title: 'Test Title',
      slug: 'test-slug',
      content: '<p>Test Content</p>',
      updated_at: '2026-08-01',
    };
    mockPagesService['getPage'].mockResolvedValue(mockPage);

    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // wait for resource
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Header should be rendered
    expect(compiled.querySelector('dm-colored-header')).toBeTruthy();

    // Content should be rendered
    expect(compiled.innerHTML).toContain('Test Content');

    // Transcluded content should be visible
    expect(compiled.innerHTML).toContain('Transcluded Content');

    expect(mockPagesService['getPage']).toHaveBeenCalledWith('test-slug');
  });

  it('should render 404 when page load returns null', async () => {
    mockPagesService['getPage'].mockResolvedValue(null);

    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // wait for resource
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('Page Not Found');
  });

  it('should render loading skeleton when loading', async () => {
    mockPagesService['getPage'].mockReturnValue(new Promise(() => undefined)); // never resolves

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should handle errors during page load and show 404', async () => {
    mockPagesService['getPage'].mockRejectedValue(new Error('Network error'));

    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0)); // wait for resource
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('Page Not Found');
  });
});
