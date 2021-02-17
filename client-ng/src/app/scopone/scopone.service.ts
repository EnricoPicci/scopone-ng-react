import { Injectable } from '@angular/core';

import { ScoponeServerService } from '../../../../scopone-rx-service/src/scopone-server.service';

@Injectable({
  providedIn: 'root',
})
export class ScoponeService extends ScoponeServerService {
  constructor() {
    super();
  }
}
