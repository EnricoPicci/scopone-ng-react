import React from "react";
import { ErrorService } from "../rx-services/error-service/error.service";

const errorService = new ErrorService();

console.log("Error service created");

export const ErrorContext = React.createContext(errorService);
