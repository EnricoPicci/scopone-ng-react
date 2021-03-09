import { Subject } from "rxjs";

export class ErrorService {
  private _error$ = new Subject<string>();

  // APIs
  public readonly error$ = this._error$.asObservable();
  public setError = (error: string) => {
    this._error$.next(error);
  };
}
