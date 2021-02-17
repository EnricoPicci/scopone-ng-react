import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HandResultComponent } from './hand-result.component';

describe('HandResultComponent', () => {
  let component: HandResultComponent;
  let fixture: ComponentFixture<HandResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HandResultComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
