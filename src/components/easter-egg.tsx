"use client";

import { useState } from "react";

const hiddenNotes = [
  "隐藏便签：作品不是简历的附件，作品本身才是表达。",
  "隐藏便签：如果一个页面能让人多停留 15 秒，它就已经赢过很多模板站。",
  "隐藏便签：继续做点有意思的东西，然后把它们留在这里。",
];

export function EasterEgg() {
  const [index, setIndex] = useState(0);

  return (
    <div className="tiny-note">
      <div>
        <p className="tiny-note__label">Small corner</p>
        <h3>低调彩蛋入口</h3>
        <p className="tiny-note__text">
          我没有把完整彩蛋塞进主路径里，只留下一小块能动的角落。以后这里可以放小游戏、实验按钮，或者一句突然冒出来的话。
        </p>
      </div>
      <button
        className="tiny-note__button"
        type="button"
        onClick={() => setIndex((value) => (value + 1) % hiddenNotes.length)}
      >
        下一句
      </button>
      <p className="tiny-note__text tiny-note__text--hint">{hiddenNotes[index]}</p>
    </div>
  );
}
