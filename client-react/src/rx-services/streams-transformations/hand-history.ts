import { map } from "rxjs/operators";
import { ScoponeServerService } from "../scopone-rx-service/scopone-server.service";

export const handHistoryShareReplay$ = (server: ScoponeServerService) => {
  return server.handView_ShareReplay$.pipe(map((handView) => handView.history));
};
