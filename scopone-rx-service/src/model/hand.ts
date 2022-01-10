export type Hand = {
  state: HandState;
};

export enum HandState {
  active = "active",
  closed = "closed",
}
