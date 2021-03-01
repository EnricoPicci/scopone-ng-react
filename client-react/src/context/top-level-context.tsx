import React from "react";
import { ScoponeServerService } from "../scopone-rx-service/scopone-server.service";

const serverAddress = process.env.REACT_APP_SERVER_ADDRESS;

const service = new ScoponeServerService();

service.connect(serverAddress).subscribe();

console.log("Server connected");

export const TopLevelContext = React.createContext(service);
