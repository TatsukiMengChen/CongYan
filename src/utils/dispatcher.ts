class Log {
  private static console: boolean = true; // 添加类型注解
  log(title: string, text: string): void {
    // 添加返回类型注解
    if (!Log.console) return;
    if (import.meta.env.MODE === "production") return;
    const color = "#ff4d4f";
    console.log(
      `%c ${title} %c ${text} %c`,
      `background:${color};border:1px solid ${color}; padding: 1px; border-radius: 2px 0 0 2px; color: #fff;`,
      `border:1px solid ${color}; padding: 1px; border-radius: 0 2px 2px 0; color: ${color};`,
      "background:transparent"
    );
  }
  closeConsole(): void {
    // 添加返回类型注解
    Log.console = false;
  }
}

export class EventDispatcher extends Log {
  private listeners: { [type: string]: Array<(data: unknown) => void> } = {}; // 明确函数类型

  protected addEventListener(
    type: string,
    listener: (data: unknown) => void
  ): void {
    // 添加参数和返回类型注解
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    if (this.listeners[type].indexOf(listener) === -1) {
      this.listeners[type].push(listener);
    }
  }

  protected removeEventListener(type: string): void {
    // 添加返回类型注解
    this.listeners[type] = [];
  }

  protected dispatchEvent<T>(type: string, data: T): void {
    // 使用泛型替代 any
    const listenerArray = this.listeners[type] || [];
    if (listenerArray.length === 0) return;
    listenerArray.forEach((listener) => {
      listener.call(this, data);
    });
  }
}
