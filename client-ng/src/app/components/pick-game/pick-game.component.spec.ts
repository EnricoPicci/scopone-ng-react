import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PickGameComponent } from './pick-game.component';

describe('PickGameComponent', () => {
  let component: PickGameComponent;
  let fixture: ComponentFixture<PickGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PickGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
