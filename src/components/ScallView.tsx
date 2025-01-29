import { ReactNode } from "react";

interface ScallViewProps {
  children: ReactNode;
}

export const ScallView = ({ children }: ScallViewProps) => {
  return <div className="h-full overflow-y-auto">{children}</div>;
};
