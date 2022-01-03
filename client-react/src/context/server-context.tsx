import React from "react";
import { ScoponeServerService } from "../../../scopone-rx-service/src/scopone-server.service";

const service = new ScoponeServerService();

console.log("Server service created");

export const ServerContext = React.createContext(service);
