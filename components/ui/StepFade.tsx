import type { ReactNode } from "react";

/**
 * Wrap step content and remount with `key` on the parent to replay the fade-in.
 * Usage: <StepFade key={`${flow}-${step}`}>...</StepFade>
 */
export function StepFade({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`step-fade-in ${className}`.trim()}>{children}</div>;
}
