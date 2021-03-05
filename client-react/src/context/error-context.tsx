import React from "react";
import { ScoponeError } from "../scopone-rx-service/scopone-errors";

export type ErrorContextStruct = {
  value: ScoponeError | undefined;
  setErrorContextValue: (newValue: ScoponeError) => void;
};

export const ErrorContext = React.createContext<ErrorContextStruct>(null);
