export type ScoponeError = { message: string };
export const ScoponeErrors: { [id: string]: ScoponeError } = {
  ConnectionError: { message: 'Connection to the server failed' },
  Closed: { message: 'Connection to the server has been closed' },
  GenericConnectionError: {
    message: 'An error in the connection with the server occured',
  },
};
