import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ByeComponent } from './bye.component';

describe('ByeComponent', () => {
  let component: ByeComponent;
  let fixture: ComponentFixture<ByeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ByeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ByeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
