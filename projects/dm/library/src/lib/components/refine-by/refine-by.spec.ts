import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RefineBy } from './refine-by';

describe('RefineBy Component', () => {
  let component: RefineBy;
  let fixture: ComponentFixture<RefineBy>;

  const mockItems = [
    { name: 'Breakfast', url: '/recipes/breakfast' },
    { name: 'Dinner', url: '/recipes/dinner' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefineBy],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RefineBy);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('items', mockItems);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render items correctly when items array is provided', () => {
    fixture.componentRef.setInput('items', mockItems);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links).toHaveLength(2);

    expect(links[0].textContent?.trim()).toBe('Breakfast');
    expect(links[0].getAttribute('href')).toBe('/recipes/breakfast');

    expect(links[1].textContent?.trim()).toBe('Dinner');
    expect(links[1].getAttribute('href')).toBe('/recipes/dinner');
  });

  it('should not render anything when items array is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('div')).toBeNull();
  });

  it('should apply correct styling classes to buttons', () => {
    fixture.componentRef.setInput('items', mockItems);
    fixture.detectChanges();

    const linkEl = fixture.debugElement.query(By.css('a'));
    expect(linkEl.nativeElement.classList.contains('rounded-full')).toBe(true);
  });
});
