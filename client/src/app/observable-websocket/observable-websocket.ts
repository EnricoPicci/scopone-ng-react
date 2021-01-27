import { Observable, Subscriber, TeardownLogic } from 'rxjs';

export function openSocket(url: string) {
  return new Observable(
    (subscriber: Subscriber<WebSocket>): TeardownLogic => {
      const conn = new WebSocket(url);
      conn.onopen = () => {
        subscriber.next(conn);
      };
      conn.onerror = (err) => {
        console.error('Websocket errored', err);
        subscriber.error(err);
      };
      conn.onclose = (ev) => {
        console.log('Websocket closed', ev);
        subscriber.complete();
      };
    }
  );
}

export function messages(socket: WebSocket) {
  return new Observable(
    (subscriber: Subscriber<MessageEvent>): TeardownLogic => {
      socket.onmessage = (msg: MessageEvent) => {
        subscriber.next(msg);
      };
      socket.onerror = (err) => {
        console.error('Websocket errored', err);
        subscriber.error(err);
      };
      socket.onclose = (ev) => {
        console.log('Websocket closed', ev);
        subscriber.complete();
      };
    }
  );
}
