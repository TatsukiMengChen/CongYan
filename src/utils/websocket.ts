import { EventDispatcher } from "./dispatcher";

export class WebSocketClient extends EventDispatcher {
  // #socket链接
  private url = "";
  // #socket实例
  private socket: WebSocket | null = null;
  // #重连次数
  private reconnectAttempts = 0;
  // #最大重连数
  private maxReconnectAttempts = 5;
  // #重连间隔
  private reconnectInterval = 10000; // 10 seconds
  // #发送心跳数据间隔
  private heartbeatInterval = 1000 * 30;
  // #计时器id
  private heartbeatTimer?: NodeJS.Timeout;
  // #彻底终止ws
  private stopWs = false;
  // # 认证状态
  private isAuthenticated = false;
  // *构造函数
  constructor(url: string) {
    super();
    this.url = url;
  }
  // >生命周期钩子
  onopen(callBack: (event: Event) => void) {
    this.addEventListener("open", callBack as (data: unknown) => void);
  }
  onmessage(callBack: (event: MessageEvent) => void) {
    this.addEventListener("message", callBack as (data: unknown) => void);
  }
  onclose(callBack: (event: CloseEvent) => void) {
    this.addEventListener("close", callBack as (data: unknown) => void);
  }
  onerror(callBack: (event: Event) => void) {
    this.addEventListener("error", callBack as (data: unknown) => void);
  }
  // >消息发送
  public send(message: string | Blob): void { // Allow sending Blob
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Allow sending only after authentication or if no auth is needed initially
      // For simplicity here, we assume send is only called after connection is fully established and potentially authenticated.
      // If specific messages need to bypass auth check, logic needs adjustment.
      this.socket.send(message);
    } else {
      console.error("[WebSocket] 未连接或连接未完全建立");
    }
  }

  // !初始化连接
  public connect(authToken?: string): void { // Add optional authToken
    if (this.reconnectAttempts === 0) {
      this.log("WebSocket", `初始化连接中...          ${this.url}`);
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    this.socket = new WebSocket(this.url);
    this.isAuthenticated = false; // Reset authentication status on new connection attempt

    // !websocket连接成功
    this.socket.onopen = (event) => {
      this.stopWs = false;
      // 重置重连尝试成功连接
      this.reconnectAttempts = 0;

      // Send authentication token if provided
      if (authToken) {
        this.log("WebSocket", `连接成功，发送认证 Token...     ${this.url}`);
        this.socket?.send(authToken); // Send token as plain text
        // Assume authentication happens implicitly after sending token.
        // A more robust approach would wait for a confirmation message from the server.
        this.isAuthenticated = true; // Tentatively set as authenticated
      } else {
        // If no token needed, consider authenticated immediately
        this.isAuthenticated = true;
      }

      // 在连接成功时停止当前的心跳检测并重新启动 (Moved to after potential auth)
      // this.startHeartbeat(); // Start heartbeat after connection is open and potentially authenticated
      this.log(
        "WebSocket",
        `连接已打开, 等待服务端数据推送[onopen]...     ${this.url}`
      );
      this.dispatchEvent("open", event as unknown); // Dispatch open event
      // Start heartbeat *after* dispatching open and sending token
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      // Optionally, implement logic here to confirm authentication based on server message
      // e.g., if (message confirms auth) { this.isAuthenticated = true; this.startHeartbeat(); }
      this.dispatchEvent("message", event as unknown);
      // Reset heartbeat on any message activity
      this.startHeartbeat();
    };

    this.socket.onclose = (event) => {
      if (this.reconnectAttempts === 0) {
        this.log("WebSocket", `连接断开[onclose]...    ${this.url}`);
      }
      if (!this.stopWs) {
        this.handleReconnect();
      }
      this.dispatchEvent("close", event as unknown);
    };

    this.socket.onerror = (event) => {
      if (this.reconnectAttempts === 0) {
        this.log("WebSocket", `连接异常[onerror]...    ${this.url}`);
      }
      this.closeHeartbeat();
      this.dispatchEvent("error", event as unknown);
    };
  }

  // > 断网重连逻辑
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.log(
        "WebSocket",
        `尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})       ${this.url}`
      );
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      this.closeHeartbeat();
      this.log("WebSocket", `最大重连失败，终止重连: ${this.url}`);
    }
  }

  // >关闭连接
  public close(): void {
    if (this.socket) {
      this.stopWs = true;
      this.socket.close();
      this.socket = null;
      this.removeEventListener("open");
      this.removeEventListener("message");
      this.removeEventListener("close");
      this.removeEventListener("error");
    }
    this.closeHeartbeat();
  }

  // >开始心跳检测 -> 定时发送心跳消息
  private startHeartbeat(): void {
    // Only start heartbeat if connected and considered authenticated
    if (this.stopWs || !this.isAuthenticated || !this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    if (this.heartbeatTimer) {
      this.closeHeartbeat();
    }
    this.log("WebSocket", "启动心跳检测...");
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isAuthenticated) {
        // Send heartbeat only if authenticated
        this.socket.send(JSON.stringify({ type: "heartBeat", data: {} }));
        this.log("WebSocket", "发送心跳数据...");
      } else {
        this.log("WebSocket", "连接未准备好或未认证，跳过心跳");
        this.closeHeartbeat(); // Stop if connection lost or not authenticated
      }
    }, this.heartbeatInterval);
  }

  // >关闭心跳
  private closeHeartbeat(): void {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }
}


