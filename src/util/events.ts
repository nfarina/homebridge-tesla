type Listener = (...args: any[]) => void;

type ListenerArgs<T> = T extends Listener ? Parameters<T> : never;

export class EventEmitter<E> {
  private events = new Map(); // Can't really make this typesafe.

  public on<T extends keyof E>(type: T, listener: E[T]) {
    const { events } = this;
    const listeners = events.get(type);

    if (listeners) {
      listeners.add(listener);
    } else {
      events.set(type, new Set([listener]));
    }
  }

  public off<T extends keyof E>(type: T, listener: E[T]) {
    this.events.get(type)?.delete(listener);
  }

  public emit<T extends keyof E>(type: T, ...args: ListenerArgs<E[T]>) {
    this.events.get(type)?.forEach((listener: Listener) => listener(...args));
  }
}
