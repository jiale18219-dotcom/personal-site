"use client";

import { useEffect, useMemo, useState } from "react";

const words = [
  "currently building",
  "ai workflow tools",
  "ios + web projects",
  "playful side quests",
];

const charset = "abcdefghijklmnopqrstuvwxyz+*#_";

function getScrambleChar(target: string, index: number, tick: number) {
  let seed = tick * 31 + index * 17 + target.length * 13;

  for (let i = 0; i < target.length; i += 1) {
    seed += target.charCodeAt(i) * (i + 1);
  }

  return charset[seed % charset.length];
}

function scrambleWord(target: string, tick: number) {
  const revealCount = Math.floor((tick / 10) * target.length);
  return target
    .split("")
    .map((char, index) => {
      if (index < revealCount) {
        return char;
      }
      if (char === " ") {
        return " ";
      }
      return getScrambleChar(target, index, tick);
    })
    .join("");
}

export function IntroTags({ name }: { name: string }) {
  const [index, setIndex] = useState(0);
  const [phaseTick, setPhaseTick] = useState(0);

  const target = useMemo(() => words[index], [index]);
  const display = phaseTick >= 10 ? target : scrambleWord(target, phaseTick);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhaseTick((tick) => {
        if (tick >= 10) {
          setIndex((current) => (current + 1) % words.length);
          return 0;
        }
        return tick + 1;
      });
    }, 90);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="note-stage" id="intro">
      <article className="note-card note-card--intro" data-cursor="peach">
        <p>
          I enjoy learning new things, taking on challenges, and growing through every experience.
        </p>
        <p>
          我喜欢学习新事物，迎接挑战，并从每一次经历中成长。
        </p>
      </article>
      <article className="note-card note-card--name" data-cursor="mint">
        <p>{name}</p>
      </article>
      <article className="note-card note-card--dynamic" data-cursor="yellow">
        <p>{display}</p>
      </article>
      <article className="tiny-sticker tiny-sticker--ascii" data-cursor="blue" aria-label="moving ascii dragon">
        <div className="ascii-dragon" aria-hidden="true">
          <span>~</span>
          <span>≋</span>
          <span>᚜</span>
          <span>᚛</span>
          <span>╲</span>
          <span>◉</span>
          <span>╱</span>
          <span>᚛</span>
          <span>᚜</span>
          <span>≋</span>
          <span>~</span>
        </div>
      </article>
    </section>
  );
}
