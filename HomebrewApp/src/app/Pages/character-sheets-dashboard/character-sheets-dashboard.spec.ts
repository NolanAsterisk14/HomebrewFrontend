import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterSheetsDashboard } from './character-sheets-dashboard';

describe('CharacterSheetsDashboard', () => {
  let component: CharacterSheetsDashboard;
  let fixture: ComponentFixture<CharacterSheetsDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSheetsDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterSheetsDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
