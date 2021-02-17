import { TestBed } from '@angular/core/testing';

import { ScoponeService } from './scopone.service';

describe('ScoponeService', () => {
  let service: ScoponeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoponeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
