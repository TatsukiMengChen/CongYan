import { BugOutlined, ClearOutlined, CodeOutlined, InfoCircleOutlined, PlayCircleOutlined, ShrinkOutlined } from '@ant-design/icons';
import { Button, Card, FloatButton, Input, List, Space, Tabs, Tag, Tooltip, Typography } from 'antd'; // 导入 FloatButton 和 Tooltip
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

const MAX_CONSOLE_MESSAGES = 50; // Limit the number of messages stored

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
  const [activeTab, setActiveTab] = useState<string>('info'); // State for active tab

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
        {/* Tabs and content remain the same */}
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
                  style={{ marginLeft: '8px' }}
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
        </Tabs>
      </Card>
    </div>
  );
};

export default DebugOverlay;
