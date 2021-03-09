import React from "react";
import { ScoponeServerService } from "../rx-services/scopone-rx-service/scopone-server.service";

const service = new ScoponeServerService();

console.log("Server service created");

export const ServerContext = React.createContext(service);
