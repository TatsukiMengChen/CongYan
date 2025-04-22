import { ReactNode, HTMLAttributes } from "react";

interface ScrollView extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const ScrollView = ({
  children,
  className = "",
  ...props
}: ScrollView) => {
  return (
    <div className={`box-border h-full overflow-y-auto ${className}`} {...props}>
      {children}
    </div>
  );
};
