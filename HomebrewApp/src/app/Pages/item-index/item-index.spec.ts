import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemIndex } from './item-index';

describe('ItemIndex', () => {
  let component: ItemIndex;
  let fixture: ComponentFixture<ItemIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemIndex]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
