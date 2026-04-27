// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";

const containerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "400px",
  overflow: "hidden",
  cursor: "ew-resize",
  userSelect: "none",
  touchAction: "none",
  backgroundColor: "#f0f0f0",
};

const imgStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  pointerEvents: "none",
  display: "block",
};

const labelStyle = (side: "before" | "after"): React.CSSProperties => ({
  position: "absolute",
  top: "8px",
  [side === "before" ? "left" : "right"]: "8px",
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "#fff",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "0.8rem",
  fontFamily: "sans-serif",
  pointerEvents: "none",
  zIndex: 4,
});

const sliderLineStyle = (pos: number, vertical: boolean): React.CSSProperties =>
  vertical
    ? {
        position: "absolute",
        left: 0,
        right: 0,
        top: `${pos}%`,
        height: "4px",
        backgroundColor: "#fff",
        transform: "translateY(-50%)",
        zIndex: 10,
        cursor: "ns-resize",
        boxShadow: "0 0 4px rgba(0,0,0,0.5)",
      }
    : {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `${pos}%`,
        width: "4px",
        backgroundColor: "#fff",
        transform: "translateX(-50%)",
        zIndex: 10,
        cursor: "ew-resize",
        boxShadow: "0 0 4px rgba(0,0,0,0.5)",
      };

const sliderButtonStyle = (pos: number, vertical: boolean): React.CSSProperties => ({
  position: "absolute",
  ...(vertical
    ? { left: "50%", top: `${pos}%`, transform: "translate(-50%, -50%)" }
    : { top: "50%", left: `${pos}%`, transform: "translate(-50%, -50%)" }),
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: "#fff",
  border: "2px solid rgba(0,0,0,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 11,
  cursor: vertical ? "ns-resize" : "ew-resize",
  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
  outline: "none",
});

export default function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  startPosition = 50,
  orientation = "horizontal",
}) {
  const [pos, setPos] = useState(Number(startPosition) || 50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const vertical = orientation === "vertical";

  const calcPos = useCallback(
    (e: MouseEvent | Touch) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const raw = vertical
        ? ((e.clientY - rect.top) / rect.height) * 100
        : ((e.clientX - rect.left) / rect.width) * 100;
      setPos(Math.min(100, Math.max(0, raw)));
    },
    [vertical]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) calcPos(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [calcPos]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    calcPos(e.nativeEvent);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    calcPos(e.touches[0]);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (dragging.current) calcPos(e.touches[0]);
  };

  const onTouchEnd = () => { dragging.current = false; };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    const fwd = vertical ? "ArrowDown" : "ArrowRight";
    const bwd = vertical ? "ArrowUp" : "ArrowLeft";
    if (e.key === fwd) { e.preventDefault(); setPos((p) => Math.min(100, p + step)); }
    else if (e.key === bwd) { e.preventDefault(); setPos((p) => Math.max(0, p - step)); }
    else if (e.key === "Home") { e.preventDefault(); setPos(0); }
    else if (e.key === "End") { e.preventDefault(); setPos(100); }
  };

  const clip = vertical
    ? `inset(0 0 ${100 - pos}% 0)`
    : `inset(0 ${100 - pos}% 0 0)`;

  return (
    <div
      ref={containerRef}
      style={{ ...containerStyle, cursor: vertical ? "ns-resize" : "ew-resize" }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* after image — full, bottom layer */}
      <img src={after} alt={afterLabel} style={imgStyle} draggable={false} />

      {/* before image — clipped, top layer */}
      <img
        src={before}
        alt={beforeLabel}
        style={{ ...imgStyle, clipPath: clip, zIndex: 2 }}
        draggable={false}
      />

      {/* labels */}
      <span style={labelStyle("before")}>{beforeLabel}</span>
      <span style={labelStyle("after")}>{afterLabel}</span>

      {/* slider line + handle */}
      <div style={sliderLineStyle(pos, vertical)} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Image comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% revealed`}
        style={sliderButtonStyle(pos, vertical)}
        onKeyDown={onKeyDown}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 6l6 6-6 6" stroke="#555" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function OpacityCompare({
  before,
  after,
  startOpacity = 50,
}) {
  const [opacity, setOpacity] = useState(Number(startOpacity) / 100);

  return (
    <div style={{ ...containerStyle, cursor: "default" }}>
      <img src={after} alt="After" style={imgStyle} draggable={false} />
      <img src={before} alt="Before" style={{ ...imgStyle, opacity, zIndex: 2 }} draggable={false} />
      <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ color: "#fff", fontSize: "0.8rem", fontFamily: "sans-serif", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
          Opacity
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          style={{ width: "140px" }}
        />
      </div>
    </div>
  );
}
