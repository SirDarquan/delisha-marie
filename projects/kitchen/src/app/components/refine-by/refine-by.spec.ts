import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RefineBy, RefineByItem } from './refine-by';

@Component({
  template: `<dml-refine-by [items]="items" />`,
  imports: [RefineBy],
})
class TestHostComponent {
  items: RefineByItem[] = [];
}

describe('RefineBy', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, RefineBy],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render anything when items are empty', () => {
    component.items = [];
    fixture.detectChanges();
    const refineText = fixture.nativeElement.querySelector('span');
    expect(refineText).toBeNull();
  });

  it('should render items correctly', () => {
    component.items = [
      { name: 'Vegan', url: '/vegan' },
      { name: 'Keto', url: '/keto' },
    ];
    fixture.detectChanges();

    const refineText = fixture.nativeElement.textContent;
    expect(refineText).toContain('Refine');

    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links).toHaveLength(2);

    expect(links[0].textContent).toContain('Vegan');
    expect(links[0].getAttribute('href')).toBe('/vegan');

    expect(links[1].textContent).toContain('Keto');
    expect(links[1].getAttribute('href')).toBe('/keto');
  });
});
