import { useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

interface Props {
  children: ReactNode[];
  totalSlides: number;
}

export default function PresentationShell({ children, totalSlides }: Props) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) node.focus();
  }, []);

  const next = useCallback(() => setCurrent(c => Math.min(totalSlides - 1, c + 1)), [totalSlides]);
  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape" && isFullscreen) document.exitFullscreen?.();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    },
    [next, prev, isFullscreen, toggleFullscreen],
  );

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) next();
        else prev();
      }
    };
    window.addEventListener("touchstart", onStart);
    window.addEventListener("touchend", onEnd);
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, [next, prev]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKey}
      className="orbit-presentation h-screen w-screen overflow-hidden outline-none flex flex-col"
      style={{ background: "#0D1117", color: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="flex-1 relative">
        {children.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-500 ${
              i === current
                ? "opacity-100 z-10"
                : i < current
                  ? "opacity-0 -translate-x-8 z-0"
                  : "opacity-0 translate-x-8 z-0"
            }`}
          >
            {i === current || Math.abs(i - current) <= 1 ? slide : null}
          </div>
        ))}

        {current > 0 && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur"
            style={{ background: "rgba(22,27,34,0.8)", border: "1px solid rgba(201,209,217,0.15)" }}
          >
            <ChevronLeft className="w-6 h-6" style={{ color: "#C9D1D9" }} />
          </button>
        )}
        {current < totalSlides - 1 && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-colors backdrop-blur"
            style={{ background: "rgba(22,27,34,0.8)", border: "1px solid rgba(201,209,217,0.15)" }}
          >
            <ChevronRight className="w-6 h-6" style={{ color: "#C9D1D9" }} />
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur"
          style={{ background: "rgba(22,27,34,0.6)", border: "1px solid rgba(201,209,217,0.15)" }}
          title="Tela cheia (F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" style={{ color: "#C9D1D9" }} /> : <Maximize2 className="w-4 h-4" style={{ color: "#C9D1D9" }} />}
        </button>
      </div>

      <div
        className="h-11 flex items-center justify-center gap-2 px-4 z-20 backdrop-blur"
        style={{ background: "rgba(22,27,34,0.5)", borderTop: "1px solid rgba(201,209,217,0.1)" }}
      >
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-2 rounded-full transition-all"
            style={{
              width: i === current ? 32 : 8,
              background: i === current ? "#D4A017" : "rgba(139,148,158,0.3)",
            }}
          />
        ))}
        <span className="ml-3 text-xs" style={{ color: "#8B949E" }}>
          {current + 1} / {totalSlides}
        </span>
      </div>
    </div>
  );
}
