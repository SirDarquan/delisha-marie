import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipmentManagerComponent } from './equipment-manager';
import { RecipeService } from '../../services/recipe.service';

describe('EquipmentManagerComponent', () => {
  let component: EquipmentManagerComponent;
  let fixture: ComponentFixture<EquipmentManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentManagerComponent],
      providers: [
        {
          provide: RecipeService,
          useValue: {
            upload: vi.fn().mockResolvedValue('test-image.jpg'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add an empty equipment item', () => {
    expect(component.value().length).toBe(0);
    component.addItem();
    expect(component.value().length).toBe(1);
    expect(component.value()[0]).toEqual({ title: '', url: '', image: '' });
  });

  it('should remove an equipment item', () => {
    component.value.set([{ title: 'Test', url: 'https://test.com', image: '' }]);
    component.removeItem(0);
    expect(component.value().length).toBe(0);
  });

  it('should update an equipment item field', () => {
    component.value.set([{ title: 'Old', url: '', image: '' }]);
    const event = { target: { value: 'New' } } as unknown as Event;
    component.updateItem(0, 'title', event);
    expect(component.value()[0].title).toBe('New');
  });

  it('should update an equipment item image', () => {
    component.value.set([{ title: '', url: '', image: 'old.jpg' }]);
    component.updateImage(0, 'new.jpg');
    expect(component.value()[0].image).toBe('new.jpg');
  });
});
