import type { ReactNode } from "react";

interface Props {
  delay?: number;
  children: ReactNode;
  active: boolean;
  className?: string;
}

export default function FadeIn({ delay = 0, children, active, className = "" }: Props) {
  return (
    <div
      className={`transition-all duration-700 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
