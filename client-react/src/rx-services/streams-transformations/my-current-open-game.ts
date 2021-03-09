import { merge } from "rxjs";

import { ScoponeServerService } from "../scopone-rx-service/scopone-server.service";

export const myCurrentOpenGame$ = (server: ScoponeServerService) => {
  return merge(
    server.myCurrentOpenGame_ShareReplay$,
    server.myCurrentObservedGame_ShareReplay$
  );
};
