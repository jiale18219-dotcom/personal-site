"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const navItems = [
  { id: "work", label: "work", href: "#work", route: false },
  { id: "writing", label: "writing", href: "/writing", route: true },
  { id: "playground", label: "playground", href: "/playground", route: true },
  { id: "about", label: "about", href: "/about", route: true },
];

export function SiteHeader() {
  const [activeSection, setActiveSection] = useState("work");
  const [menuOpen, setMenuOpen] = useState(false);

  const ids = useMemo(() => navItems.filter((item) => !item.route).map((item) => item.id), []);

  useEffect(() => {
    const observers = ids
      .map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(id);
              }
            });
          },
          { rootMargin: "-30% 0px -55% 0px", threshold: 0.1 },
        );

        observer.observe(element);
        return observer;
      })
      .filter(Boolean) as IntersectionObserver[];

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [ids]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="site-brand">
          <span className="site-brand__name">张佳乐 / yorick zhang</span>
          <span className="site-brand__sub">personal portfolio</span>
        </Link>
        <button
          className="site-menu-button"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`}>
          {navItems.map((item) => (
            item.route ? (
              <Link key={item.id} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={item.href}
                className={activeSection === item.id ? "is-active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          ))}
        </nav>
      </div>
    </header>
  );
}
