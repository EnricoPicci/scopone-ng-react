import { Injectable } from '@angular/core';
import { ScoponeError } from './scopone-errors';
import { subscribeOn } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  error: ScoponeError;

  private _error$ = new Subject<ScoponeError>();
  error$ = this._error$.asObservable();

  notifyError(error: ScoponeError) {
    this._error$.next(error);
  }
}
