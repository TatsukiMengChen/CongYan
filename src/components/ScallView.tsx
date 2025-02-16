import { ReactNode, HTMLAttributes } from "react";

interface ScallViewProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const ScrollView = ({
  children,
  className = "",
  ...props
}: ScallViewProps) => {
  return (
    <div className={`h-full overflow-y-auto ${className}`} {...props}>
      {children}
    </div>
  );
};
