import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeEquipment } from './recipe-equipment';
import { RecipeService } from '../../services/recipe.service';
import { ComponentRef } from '@angular/core';
import { vi } from 'vitest';

describe('RecipeEquipment', () => {
  let component: RecipeEquipment;
  let fixture: ComponentFixture<RecipeEquipment>;
  let componentRef: ComponentRef<RecipeEquipment>;
  let recipeServiceMock: {
    getRecipeEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    recipeServiceMock = {
      getRecipeEquipment: vi
        .fn()
        .mockResolvedValue([
          { id: '1', title: 'Test Eq', image: 'test.jpg', url: 'test.com', recipeId: '123' },
        ]),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeEquipment],
      providers: [{ provide: RecipeService, useValue: recipeServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeEquipment);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('recipeId', '123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load equipment data on init', async () => {
    expect(recipeServiceMock.getRecipeEquipment).toHaveBeenCalledWith('123');

    // Wait for resource to resolve
    await fixture.whenStable();
    fixture.detectChanges();

    const equipment = component.equipmentResource.value();
    expect(equipment?.length).toBe(1);
    expect(equipment?.[0].title).toBe('Test Eq');

    // Check DOM
    const html = fixture.nativeElement.innerHTML;
    expect(html).toContain('Test Eq');
    expect(html).toContain('test.jpg');
    expect(html).toContain('test.com');
  });
});
