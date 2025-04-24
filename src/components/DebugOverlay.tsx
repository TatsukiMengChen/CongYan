import { BugOutlined, ClearOutlined, CloudOutlined, CodeOutlined, InfoCircleOutlined, PlayCircleOutlined, ShrinkOutlined } from '@ant-design/icons'; // 导入 CloudOutlined
import { Button, Card, FloatButton, Input, List, Modal, Space, Spin, Tabs, Tag, Tooltip, Typography } from 'antd'; // 导入 FloatButton, Tooltip, Spin, Modal
import React, { useCallback, useEffect, useRef, useState } from "react";

interface DebugOverlayProps {
  prefersDarkMode: boolean;
}

const { Text, Paragraph } = Typography;

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'input' | 'output'; // Add input/output types
  timestamp: number;
  message: any[]; // Store message arguments
}

// --- Network Log Types ---
type NetworkLogStatus = 'pending' | 'success' | 'error';
interface NetworkLog {
  id: string; // Unique identifier for the request
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  logStatus: NetworkLogStatus;
  type: 'fetch' | 'xhr';
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any; // Store response body if possible
  error?: any; // Store error object
}
// --- End Network Log Types ---


const MAX_CONSOLE_MESSAGES = 50; // Limit the number of messages stored
const MAX_NETWORK_LOGS = 50; // Limit the number of network logs stored

const { TabPane } = Tabs;

const DebugOverlay: React.FC<DebugOverlayProps> = ({ prefersDarkMode }) => {
  const [debugInfo, setDebugInfo] = useState({
    hostname: "",
    href: "",
    userAgent: "",
    windowWidth: 0,
    windowHeight: 0,
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
    isOnline: true,
    language: "",
  });
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [position, setPosition] = useState({ x: window.innerWidth - 60, y: window.innerHeight - 100 }); // Adjust initial position for float button
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null); // Ref for the main card/wrapper
  const floatButtonRef = useRef<HTMLDivElement>(null); // Ref for the float button
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [consoleInput, setConsoleInput] = useState<string>(''); // State for console input
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]); // State for network logs
  const [activeTab, setActiveTab] = useState<string>('info'); // State for active tab
  const [selectedNetworkLog, setSelectedNetworkLog] = useState<NetworkLog | null>(null); // State for modal

  const updateDebugInfo = useCallback(() => { // Wrap in useCallback
    setDebugInfo({
      hostname: window.location.hostname,
      href: window.location.href,
      userAgent: navigator.userAgent,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      isOnline: navigator.onLine,
      language: navigator.language,
    });
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    // Initial update
    updateDebugInfo();

    // Update on resize and online/offline status change
    window.addEventListener("resize", updateDebugInfo);
    window.addEventListener("online", updateDebugInfo);
    window.addEventListener("offline", updateDebugInfo);

    // Adjust position on resize if too close to edge
    const handleResize = () => {
      if (overlayRef.current) {
        const overlayRect = overlayRef.current.getBoundingClientRect();
        setPosition(prevPos => ({
          x: Math.min(prevPos.x, window.innerWidth - overlayRect.width - 10),
          y: Math.min(prevPos.y, window.innerHeight - overlayRect.height - 10)
        }));
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener("resize", updateDebugInfo);
      window.removeEventListener("online", updateDebugInfo);
      window.removeEventListener("offline", updateDebugInfo);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateDebugInfo]); // Add updateDebugInfo to dependency array

  // --- Console Interception ---
  useEffect(() => {
    const originalConsole = { ...console };
    const consoleTypes: Array<keyof Console> = ['log', 'warn', 'error', 'info', 'debug'];

    const logToOverlay = (type: ConsoleMessage['type'], ...args: any[]) => {
      setConsoleMessages(prevMessages => {
        const newMessage: ConsoleMessage = { type, timestamp: Date.now(), message: args };
        const updatedMessages = [newMessage, ...prevMessages];
        if (updatedMessages.length > MAX_CONSOLE_MESSAGES) {
          updatedMessages.length = MAX_CONSOLE_MESSAGES;
        }
        return updatedMessages;
      });
    }

    const intercept = (type: ConsoleMessage['type']) => (...args: any[]) => {
      logToOverlay(type, ...args);
      // Call the original console method only if it exists on the original console
      if (type !== 'input' && type !== 'output' && typeof originalConsole[type] === 'function') {
        originalConsole[type](...args);
      }
    };

    consoleTypes.forEach(type => {
      if (typeof console[type] === 'function') {
        (console as any)[type] = intercept(type as ConsoleMessage['type']);
      }
    });

    // Global error handler for uncaught exceptions
    const errorHandler = (event: ErrorEvent) => {
      logToOverlay('error', `Uncaught Error: ${event.message}`, event.error);
    };
    window.addEventListener('error', errorHandler);

    // Global handler for unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      logToOverlay('error', `Unhandled Rejection:`, event.reason);
    };
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Cleanup: Restore original console methods and remove global handlers
    return () => {
      consoleTypes.forEach(type => {
        if (typeof originalConsole[type] === 'function') {
          (console as any)[type] = originalConsole[type];
        }
      });
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []); // Run only once on mount

  // --- Network Interception ---
  useEffect(() => {
    const originalFetch = window.fetch;
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const originalXhrSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    const addNetworkLog = (log: Partial<NetworkLog> & { id: string }) => {
      setNetworkLogs(prevLogs => {
        const existingIndex = prevLogs.findIndex(l => l.id === log.id);
        let updatedLogs;
        if (existingIndex !== -1) {
          // Update existing log
          const updatedLog = { ...prevLogs[existingIndex], ...log };
          if (updatedLog.startTime && updatedLog.endTime) {
            updatedLog.duration = updatedLog.endTime - updatedLog.startTime;
          }
          updatedLogs = [...prevLogs];
          updatedLogs[existingIndex] = updatedLog;
        } else {
          // Add new log
          updatedLogs = [{ ...log, startTime: Date.now(), logStatus: 'pending' } as NetworkLog, ...prevLogs];
          if (updatedLogs.length > MAX_NETWORK_LOGS) {
            updatedLogs.length = MAX_NETWORK_LOGS;
          }
        }
        return updatedLogs;
      });
    };

    // Intercept Fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const id = `fetch-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
      const method = init?.method?.toUpperCase() ?? 'GET';
      const requestHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => { requestHeaders[key] = value; });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => { requestHeaders[key] = value; });
        } else {
          Object.assign(requestHeaders, init.headers);
        }
      }

      addNetworkLog({
        id,
        url,
        method,
        type: 'fetch',
        requestHeaders,
        requestBody: init?.body, // Note: Body might be stream, difficult to capture fully here
      });

      const startTime = Date.now();
      try {
        const response = await originalFetch(input, init);
        const endTime = Date.now();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => { responseHeaders[key] = value; });

        // Clone response to read body safely
        const clonedResponse = response.clone();
        let responseBody: any = '[Response body not captured]';
        try {
          // Attempt to read body based on content type
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            responseBody = await clonedResponse.json();
          } else if (contentType?.includes('text')) {
            responseBody = await clonedResponse.text();
          } else {
            responseBody = '[Binary or unsupported content type]';
          }
        } catch (bodyError) {
          console.error("Error reading response body:", bodyError);
          responseBody = '[Error reading response body]';
        }


        addNetworkLog({
          id,
          status: response.status,
          statusText: response.statusText,
          endTime,
          logStatus: response.ok ? 'success' : 'error',
          responseHeaders,
          responseBody,
        });
        return response;
      } catch (error) {
        const endTime = Date.now();
        addNetworkLog({
          id,
          endTime,
          logStatus: 'error',
          status: 0, // Indicate network error
          statusText: 'Fetch Failed',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const xhrDataMap = new Map<XMLHttpRequest, { id: string; method: string; url: string; requestHeaders: Record<string, string> }>();

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
      const id = `xhr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const urlString = url instanceof URL ? url.href : url;
      xhrDataMap.set(this, { id, method: method.toUpperCase(), url: urlString, requestHeaders: {} });

      addNetworkLog({
        id,
        url: urlString,
        method: method.toUpperCase(),
        type: 'xhr',
      });

      // Add listeners to capture response/error
      this.addEventListener('load', () => {
        const data = xhrDataMap.get(this);
        if (!data) return;
        const endTime = Date.now();
        const responseHeaders: Record<string, string> = {};
        const headersString = this.getAllResponseHeaders();
        if (headersString) {
          const lines = headersString.trim().split(/[\r\n]+/);
          lines.forEach(line => {
            const parts = line.split(': ');
            const header = parts.shift();
            const value = parts.join(': ');
            if (header) responseHeaders[header.toLowerCase()] = value;
          });
        }

        let responseBody: any = '[Response body not captured]';
        try {
          if (this.responseType === '' || this.responseType === 'text') {
            responseBody = this.responseText;
            // Try parsing if JSON
            try {
              if (responseHeaders['content-type']?.includes('application/json') && typeof responseBody === 'string') {
                responseBody = JSON.parse(responseBody);
              }
            } catch { /* Ignore parsing error */ }
          } else if (this.responseType === 'json') {
            responseBody = this.response;
          } else if (this.response) {
            responseBody = `[${this.responseType} response]`;
          }
        } catch (e) {
          responseBody = '[Error accessing response body]';
        }


        addNetworkLog({
          id: data.id,
          status: this.status,
          statusText: this.statusText,
          endTime,
          logStatus: this.status >= 200 && this.status < 300 ? 'success' : 'error',
          responseHeaders,
          responseBody,
        });
        xhrDataMap.delete(this);
      });

      this.addEventListener('error', () => {
        const data = xhrDataMap.get(this);
        if (!data) return;
        const endTime = Date.now();
        addNetworkLog({
          id: data.id,
          status: this.status, // May be 0 for network errors
          statusText: this.statusText || 'XHR Error',
          endTime,
          logStatus: 'error',
          error: 'Network request failed',
        });
        xhrDataMap.delete(this);
      });

      this.addEventListener('abort', () => {
        const data = xhrDataMap.get(this);
        if (!data) return;
        const endTime = Date.now();
        addNetworkLog({
          id: data.id,
          status: this.status,
          statusText: 'Aborted',
          endTime,
          logStatus: 'error', // Consider aborted as error or separate status
          error: 'Request aborted',
        });
        xhrDataMap.delete(this);
      });


      return originalXhrOpen.call(this, method, url, async ?? true, username, password);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header: string, value: string): void {
      const data = xhrDataMap.get(this);
      if (data) {
        data.requestHeaders[header] = value;
      }
      return originalXhrSetRequestHeader.call(this, header, value);
    };


    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
      const data = xhrDataMap.get(this);
      if (data) {
        // Update the log with potentially finalized headers and body
        addNetworkLog({
          id: data.id,
          requestHeaders: data.requestHeaders,
          requestBody: body, // Note: Body might be complex type
        });
      }
      return originalXhrSend.call(this, body);
    };


    // Cleanup
    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXhrOpen;
      XMLHttpRequest.prototype.send = originalXhrSend;
      XMLHttpRequest.prototype.setRequestHeader = originalXhrSetRequestHeader;
    };
  }, []); // Run only once on mount
  // --- End Network Interception ---


  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Allow dragging from Card header OR the float button
    const targetElement = e.target as HTMLElement;
    const canDrag = targetElement.closest('.ant-card-head') || targetElement.closest('.debug-float-button');
    if (!canDrag) {
      return;
    }

    setIsDragging(true);
    // Calculate offset relative to the dragged element's position
    const rect = (isCollapsed ? floatButtonRef.current : overlayRef.current)?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: e.clientX - rect.left, // Use rect.left which matches state.x
        y: e.clientY - rect.top,  // Use rect.top which matches state.y
      };
    } else {
      // Fallback if rect is not available immediately
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const targetElement = e.target as HTMLElement;
    const canDrag = targetElement.closest('.ant-card-head') || targetElement.closest('.debug-float-button');
    if (!canDrag) {
      return;
    }
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = (isCollapsed ? floatButtonRef.current : overlayRef.current)?.getBoundingClientRect();
    if (rect) {
      dragStartPos.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      dragStartPos.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    }
    // e.preventDefault(); // Consider if needed, might interfere with touch scrolling inside card
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const currentRef = isCollapsed ? floatButtonRef.current : overlayRef.current;
    if (!currentRef) return;

    let newX = e.clientX - dragStartPos.current.x;
    let newY = e.clientY - dragStartPos.current.y;

    // Boundary checks
    const overlayRect = currentRef.getBoundingClientRect();
    const width = overlayRect.width > 0 ? overlayRect.width : (isCollapsed ? 50 : 400); // Estimate width
    const height = overlayRect.height > 0 ? overlayRect.height : (isCollapsed ? 50 : 100); // Estimate height

    newX = Math.max(0, Math.min(newX, window.innerWidth - width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - height));

    setPosition({ x: newX, y: newY });
  }, [isDragging, isCollapsed]); // Add isCollapsed dependency

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const currentRef = isCollapsed ? floatButtonRef.current : overlayRef.current;
    if (!currentRef) return;

    // if (e.cancelable) e.preventDefault(); // Prevent scrolling page while dragging

    const touch = e.touches[0];
    let newX = touch.clientX - dragStartPos.current.x;
    let newY = touch.clientY - dragStartPos.current.y;

    // Boundary checks
    const overlayRect = currentRef.getBoundingClientRect();
    const width = overlayRect.width > 0 ? overlayRect.width : (isCollapsed ? 50 : 400);
    const height = overlayRect.height > 0 ? overlayRect.height : (isCollapsed ? 50 : 100);

    newX = Math.max(0, Math.min(newX, window.innerWidth - width));
    newY = Math.max(0, Math.min(newY, window.innerHeight - height));

    setPosition({ x: newX, y: newY });
  }, [isDragging, isCollapsed]); // Add isCollapsed dependency


  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false }); // passive: false for preventDefault potentially
      document.addEventListener("touchend", handleTouchEnd);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  // --- End Drag Logic ---

  const clearConsole = (e?: React.MouseEvent) => { // Make event optional
    e?.stopPropagation(); // Prevent card drag if called from button
    setConsoleMessages([]);
  };

  // --- Add clearNetworkLogs function ---
  const clearNetworkLogs = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNetworkLogs([]);
  };
  // --- End clearNetworkLogs function ---

  // --- Console Execution ---
  const executeConsoleInput = () => {
    if (!consoleInput.trim()) return;

    // Log the input command
    setConsoleMessages(prevMessages => {
      const newMessage: ConsoleMessage = { type: 'input', timestamp: Date.now(), message: [consoleInput] };
      const updatedMessages = [newMessage, ...prevMessages];
      if (updatedMessages.length > MAX_CONSOLE_MESSAGES) {
        updatedMessages.length = MAX_CONSOLE_MESSAGES;
      }
      return updatedMessages;
    });


    try {
      // IMPORTANT: Using eval is a security risk if the input is not controlled.
      // For a debug tool, it might be acceptable, but be aware.
      // eslint-disable-next-line no-eval
      const result = eval(consoleInput);

      // Log the output
      setConsoleMessages(prevMessages => {
        const newMessage: ConsoleMessage = { type: 'output', timestamp: Date.now(), message: [result] };
        const updatedMessages = [newMessage, ...prevMessages];
        if (updatedMessages.length > MAX_CONSOLE_MESSAGES) {
          updatedMessages.length = MAX_CONSOLE_MESSAGES;
        }
        return updatedMessages;
      });

    } catch (error) {
      // Log the error
      setConsoleMessages(prevMessages => {
        const newMessage: ConsoleMessage = { type: 'error', timestamp: Date.now(), message: [error] };
        const updatedMessages = [newMessage, ...prevMessages];
        if (updatedMessages.length > MAX_CONSOLE_MESSAGES) {
          updatedMessages.length = MAX_CONSOLE_MESSAGES;
        }
        return updatedMessages;
      });
    } finally {
      setConsoleInput(''); // Clear input after execution
    }
  };

  const handleConsoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsoleInput(e.target.value);
  };

  const handleConsoleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeConsoleInput();
    }
  };
  // --- End Console Execution ---

  const formatMessageArgs = (args: any[]): string => {
    return args.map(arg => {
      try {
        if (typeof arg === 'object' && arg !== null) {
          return JSON.stringify(arg, null, 2); // Pretty print objects
        }
        return String(arg);
      } catch (e) {
        return '[Unserializable Object]';
      }
    }).join(' ');
  };

  const getTagColor = (type: ConsoleMessage['type']): string => {
    switch (type) {
      case 'error': return 'red';
      case 'warn': return 'gold';
      case 'info': return 'blue';
      case 'debug': return 'purple';
      case 'input': return 'cyan'; // Style for input
      case 'output': return 'geekblue'; // Style for output
      case 'log':
      default: return 'default';
    }
  };

  // --- Network Log Detail Modal ---
  const showNetworkLogDetails = (log: NetworkLog) => {
    setSelectedNetworkLog(log);
  };

  const handleCloseModal = () => {
    setSelectedNetworkLog(null);
  };

  const renderDetailContent = (data: any): React.ReactNode => {
    if (data === undefined || data === null) return <Text type="secondary">N/A</Text>;
    if (typeof data === 'string') {
      try {
        // Try pretty-printing if it's a JSON string
        const parsed = JSON.parse(data);
        return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(parsed, null, 2)}</pre>;
      } catch {
        // Otherwise, display as plain text
        return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{data}</pre>;
      }
    }
    if (typeof data === 'object') {
      return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(data, null, 2)}</pre>;
    }
    return <Text>{String(data)}</Text>;
  };
  // --- End Network Log Detail Modal ---


  // --- Styles ---
  const commonWrapperStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 99999,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    transition: isDragging ? 'none' : 'opacity 0.2s ease', // Smooth opacity change
    opacity: isDragging ? 0.7 : 1,
  };

  const cardStyle: React.CSSProperties = {
    ...commonWrapperStyle, // Inherit common styles
    width: '90vw',
    maxWidth: '400px',
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  };

  const floatButtonStyle: React.CSSProperties = {
    ...commonWrapperStyle, // Inherit common styles
    // FloatButton already has styles, we mainly control position via wrapper
  };

  const cardBodyStyle: React.CSSProperties = {
    padding: 0, // Remove padding, Tabs component will handle it
    maxHeight: "70vh", // Allow more height potentially
    overflow: 'hidden', // Hide Card's overflow, let Tabs/List handle scroll
  };

  const tabPaneStyle: React.CSSProperties = {
    padding: '8px 12px', // Add padding within TabPanes
    // maxHeight: 'calc(70vh - 40px)', // Adjust max height considering tab bar
    overflowY: 'auto',
  };

  const consoleListStyle: React.CSSProperties = {
    maxHeight: 'calc(70vh - 90px)', // Adjust max height considering tab bar and input
    overflowY: 'auto',
    paddingRight: '8px', // Add some padding for scrollbar
  };

  const networkListStyle: React.CSSProperties = {
    maxHeight: 'calc(70vh - 50px)', // Adjust max height considering tab bar
    overflowY: 'auto',
    paddingRight: '8px', // Add some padding for scrollbar
  };

  // --- Render Logic ---
  if (isCollapsed) {
    return (
      <div
        ref={floatButtonRef} // Attach ref to the wrapper for position calculation
        className="debug-float-button" // Add class for drag detection
        style={floatButtonStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <FloatButton
          icon={<BugOutlined />}
          type="primary"
          tooltip="Show Debug Tools"
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag start on click
            setIsCollapsed(false);
          }}
          // We control position via the wrapper div's style
          style={{ position: 'static' }} // Override default FloatButton positioning
        />
      </div>
    );
  }

  // Render the expanded card
  return (
    <div ref={overlayRef} style={cardStyle} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
      <Card
        size="small"
        title={
          <Space style={{ cursor: 'grab' }}> {/* Make title draggable */}
            <BugOutlined />
            <Text>Debug Tools</Text>
          </Space>
        }
        extra={
          <Tooltip title="Hide Debug Tools">
            <Button // Use ShrinkOutlined for collapsing
              type="text"
              size="small"
              icon={<ShrinkOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(true);
              }}
            />
          </Tooltip>
        }
        bodyStyle={cardBodyStyle}
      // Remove cursor style from Card itself, handled by wrapper/title
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="small" style={{ marginBottom: 0 }}>
          <TabPane
            tab={<span><InfoCircleOutlined /> Info</span>}
            key="info"
            style={tabPaneStyle}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text><Text strong>Theme:</Text> <Tag color={prefersDarkMode ? "blue" : "orange"}>{prefersDarkMode ? "Dark" : "Light"}</Tag></Text>
              <Text><Text strong>Domain:</Text> {debugInfo.hostname}</Text>
              <Text><Text strong>URL:</Text> <Paragraph copyable={{ text: debugInfo.href }} style={{ display: 'inline', marginBottom: 0 }}>{debugInfo.href}</Paragraph></Text>
              <Text><Text strong>Window:</Text> {debugInfo.windowWidth}x{debugInfo.windowHeight}</Text>
              <Text><Text strong>Screen:</Text> {debugInfo.screenWidth}x{debugInfo.screenHeight}</Text>
              <Text><Text strong>DPR:</Text> {debugInfo.devicePixelRatio}</Text>
              <Text><Text strong>Online:</Text> <Tag color={debugInfo.isOnline ? "success" : "error"}>{debugInfo.isOnline ? "Yes" : "No"}</Tag></Text>
              <Text><Text strong>Lang:</Text> {debugInfo.language}</Text>
              <Text><Text strong>UA:</Text> <Paragraph copyable={{ text: debugInfo.userAgent }} style={{ marginBottom: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{debugInfo.userAgent}</Paragraph></Text>
            </Space>
          </TabPane>
          <TabPane
            tab={
              <Space size="small">
                <CodeOutlined />
                <span>Console</span>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearConsole}
                  title="Clear Console"
                  style={{ marginLeft: 'auto' }} // Push button to the right
                />
              </Space>
            }
            key="console"
            style={tabPaneStyle}
          >
            <List
              size="small"
              dataSource={consoleMessages}
              renderItem={(item) => (
                <List.Item style={{ padding: '2px 0', borderBottom: '1px dashed #eee', alignItems: 'flex-start' }}>
                  <Tag color={getTagColor(item.type)} style={{ marginRight: '4px', flexShrink: 0, marginTop: '2px' }}>
                    {item.type === 'input' ? '>' : item.type === 'output' ? '<' : item.type.toUpperCase()}
                  </Tag>
                  <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', flexGrow: 1, margin: 0, padding: 0 }}>
                    {formatMessageArgs(item.message)}
                  </pre>
                  <Text type="secondary" style={{ fontSize: '10px', marginLeft: '4px', flexShrink: 0, alignSelf: 'center' }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </Text>
                </List.Item>
              )}
              locale={{ emptyText: 'Console is empty.' }}
              style={consoleListStyle} // Apply style to List
            />
            <Input
              prefix={<PlayCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
              placeholder="Enter JavaScript code and press Enter"
              value={consoleInput}
              onChange={handleConsoleInputChange}
              onKeyDown={handleConsoleInputKeyDown}
              style={{ margin: '8px 0px' }}
              spellCheck={false}
            />
          </TabPane>
          {/* --- Network Tab --- */}
          <TabPane
            tab={
              <Space size="small">
                <CloudOutlined />
                <span>Network</span>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearNetworkLogs}
                  title="Clear Network Logs"
                  style={{ marginLeft: 'auto' }} // Push button to the right
                />
              </Space>
            }
            key="network"
            style={tabPaneStyle} // Reuse style or create specific one
          >
            <List
              size="small"
              dataSource={networkLogs}
              renderItem={(log) => (
                <List.Item
                  style={{ padding: '3px 0', borderBottom: '1px dashed #eee', cursor: 'pointer' }}
                  onClick={() => showNetworkLogDetails(log)}
                >
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space align="center">
                      <Tag color={log.logStatus === 'success' ? 'success' : log.logStatus === 'error' ? 'error' : 'processing'} style={{ width: '65px', textAlign: 'center', marginRight: 0 }}>
                        {log.logStatus === 'pending' ? <Spin size="small" /> : (log.status ?? 'N/A')}
                      </Tag>
                      <Tag style={{ width: '45px', textAlign: 'center', marginRight: 0 }}>{log.method}</Tag>
                      <Tooltip title={log.url}>
                        <Text style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }} >
                          {log.url.split('/').pop() || log.url} {/* Show filename or full URL */}
                        </Text>
                      </Tooltip>
                    </Space>
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      {log.duration !== undefined ? `${log.duration}ms` : '...'}
                    </Text>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'No network activity recorded.' }}
              style={networkListStyle} // Apply style to List
            />
          </TabPane>
          {/* --- End Network Tab --- */}
        </Tabs>
      </Card>
      {/* --- Network Log Detail Modal --- */}
      <Modal
        title="Network Request Details"
        open={!!selectedNetworkLog}
        onCancel={handleCloseModal}
        footer={null} // No default buttons
        width={600} // Adjust width as needed
        destroyOnClose // Destroy modal state when closed
      >
        {selectedNetworkLog && (
          <Tabs defaultActiveKey="headers" size="small">
            <TabPane tab="Headers" key="headers">
              <Typography.Title level={5}>Request Headers</Typography.Title>
              {renderDetailContent(selectedNetworkLog?.requestHeaders)}
              <Typography.Title level={5} style={{ marginTop: 16 }}>Response Headers</Typography.Title>
              {renderDetailContent(selectedNetworkLog?.responseHeaders)}
            </TabPane>
            <TabPane tab="Request" key="request">
              <Typography.Title level={5}>Request Payload</Typography.Title>
              {renderDetailContent(selectedNetworkLog?.requestBody)}
            </TabPane>
            <TabPane tab="Response" key="response">
              <Typography.Title level={5}>Response Body</Typography.Title>
              {renderDetailContent(selectedNetworkLog?.responseBody)}
            </TabPane>
            {selectedNetworkLog?.error && (
              <TabPane tab="Error" key="error">
                <Typography.Title level={5}>Error</Typography.Title>
                {renderDetailContent(selectedNetworkLog?.error)}
              </TabPane>
            )}
          </Tabs>
        )}
      </Modal>
      {/* --- End Network Log Detail Modal --- */}
    </div>
  );
};

export default DebugOverlay;
