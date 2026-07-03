"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getBlogUrl } from "@/lib/blog-url";

type NavItem =
  | { id: string; label: string; href: string; kind: "section" }
  | { id: string; label: string; href: string; kind: "route" }
  | { id: string; label: string; href: string; kind: "external" };

const navItems: NavItem[] = [
  { id: "work", label: "work", href: "#work", kind: "section" },
  { id: "writing", label: "writing", href: getBlogUrl(), kind: "external" },
  { id: "playground", label: "playground", href: "/playground", kind: "route" },
  { id: "about", label: "about", href: "/about", kind: "route" },
];

export function SiteHeader() {
  const [activeSection, setActiveSection] = useState("work");
  const [menuOpen, setMenuOpen] = useState(false);

  const ids = useMemo(() => navItems.filter((item) => item.kind === "section").map((item) => item.id), []);

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
          {navItems.map((item) => {
            if (item.kind === "route") {
              return (
                <Link key={item.id} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              );
            }

            if (item.kind === "external") {
              return (
                <a key={item.id} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              );
            }

            return (
              <a
                key={item.id}
                href={item.href}
                className={activeSection === item.id ? "is-active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
