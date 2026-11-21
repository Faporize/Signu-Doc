"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { fitFontSize } from "@/lib/fit-text";

export type FitTextOptions = {
  fontFamily?: string;
  fontWeight?: number | string;
  /** See fitFontSize: the largest size as a share of the box height. */
  heightRatio?: number;
  maxPx?: number;
  minPx?: number;
  /** Room kept free on each side of the text, in pixels. */
  paddingX?: number;
};

let measuringContext: CanvasRenderingContext2D | null | undefined;

function measureWidthAt100(
  text: string,
  fontFamily: string,
  fontWeight: number | string,
): number {
  if (measuringContext === undefined) {
    measuringContext = document.createElement("canvas").getContext("2d");
  }

  if (!measuringContext) {
    return 0;
  }

  measuringContext.font = `${String(fontWeight)} 100px ${fontFamily}`;

  return measuringContext.measureText(text).width;
}

/**
 * The font size, in pixels, at which the text fills the box without being
 * cut off. It follows the box as it is zoomed, resized or turned, and the
 * text as it is typed, and measures again once web fonts have loaded. Null
 * until the first measurement, when the caller's own size applies.
 */
export function useFitFontSize(
  boxRef: RefObject<HTMLElement | null>,
  text: string,
  {
    fontFamily,
    fontWeight,
    heightRatio,
    maxPx,
    // Far below readable on purpose: an answer that is long for its box is
    // shown whole and small, as the signed PDF shows it, never cut off.
    // Zooming the page makes the box, and so the text, larger.
    minPx = 2,
    paddingX,
  }: FitTextOptions = {},
): number | null {
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;

    if (!box) {
      return;
    }

    let active = true;

    function update() {
      if (!box || !active) {
        return;
      }

      const style = getComputedStyle(box);
      const next = fitFontSize({
        boxHeight: box.clientHeight,
        boxWidth: box.clientWidth,
        heightRatio,
        maxPx,
        minPx,
        paddingX,
        widthAt100: measureWidthAt100(
          text,
          fontFamily ?? style.fontFamily,
          fontWeight ?? style.fontWeight,
        ),
      });

      setSize((previous) => (previous === next ? previous : next));
    }

    update();

    const observer = new ResizeObserver(update);

    observer.observe(box);
    void document.fonts?.ready.then(update);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [
    boxRef,
    fontFamily,
    fontWeight,
    heightRatio,
    maxPx,
    minPx,
    paddingX,
    text,
  ]);

  return size;
}

/**
 * A line of text that fills the box it is in: larger when it is short,
 * smaller when it is long, and never cut off until it would be unreadably
 * small. The box is whatever the parent gives it (100% by 100%).
 */
export function FitText({
  align = "center",
  className = "",
  fontFamily,
  fontWeight,
  heightRatio,
  maxPx,
  minPx,
  paddingX = 4,
  text,
}: FitTextOptions & {
  align?: "center" | "start";
  className?: string;
  text: string;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const size = useFitFontSize(boxRef, text, {
    fontFamily,
    fontWeight,
    heightRatio,
    maxPx,
    minPx,
    paddingX,
  });
  const style: CSSProperties = { fontFamily, fontWeight };

  return (
    <span
      className={`flex h-full w-full items-center overflow-hidden ${className}`}
      ref={boxRef}
      style={{ ...style, paddingInline: paddingX }}
    >
      <span
        className={`block w-full overflow-hidden text-ellipsis whitespace-nowrap ${
          align === "center" ? "text-center" : "text-start"
        }`}
        style={{ fontSize: size ?? undefined, lineHeight: 1.4 }}
      >
        {text}
      </span>
    </span>
  );
}

/**
 * A field's box on the page that hands its fitted font size to what is
 * inside it, for text typed straight into the box.
 */
export function FitBox({
  children,
  className,
  options,
  style,
  text,
  title,
}: {
  children: (fontSize: number | null) => ReactNode;
  className?: string;
  options?: FitTextOptions;
  style?: CSSProperties;
  text: string;
  title?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const size = useFitFontSize(boxRef, text, options);

  return (
    <div
      className={className}
      data-signing-field="true"
      ref={boxRef}
      style={style}
      title={title}
    >
      {children(size)}
    </div>
  );
}
