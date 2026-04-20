import * as React from "react";

export function Code({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}
