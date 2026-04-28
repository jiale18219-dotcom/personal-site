"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, WheelEvent } from "react";

type PlaygroundCard = {
  id: string;
  title: string;
  note: string;
  image: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotate: number;
};

const WORLD_WIDTH = 1900;
const WORLD_HEIGHT = 1180;

const cards: PlaygroundCard[] = [
  {
    id: "p-01",
    title: "playground / 01",
    note: "daily visual note",
    image: "/assets/playground/img-3842.jpg",
    width: 286,
    height: 214,
    x: 84,
    y: 142,
    rotate: -3.5,
  },
  {
    id: "p-02",
    title: "playground / 02",
    note: "small frame",
    image: "/assets/playground/img-2253.jpg",
    width: 196,
    height: 196,
    x: 478,
    y: 74,
    rotate: 2.5,
  },
  {
    id: "p-03",
    title: "playground / 03",
    note: "character study",
    image: "/assets/playground/playground-36ccc718.png",
    width: 216,
    height: 216,
    x: 780,
    y: 212,
    rotate: -1.5,
  },
  {
    id: "p-04",
    title: "playground / 04",
    note: "color test",
    image: "/assets/playground/playground-9f19276f.png",
    width: 204,
    height: 204,
    x: 1168,
    y: 96,
    rotate: 3,
  },
  {
    id: "p-05",
    title: "playground / 05",
    note: "texture study",
    image: "/assets/playground/playground-9a498547.png",
    width: 226,
    height: 226,
    x: 1510,
    y: 266,
    rotate: -2.2,
  },
  {
    id: "p-06",
    title: "playground / 06",
    note: "wide snapshot",
    image: "/assets/playground/img-2236.jpg",
    width: 312,
    height: 250,
    x: 248,
    y: 548,
    rotate: 2.8,
  },
  {
    id: "p-07",
    title: "playground / 07",
    note: "interface mood",
    image: "/assets/playground/playground-7496c2d6.png",
    width: 330,
    height: 209,
    x: 704,
    y: 640,
    rotate: -3,
  },
  {
    id: "p-08",
    title: "playground / 08",
    note: "vertical memory",
    image: "/assets/playground/img-2223.jpg",
    width: 184,
    height: 352,
    x: 1162,
    y: 520,
    rotate: 1.8,
  },
  {
    id: "p-09",
    title: "playground / 09",
    note: "loose capture",
    image: "/assets/playground/img-2076.jpg",
    width: 268,
    height: 204,
    x: 1488,
    y: 718,
    rotate: 3.4,
  },
  {
    id: "p-10",
    title: "playground / 10",
    note: "soft signal",
    image: "/assets/playground/playground-8kxzo1219.png",
    width: 202,
    height: 202,
    x: 84,
    y: 902,
    rotate: -1.8,
  },
  {
    id: "p-11",
    title: "playground / 11",
    note: "bright pause",
    image: "/assets/playground/img-2887.jpg",
    width: 286,
    height: 214,
    x: 514,
    y: 908,
    rotate: 2.4,
  },
  {
    id: "p-12",
    title: "playground / 12",
    note: "near square",
    image: "/assets/playground/img-2849.jpg",
    width: 212,
    height: 201,
    x: 1038,
    y: 902,
    rotate: -3.2,
  },
  {
    id: "p-13",
    title: "playground / 13",
    note: "tall fragment",
    image: "/assets/playground/img-2376.png",
    width: 166,
    height: 360,
    x: 1372,
    y: 146,
    rotate: 1.4,
  },
];

function wrapOffset(value: number, size: number) {
  return ((value % size) + size) % size - size;
}

export function PlaygroundCanvas() {
  const [offset, setOffset] = useState({ x: -260, y: -90 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const loopOffset = useMemo(
    () => ({
      x: wrapOffset(offset.x, WORLD_WIDTH),
      y: wrapOffset(offset.y, WORLD_HEIGHT),
    }),
    [offset.x, offset.y],
  );

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragging = dragRef.current;
    if (!dragging || dragging.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragging.x;
    const deltaY = event.clientY - dragging.y;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };

    setOffset((current) => ({
      x: current.x + deltaX,
      y: current.y + deltaY,
    }));
  };

  const stopDragging = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    event.preventDefault();
    setOffset((current) => ({
      x: current.x - event.deltaX * 0.92,
      y: current.y - event.deltaY * 0.92,
    }));
  };

  return (
    <main
      className={`playground-stage${isDragging ? " is-dragging" : ""}`}
      data-cursor="blue"
      aria-label="Draggable spatial playground image wall"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onWheel={handleWheel}
    >
      <div className="playground-hint" aria-hidden="true">
        <span>drag / scroll to move</span>
        <span>new image scraps</span>
      </div>

      <div
        className="playground-plane"
        style={
          {
            "--plane-x": `${loopOffset.x}px`,
            "--plane-y": `${loopOffset.y}px`,
          } as CSSProperties
        }
      >
        {[-1, 0, 1].map((tileY) =>
          [-1, 0, 1].map((tileX) =>
            cards.map((card) => (
              <article
                key={`${card.id}-${tileX}-${tileY}`}
                className="playground-card"
                data-cursor="mint"
                style={
                  {
                    width: card.width,
                    left: card.x + tileX * WORLD_WIDTH,
                    top: card.y + tileY * WORLD_HEIGHT,
                    "--card-rotate": `${card.rotate}deg`,
                  } as CSSProperties
                }
              >
                <div className="playground-card__visual" style={{ height: card.height }}>
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="(max-width: 900px) 58vw, 330px"
                    className="playground-card__image"
                    draggable={false}
                  />
                </div>
                <p className="playground-card__title">{card.title}</p>
                <p className="playground-card__note">{card.note}</p>
              </article>
            )),
          ),
        )}
      </div>
    </main>
  );
}
