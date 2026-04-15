import { makeAutoObservable, action } from 'mobx';

class WsStatusStore {
  connected = false;

  constructor() {
    makeAutoObservable(this);
  }

  setConnected = action((val: boolean) => {
    this.connected = val;
  });
}

export const wsStatusStore = new WsStatusStore();
