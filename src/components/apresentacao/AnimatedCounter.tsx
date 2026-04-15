import { useEffect, useState } from "react";

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCounter({ value, suffix = "", prefix = "", duration = 1500, active, className, style }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) { setDisplay(0); return; }
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, value, duration]);

  return <span className={className} style={style}>{prefix}{display}{suffix}</span>;
}
