type MarqueeStripProps = {
  items: string[];
  invert?: boolean;
};

export function MarqueeStrip({ items, invert = false }: MarqueeStripProps) {
  const content = [...items, ...items].join(" ✦ ");

  return (
    <div className={`marquee-strip ${invert ? "marquee-strip--invert" : ""}`}>
      <div className="marquee-strip__track" aria-hidden="true">
        <span>{content}</span>
        <span>{content}</span>
      </div>
    </div>
  );
}
