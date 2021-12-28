import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from 'src/app/material.module';
import { ErrorComponent } from '../error/error.component';
import { GameListComponent } from '../game-list/game-list.component';
import { NewGameComponent } from '../new-game/new-game.component';

import { PickGameComponent } from './pick-game.component';

describe('PickGameComponent', () => {
  let component: PickGameComponent;
  let fixture: ComponentFixture<PickGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PickGameComponent, NewGameComponent, GameListComponent],
      imports: [
        MaterialModule,
        RouterTestingModule.withRoutes([
          { path: 'error', component: ErrorComponent },
        ]),
      ],
    }).compileComponents();
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
