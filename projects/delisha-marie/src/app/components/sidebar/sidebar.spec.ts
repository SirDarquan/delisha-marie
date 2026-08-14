import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all sub-components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('dm-author-bio')).toBeTruthy();
    expect(compiled.querySelector('dm-sidebar-search')).toBeTruthy();
    expect(compiled.querySelector('dm-sidebar-newsletter')).toBeTruthy();
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
