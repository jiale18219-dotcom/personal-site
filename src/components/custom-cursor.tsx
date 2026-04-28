"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";

const colorMap: Record<string, string> = {
  mint: "rgba(181, 228, 204, 0.58)",
  peach: "rgba(245, 199, 182, 0.56)",
  blue: "rgba(180, 206, 241, 0.56)",
  yellow: "rgba(243, 227, 164, 0.56)",
  pink: "rgba(234, 194, 220, 0.56)",
};

type CursorMode = "flower" | "badge";

type CursorMeta = {
  mode: CursorMode;
  active: boolean;
  color: string;
  label: string;
};

const defaultMeta: CursorMeta = {
  mode: "flower",
  active: false,
  color: colorMap.mint,
  label: "",
};

function resolveCursor(target: HTMLElement | null): CursorMeta {
  const interactive = target?.closest<HTMLElement>("[data-cursor]");

  if (!interactive) {
    return defaultMeta;
  }

  const mode = interactive.dataset.cursor ?? "mint";

  if (mode === "badge") {
    const label = interactive.dataset.cursorText?.toUpperCase();

    if (!label) {
      return defaultMeta;
    }

    return {
      mode: "badge",
      active: true,
      color: colorMap.peach,
      label,
    };
  }

  return {
    mode: "flower",
    active: true,
    color: colorMap[mode] ?? colorMap.mint,
    label: "",
  };
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [meta, setMeta] = useState<CursorMeta>(defaultMeta);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    setEnabled(true);

    const handleMove = (event: MouseEvent) => {
      setX(event.clientX);
      setY(event.clientY);

      const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const nextMeta = resolveCursor(target);
      setMeta((current) => {
        if (
          current.mode === nextMeta.mode &&
          current.active === nextMeta.active &&
          current.color === nextMeta.color &&
          current.label === nextMeta.label
        ) {
          return current;
        }
        return nextMeta;
      });
    };

    const handleLeaveWindow = () => {
      setMeta(defaultMeta);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeaveWindow);
    };
  }, []);

  const style = useMemo(
    () =>
      ({
        left: `${x}px`,
        top: `${y}px`,
        ["--cursor-color" as string]: meta.color,
      }) as CSSProperties,
    [x, y, meta.color],
  );

  if (!enabled) {
    return null;
  }

  return (
    <div
      className={`cursor-shell cursor-shell--${meta.mode} ${meta.active ? "is-active" : ""}`}
      style={style}
      aria-hidden="true"
    >
      {meta.mode === "badge" && <span className="cursor-badge__text">{meta.label}</span>}
    </div>
  );
}
