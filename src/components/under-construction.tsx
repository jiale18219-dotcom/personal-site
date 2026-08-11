"use client";

import { useEffect, useState } from "react";

export function FullCoverConstructionView({
  name,
}: {
  name: string;
}) {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("zh-CN", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fullcover-shell" data-cursor="badge" data-cursor-text="under construction">
      {/* Background ambient lighting */}
      <div className="fullcover-ambient">
        <div className="fullcover-ambient__glow fullcover-ambient__glow--1" />
        <div className="fullcover-ambient__glow fullcover-ambient__glow--2" />
        <div className="fullcover-ambient__grid" />
      </div>

      <div className="fullcover-container">
        {/* Header Branding */}
        <header className="fullcover-header">
          <div className="fullcover-brand">
            <span className="fullcover-brand__name">{name}</span>
            <span className="fullcover-brand__tag">Personal Space · 个人空间</span>
          </div>
          <div className="fullcover-clock">
            <span className="fullcover-clock__label">LOCAL TIME</span>
            <span className="fullcover-clock__val">{timeString || "00:00:00"}</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="fullcover-main">
          <div className="fullcover-badge">
            <span className="fullcover-badge__pulse" />
            <span className="fullcover-badge__text">
              2026.08 站点升级重构中 · UNDER MAJOR RECONSTRUCTION
            </span>
          </div>

          <h1 className="fullcover-title">
            站点正在改造中
            <span className="fullcover-title__sub">Crafting a new digital space.</span>
          </h1>

          <p className="fullcover-desc">
            当前个人网站正在全量进行架构升级、界面重构与底层整合，所有原有模块与内部跳转页面已暂停对外展示。全新的 2.0 体验正在精心筹备中，敬请期待。
          </p>

          <div className="fullcover-status-card">
            <div className="fullcover-status-item">
              <span className="fullcover-status-item__key">SYSTEM STATUS</span>
              <span className="fullcover-status-item__val fullcover-status-item__val--warning">
                ● REBUILDING 2.0
              </span>
            </div>
            <div className="fullcover-status-item">
              <span className="fullcover-status-item__key">NAVIGATION</span>
              <span className="fullcover-status-item__val">RESTRICTED</span>
            </div>
            <div className="fullcover-status-item">
              <span className="fullcover-status-item__key">RELEASE</span>
              <span className="fullcover-status-item__val">COMING SOON</span>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="fullcover-footer">
          <span className="fullcover-footer__copyright">
            © 2026 {name}. ALL RIGHTS RESERVED.
          </span>
          <span className="fullcover-footer__notice">
            SYSTEM MAINTENANCE & UPGRADE IN PROGRESS
          </span>
        </footer>
      </div>
    </div>
  );
}
