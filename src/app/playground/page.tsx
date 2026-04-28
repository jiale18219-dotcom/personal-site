import Link from "next/link";
import { PlaygroundCanvas } from "@/components/playground-canvas";

export default function PlaygroundPage() {
  return (
    <div className="playground-page">
      <header className="playground-header">
        <Link href="/" className="playground-brand">
          yorick zhang
        </Link>
        <nav className="playground-nav">
          <Link href="/#work">work</Link>
          <Link href="/playground" className="is-active">
            playground
          </Link>
          <Link href="/about">about</Link>
        </nav>
      </header>
      <PlaygroundCanvas />
    </div>
  );
}
