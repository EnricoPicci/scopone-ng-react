import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ScoponeServerService } from '../../../../../scopone-rx-service/src/scopone-server.service';
import { mapTo, share } from 'rxjs/operators';

@Component({
  selector: 'scopone-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  hideAddPlayer$: Observable<boolean>;

  constructor(public scoponeServer: ScoponeServerService) {}

  ngOnInit(): void {
    this.hideAddPlayer$ = this.scoponeServer.playerEnteredOsteria$.pipe(
      mapTo(true),
      share()
    );
  }

  playerEntersOsteria(name: string) {
    this.scoponeServer.playerEntersOsteria(name);
  }
}
