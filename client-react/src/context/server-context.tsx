import React from "react";
import { ScoponeServerService } from "../scopone-rx-service/scopone-server.service";

const service = new ScoponeServerService();

console.log("Server connected");

export const ServerContext = React.createContext(service);
