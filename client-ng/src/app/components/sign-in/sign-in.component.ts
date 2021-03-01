import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ScoponeService } from '../../scopone/scopone.service';
import { mapTo, share } from 'rxjs/operators';

@Component({
  selector: 'scopone-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  constructor(public scoponeServer: ScoponeService) {}

  ngOnInit(): void {}

  playerEntersOsteria(name: string) {
    this.scoponeServer.playerEntersOsteria(name);
  }
}
