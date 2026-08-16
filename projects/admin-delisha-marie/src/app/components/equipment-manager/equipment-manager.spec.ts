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

  it('should add an empty equipment item via template button click', () => {
    const button = fixture.debugElement.nativeElement.querySelector('button');
    button.click();
    expect(component.value().length).toBe(1);
    expect(component.value()[0]).toEqual({ title: '', url: '', image: '' });
  });

  it('should remove an equipment item via template button click', () => {
    component.value.set([{ title: 'Test', url: 'https://test.com', image: '' }]);
    fixture.detectChanges();
    const removeBtn = fixture.debugElement.nativeElement.querySelector('.bg-rose-600');
    removeBtn.click();
    expect(component.value().length).toBe(0);
  });

  it('should update an equipment item field via template input', () => {
    component.value.set([{ title: 'Old', url: '', image: '' }]);
    fixture.detectChanges();
    const inputs = fixture.debugElement.nativeElement.querySelectorAll('input');
    inputs[0].value = 'New Title';
    inputs[0].dispatchEvent(new Event('input'));
    
    inputs[1].value = 'https://new.com';
    inputs[1].dispatchEvent(new Event('input'));
    
    expect(component.value()[0].title).toBe('New Title');
    expect(component.value()[0].url).toBe('https://new.com');
  });

  it('should update an equipment item image via template event', () => {
    component.value.set([{ title: '', url: '', image: 'old.jpg' }]);
    fixture.detectChanges();
    const uploader = fixture.debugElement.query(
      (el) => el.name === 'app-image-uploader' || el.nativeElement.tagName.toLowerCase() === 'app-image-uploader'
    );
    uploader.triggerEventHandler('valueChange', 'new.jpg');
    expect(component.value()[0].image).toBe('new.jpg');
  });
});
