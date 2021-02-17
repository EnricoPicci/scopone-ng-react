import { TestBed } from '@angular/core/testing';

import { ScoponeServerService } from './scopone-server.service';
import { environment } from '../../environments/environment';

describe('ScoponeServerService', () => {
  let service: ScoponeServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoponeServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('when connecting to the server receives an Observable which emits when connection is completre', (done) => {
    let dataEmitted: WebSocket;
    expect(true).toBeTruthy();
    service.connect(environment.serverAddress).subscribe({
      next: (data) => {
        dataEmitted = data;
      },
      error: (err) => {
        console.error('Should not error', err);
        done();
      },
      complete: () => {
        expect(dataEmitted).toBeDefined();
        done();
      },
    });
  });
});
