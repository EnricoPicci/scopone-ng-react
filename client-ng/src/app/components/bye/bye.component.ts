import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ScoponeService } from '../../scopone/scopone.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'scopone-bye',
  templateUrl: './bye.component.html',
  styleUrls: ['./bye.component.css'],
})
export class ByeComponent implements OnInit {
  gameClosedName$: Observable<string>;
  gameCloserPlayer$: Observable<string>;

  constructor(private router: Router, private scoponeService: ScoponeService) {}

  ngOnInit(): void {
    this.gameClosedName$ = this.scoponeService.myCurrentGameClosed_ShareReplay$.pipe(
      map((game) => `"${game.name}"`)
    );
    this.gameCloserPlayer$ = this.scoponeService.myCurrentGameClosed_ShareReplay$.pipe(
      map((game) => `"${game.closedBy}"`)
    );
  }

  goToGameList() {
    this.router.navigate(['pick-game']);
  }
}
