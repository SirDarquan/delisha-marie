import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './sidebar';
import { AppConfigService } from '../../services/config.service';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let configServiceMock: { KitchenHomeConfig: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    configServiceMock = {
      KitchenHomeConfig: vi.fn().mockReturnValue({
        sidebar_about: 'custom_sidebar.png',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([]), { provide: AppConfigService, useValue: configServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load sidebar_about picture from config', () => {
    expect(component).toBeTruthy();
    expect(component.picture()).toBe('custom_sidebar.png');
  });

  it('should fall back to default profile picture when config has no sidebar_about', () => {
    configServiceMock.KitchenHomeConfig.mockReturnValue(null);
    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.picture()).toBe('delisha_marie_profile.png');
  });

  it('should render all sub-components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-author-bio')).toBeTruthy();
    expect(compiled.querySelector('dm-sidebar-search')).toBeTruthy();
    expect(compiled.querySelector('dm-newsletter')).toBeTruthy();
  });

  it('should project content', () => {
    @Component({
      imports: [Sidebar],
      template: `<dml-sidebar><div id="test-content">Projected</div></dml-sidebar>`,
    })
    class TestHostComponent {}

    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#test-content')).toBeTruthy();
    expect(compiled.querySelector('#test-content')?.textContent).toBe('Projected');
  });
});
