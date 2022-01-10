import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from 'src/app/material.module';
import { PlayerState } from '../../../../../scopone-rx-service/src/model/player';
import { ErrorComponent } from '../error/error.component';
import { TableComponent } from '../table/table.component';

import { PlayerComponent } from './player.component';

describe('PlayerComponent', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PlayerComponent, TableComponent],
      imports: [
        MaterialModule,
        RouterTestingModule.withRoutes([
          { path: 'error', component: ErrorComponent },
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerComponent);
    component = fixture.componentInstance;
    component.player = {
      name: 'a player',
      status: PlayerState.playerPlaying,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
