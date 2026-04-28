"use client";

import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

type Vec2 = {
  x: number;
  y: number;
};

type Player = Vec2 & {
  radius: number;
  health: number;
  invulnerableUntil: number;
};

type ObstacleKind = "meteor" | "shard" | "orb";

type Obstacle = Vec2 & {
  id: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
  kind: ObstacleKind;
  spin: number;
  spinSpeed: number;
};

type Projectile = Vec2 & {
  id: number;
  vx: number;
  vy: number;
  size: number;
  damage: number;
  ttl: number;
};

type LaserEffect = {
  activeUntil: number;
  x: number;
  y: number;
  angle: number;
  length: number;
};

type Burst = Vec2 & {
  id: number;
  ttl: number;
  kind: "hit" | "flash";
};

type CanvasSize = {
  width: number;
  height: number;
};

type SkillKey = "q" | "e" | "f";

type Cooldowns = Record<SkillKey, number>;

type RenderState = {
  player: Player;
  obstacles: Obstacle[];
  projectiles: Projectile[];
  laser: LaserEffect | null;
  bursts: Burst[];
  score: number;
  status: string;
  gameOver: boolean;
  cooldowns: Cooldowns;
  started: boolean;
  visible: boolean;
  now: number;
};

const PLAYER_SPEED = 330;
const PROJECTILE_SPEED = 760;
const Q_COOLDOWN = 260;
const E_COOLDOWN = 1850;
const F_COOLDOWN = 1250;
const FLASH_DISTANCE = 150;
const INITIAL_HEALTH = 5;
const PLAYER_RADIUS = 23;

const skillMeta: Array<{ key: SkillKey; label: string; icon: string; cooldown: number }> = [
  { key: "q", label: "normal", icon: "✦", cooldown: Q_COOLDOWN },
  { key: "e", label: "laser", icon: "▰", cooldown: E_COOLDOWN },
  { key: "f", label: "flash", icon: "↯", cooldown: F_COOLDOWN },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalize(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) {
    return { x: 1, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function distance(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegmentDistance(point: Vec2, start: Vec2, end: Vec2) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distance(point, start);
  }

  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
  return distance(point, {
    x: start.x + t * dx,
    y: start.y + t * dy,
  });
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true']"));
}

function getInitialPlayer(size: CanvasSize): Player {
  return {
    x: size.width * 0.5,
    y: size.height * 0.52,
    radius: PLAYER_RADIUS,
    health: INITIAL_HEALTH,
    invulnerableUntil: 0,
  };
}

function getObstacleGlyph(kind: ObstacleKind) {
  if (kind === "shard") {
    return "◆";
  }
  if (kind === "orb") {
    return "●";
  }
  return "✹";
}

function formatCooldown(milliseconds: number) {
  if (milliseconds <= 0) {
    return "ready";
  }

  return `${Math.ceil(milliseconds / 1000)}s`;
}

export function MeteorGame({ github, email }: { github: string; email: string }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef<CanvasSize>({ width: 960, height: 620 });
  const playerRef = useRef<Player>(getInitialPlayer(sizeRef.current));
  const obstaclesRef = useRef<Obstacle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const laserRef = useRef<LaserEffect | null>(null);
  const burstsRef = useRef<Burst[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastAimRef = useRef<Vec2>({ x: 1, y: 0 });
  const cooldownsRef = useRef<Cooldowns>({ q: 0, e: 0, f: 0 });
  const nextIdRef = useRef(1);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const spawnElapsedRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const gameVisibleRef = useRef(false);
  const gameStartedRef = useRef(false);

  const [renderState, setRenderState] = useState<RenderState>(() => ({
    player: playerRef.current,
    obstacles: [],
    projectiles: [],
    laser: null,
    bursts: [],
    score: 0,
    status: "press WASD to unlock",
    gameOver: false,
    cooldowns: { q: 0, e: 0, f: 0 },
    started: false,
    visible: false,
    now: 0,
  }));

  const publishState = useCallback((now: number, status?: string) => {
    setRenderState((current) => ({
      player: { ...playerRef.current },
      obstacles: obstaclesRef.current.map((obstacle) => ({ ...obstacle })),
      projectiles: projectilesRef.current.map((projectile) => ({ ...projectile })),
      laser: laserRef.current ? { ...laserRef.current } : null,
      bursts: burstsRef.current.map((burst) => ({ ...burst })),
      score: scoreRef.current,
      status: status ?? current.status,
      gameOver: gameOverRef.current,
      cooldowns: {
        q: Math.max(0, cooldownsRef.current.q - now),
        e: Math.max(0, cooldownsRef.current.e - now),
        f: Math.max(0, cooldownsRef.current.f - now),
      },
      started: gameStartedRef.current,
      visible: gameVisibleRef.current,
      now,
    }));
  }, []);

  const startGame = useCallback((message = "secret level unlocked") => {
    if (!gameVisibleRef.current && !gameStartedRef.current) {
      return false;
    }

    if (!gameStartedRef.current) {
      gameStartedRef.current = true;
      spawnElapsedRef.current = 0;
    }

    publishState(performance.now(), message);
    return true;
  }, [publishState]);

  const addBurst = useCallback((position: Vec2, kind: Burst["kind"]) => {
    burstsRef.current.push({
      id: nextIdRef.current,
      x: position.x,
      y: position.y,
      ttl: 0.42,
      kind,
    });
    nextIdRef.current += 1;
  }, []);

  const removeDestroyedObstacles = useCallback(() => {
    let destroyed = 0;
    obstaclesRef.current = obstaclesRef.current.filter((obstacle) => {
      const alive = obstacle.hp > 0;
      if (!alive) {
        destroyed += 1;
        addBurst(obstacle, "hit");
      }
      return alive;
    });

    if (destroyed > 0) {
      scoreRef.current += destroyed * 10;
    }
  }, [addBurst]);

  const getAimDirection = useCallback(() => {
    const player = playerRef.current;
    let nearest: Obstacle | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const obstacle of obstaclesRef.current) {
      const obstacleDistance = distance(player, obstacle);
      if (obstacleDistance < nearestDistance) {
        nearest = obstacle;
        nearestDistance = obstacleDistance;
      }
    }

    if (nearest !== null) {
      const direction = normalize({ x: nearest.x - player.x, y: nearest.y - player.y });
      lastAimRef.current = direction;
      return direction;
    }

    return lastAimRef.current;
  }, []);

  const fireNormalSkill = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    const now = performance.now();
    if (now < cooldownsRef.current.q || !startGame("Q normal orb fired")) {
      return;
    }

    const player = playerRef.current;
    const direction = getAimDirection();
    cooldownsRef.current.q = now + Q_COOLDOWN;
    projectilesRef.current.push({
      id: nextIdRef.current,
      x: player.x + direction.x * (player.radius + 18),
      y: player.y + direction.y * (player.radius + 18),
      vx: direction.x * PROJECTILE_SPEED,
      vy: direction.y * PROJECTILE_SPEED,
      size: 13,
      damage: 1,
      ttl: 0.88,
    });
    nextIdRef.current += 1;
    publishState(now, "Q normal orb fired");
  }, [getAimDirection, publishState, startGame]);

  const fireLaserSkill = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    const now = performance.now();
    if (now < cooldownsRef.current.e || !startGame("E laser sweep")) {
      return;
    }

    const player = playerRef.current;
    const size = sizeRef.current;
    const direction = getAimDirection();
    const length = Math.hypot(size.width, size.height);
    const end = {
      x: player.x + direction.x * length,
      y: player.y + direction.y * length,
    };

    cooldownsRef.current.e = now + E_COOLDOWN;
    laserRef.current = {
      activeUntil: now + 210,
      x: player.x,
      y: player.y,
      angle: Math.atan2(direction.y, direction.x),
      length,
    };

    for (const obstacle of obstaclesRef.current) {
      const hit = pointToSegmentDistance(obstacle, player, end) <= obstacle.size * 0.5 + 22;
      if (hit) {
        obstacle.hp -= 2;
      }
    }

    removeDestroyedObstacles();
    publishState(now, "E laser sweep");
  }, [getAimDirection, publishState, removeDestroyedObstacles, startGame]);

  const flash = useCallback(() => {
    if (gameOverRef.current) {
      return;
    }

    const now = performance.now();
    if (now < cooldownsRef.current.f || !startGame("F flash dash")) {
      return;
    }

    const size = sizeRef.current;
    const player = playerRef.current;
    const direction = lastAimRef.current;

    addBurst(player, "flash");
    cooldownsRef.current.f = now + F_COOLDOWN;
    player.x = clamp(player.x + direction.x * FLASH_DISTANCE, player.radius, size.width - player.radius);
    player.y = clamp(player.y + direction.y * FLASH_DISTANCE, player.radius, size.height - player.radius);
    player.invulnerableUntil = now + 460;
    addBurst(player, "flash");
    publishState(now, "F flash dash");
  }, [addBurst, publishState, startGame]);

  const resetGame = useCallback(() => {
    const size = sizeRef.current;
    playerRef.current = getInitialPlayer(size);
    obstaclesRef.current = [];
    projectilesRef.current = [];
    laserRef.current = null;
    burstsRef.current = [];
    keysRef.current.clear();
    lastAimRef.current = { x: 1, y: 0 };
    cooldownsRef.current = { q: 0, e: 0, f: 0 };
    nextIdRef.current = 1;
    scoreRef.current = 0;
    spawnElapsedRef.current = 0;
    gameVisibleRef.current = true;
    gameStartedRef.current = true;
    gameOverRef.current = false;
    publishState(performance.now(), "secret level unlocked");
    stageRef.current?.focus({ preventScroll: true });
  }, [publishState]);

  const spawnObstacle = useCallback(() => {
    const size = sizeRef.current;
    const player = playerRef.current;
    const edge = Math.floor(Math.random() * 4);
    const obstacleSize = 28 + Math.random() * 28;
    const kindRoll = Math.random();
    const kind: ObstacleKind = kindRoll > 0.72 ? "orb" : kindRoll > 0.38 ? "shard" : "meteor";
    let x = 0;
    let y = 0;

    if (edge === 0) {
      x = Math.random() * size.width;
      y = -obstacleSize;
    } else if (edge === 1) {
      x = size.width + obstacleSize;
      y = Math.random() * size.height;
    } else if (edge === 2) {
      x = Math.random() * size.width;
      y = size.height + obstacleSize;
    } else {
      x = -obstacleSize;
      y = Math.random() * size.height;
    }

    const drift = (Math.random() - 0.5) * 0.64;
    const directAngle = Math.atan2(player.y - y, player.x - x) + drift;
    const speed = (reducedMotionRef.current ? 72 : 118) + Math.random() * (reducedMotionRef.current ? 52 : 104);

    obstaclesRef.current.push({
      id: nextIdRef.current,
      x,
      y,
      vx: Math.cos(directAngle) * speed,
      vy: Math.sin(directAngle) * speed,
      size: obstacleSize,
      hp: obstacleSize > 46 ? 2 : 1,
      kind,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 2.8,
    });
    nextIdRef.current += 1;
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(420, rect.height);
      sizeRef.current = { width, height };

      const player = playerRef.current;
      player.x = clamp(player.x, player.radius, width - player.radius);
      player.y = clamp(player.y, player.radius, height - player.radius);
      publishState(performance.now());
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, [publishState]);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.58;
        gameVisibleRef.current = isVisible;

        if (isVisible) {
          stage.focus({ preventScroll: true });
        } else {
          keysRef.current.clear();
        }

        publishState(performance.now(), isVisible ? "press WASD to unlock" : "offline egg hidden");
      },
      { threshold: [0, 0.58] },
    );

    observer.observe(stage);

    return () => observer.disconnect();
  }, [publishState, startGame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!(["w", "a", "s", "d", "q", "e", "f"].includes(key)) || isTypingTarget(event.target)) {
        return;
      }

      if (!gameVisibleRef.current) {
        return;
      }

      event.preventDefault();

      if (["w", "a", "s", "d"].includes(key)) {
        if (!startGame("WASD moving")) {
          return;
        }

        keysRef.current.add(key);
        publishState(performance.now(), "WASD moving");
        return;
      }

      if (!gameStartedRef.current) {
        return;
      }

      if (event.repeat) {
        return;
      }

      if (key === "q") {
        fireNormalSkill();
      } else if (key === "e") {
        fireLaserSkill();
      } else if (key === "f") {
        flash();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    const clearKeys = () => keysRef.current.clear();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", clearKeys);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", clearKeys);
    };
  }, [fireLaserSkill, fireNormalSkill, flash, publishState, startGame]);

  useEffect(() => {
    let frame = 0;
    let lastTime = performance.now();
    let lastPublish = 0;

    const endGame = (now: number) => {
      gameOverRef.current = true;
      keysRef.current.clear();
      publishState(now, "game over — restart to try again");
    };

    const update = (delta: number, now: number) => {
      const size = sizeRef.current;
      const player = playerRef.current;

      if (!gameOverRef.current && gameStartedRef.current && gameVisibleRef.current) {
        const move = {
          x: (keysRef.current.has("d") ? 1 : 0) - (keysRef.current.has("a") ? 1 : 0),
          y: (keysRef.current.has("s") ? 1 : 0) - (keysRef.current.has("w") ? 1 : 0),
        };

        if (move.x !== 0 || move.y !== 0) {
          const direction = normalize(move);
          lastAimRef.current = direction;
          player.x = clamp(player.x + direction.x * PLAYER_SPEED * delta, player.radius, size.width - player.radius);
          player.y = clamp(player.y + direction.y * PLAYER_SPEED * delta, player.radius, size.height - player.radius);
        }

        const spawnInterval = Math.max(reducedMotionRef.current ? 680 : 300, 720 - scoreRef.current * 2.4);
        spawnElapsedRef.current += delta * 1000;
        if (spawnElapsedRef.current >= spawnInterval) {
          spawnElapsedRef.current = 0;
          spawnObstacle();
        }

        for (const obstacle of obstaclesRef.current) {
          obstacle.x += obstacle.vx * delta;
          obstacle.y += obstacle.vy * delta;
          obstacle.spin += obstacle.spinSpeed * delta;
        }

        obstaclesRef.current = obstaclesRef.current.filter(
          (obstacle) =>
            obstacle.x > -120 &&
            obstacle.x < size.width + 120 &&
            obstacle.y > -120 &&
            obstacle.y < size.height + 120,
        );

        for (const projectile of projectilesRef.current) {
          projectile.x += projectile.vx * delta;
          projectile.y += projectile.vy * delta;
          projectile.ttl -= delta;
        }

        const liveProjectiles: Projectile[] = [];
        for (const projectile of projectilesRef.current) {
          if (
            projectile.ttl <= 0 ||
            projectile.x < -40 ||
            projectile.x > size.width + 40 ||
            projectile.y < -40 ||
            projectile.y > size.height + 40
          ) {
            continue;
          }

          let hit = false;
          for (const obstacle of obstaclesRef.current) {
            if (!hit && distance(projectile, obstacle) <= projectile.size * 0.5 + obstacle.size * 0.5) {
              obstacle.hp -= projectile.damage;
              hit = true;
            }
          }

          if (!hit) {
            liveProjectiles.push(projectile);
          }
        }
        projectilesRef.current = liveProjectiles;
        removeDestroyedObstacles();

        if (now >= player.invulnerableUntil) {
          const collidingObstacle = obstaclesRef.current.find(
            (obstacle) => distance(player, obstacle) <= player.radius + obstacle.size * 0.45,
          );

          if (collidingObstacle) {
            obstaclesRef.current = obstaclesRef.current.filter((obstacle) => obstacle.id !== collidingObstacle.id);
            player.health -= 1;
            player.invulnerableUntil = now + 820;
            addBurst(player, "hit");

            if (player.health <= 0) {
              endGame(now);
            } else {
              publishState(now, "hit — keep dodging");
            }
          }
        }
      }

      if (laserRef.current && now >= laserRef.current.activeUntil) {
        laserRef.current = null;
      }

      for (const burst of burstsRef.current) {
        burst.ttl -= delta;
      }
      burstsRef.current = burstsRef.current.filter((burst) => burst.ttl > 0);
    };

    const loop = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;
      update(delta, time);

      if (time - lastPublish > 32) {
        publishState(time);
        lastPublish = time;
      }

      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(frame);
  }, [addBurst, publishState, removeDestroyedObstacles, spawnObstacle]);

  const pressMove = (key: string) => {
    if (!startGame("WASD moving")) {
      return;
    }

    keysRef.current.add(key);
    stageRef.current?.focus({ preventScroll: true });
  };

  const releaseMove = (key: string) => {
    keysRef.current.delete(key);
  };

  const useSkill = (skill: SkillKey) => {
    stageRef.current?.focus({ preventScroll: true });
    if (!gameStartedRef.current && !startGame("secret level unlocked")) {
      return;
    }

    if (skill === "q") {
      fireNormalSkill();
    } else if (skill === "e") {
      fireLaserSkill();
    } else {
      flash();
    }
  };

  const playerStyle = {
    transform: `translate3d(${renderState.player.x - renderState.player.radius}px, ${renderState.player.y - renderState.player.radius}px, 0)`,
    width: `${renderState.player.radius * 2}px`,
    height: `${renderState.player.radius * 2}px`,
  } as CSSProperties;

  return (
    <div className="meteor-game" data-cursor="blue">
      <div className="meteor-game__gate" aria-hidden="true">
        <span>scroll again</span>
        <span>secret level loads</span>
      </div>

      <div className="meteor-game__topbar">
        <div className="meteor-game__copy">
          <p className="meteor-game__kicker">connection lost</p>
          <h2>secret level</h2>
          <p>No more pages to load. Press WASD to wake the orb, then dodge the incoming glitches.</p>
        </div>

        <div className="meteor-game__readout" aria-live="polite">
          <span>score {renderState.score}</span>
          <span>hp {renderState.player.health}/{INITIAL_HEALTH}</span>
          <span>{renderState.status}</span>
          <button type="button" onClick={resetGame} data-cursor="badge" data-cursor-text="restart">
            restart
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="meteor-game__stage"
        tabIndex={0}
        data-cursor="blue"
        aria-label="Orb field mini game. Use W A S D to move, Q for normal skill, E for laser skill, and F to flash."
      >
        <div className="meteor-game__grid" />

        {renderState.laser && (
          <div
            className="meteor-game__laser"
            style={
              {
                left: `${renderState.laser.x}px`,
                top: `${renderState.laser.y}px`,
                width: `${renderState.laser.length}px`,
                transform: `rotate(${renderState.laser.angle}rad)`,
              } as CSSProperties
            }
          />
        )}

        {renderState.projectiles.map((projectile) => (
          <span
            key={projectile.id}
            className="meteor-game__projectile"
            style={
              {
                width: `${projectile.size}px`,
                height: `${projectile.size}px`,
                transform: `translate3d(${projectile.x - projectile.size * 0.5}px, ${projectile.y - projectile.size * 0.5}px, 0)`,
              } as CSSProperties
            }
          />
        ))}

        {renderState.obstacles.map((obstacle) => (
          <span
            key={obstacle.id}
            className={`meteor-game__obstacle meteor-game__obstacle--${obstacle.kind}`}
            style={
              {
                width: `${obstacle.size}px`,
                height: `${obstacle.size}px`,
                transform: `translate3d(${obstacle.x - obstacle.size * 0.5}px, ${obstacle.y - obstacle.size * 0.5}px, 0) rotate(${obstacle.spin}rad)`,
              } as CSSProperties
            }
          >
            {getObstacleGlyph(obstacle.kind)}
          </span>
        ))}

        {renderState.bursts.map((burst) => (
          <span
            key={burst.id}
            className={`meteor-game__burst meteor-game__burst--${burst.kind}`}
            style={
              {
                transform: `translate3d(${burst.x - 34}px, ${burst.y - 34}px, 0)`,
              } as CSSProperties
            }
          />
        ))}

        <div
          className="meteor-game__player"
          data-hit={renderState.now < renderState.player.invulnerableUntil ? "true" : "false"}
          style={playerStyle}
        >
          <span className="meteor-game__player-core" />
        </div>

        {!renderState.started && (
          <div className="meteor-game__start-card">
            <span className="meteor-game__offline-icon" aria-hidden="true">!</span>
            <p>page ended — secret game ready</p>
            <small>WASD move · Q orb · E laser · F flash</small>
          </div>
        )}

        {renderState.gameOver && (
          <div className="meteor-game__overlay">
            <p>game over</p>
            <button type="button" onClick={resetGame} data-cursor="badge" data-cursor-text="restart">
              try again
            </button>
          </div>
        )}
      </div>

      <div className="meteor-game__egg-label" aria-hidden="true">ERR_SITE_END · hidden arcade · press WASD</div>

      <div className="meteor-game__skillbar" aria-label="Game controls and skills">
        <div className="meteor-game__move-hint">
          <span>W</span>
          <span>A</span>
          <span>S</span>
          <span>D</span>
          <small>move</small>
        </div>

        {skillMeta.map((skill) => {
          const cooldown = renderState.cooldowns[skill.key];
          const progress = clamp(cooldown / skill.cooldown, 0, 1);

          return (
            <button
              key={skill.key}
              type="button"
              className="meteor-game__skill"
              data-ready={cooldown <= 0 ? "true" : "false"}
              onClick={() => useSkill(skill.key)}
            >
              <span className="meteor-game__skill-icon">{skill.icon}</span>
              <span className="meteor-game__skill-key">{skill.key.toUpperCase()}</span>
              <span className="meteor-game__skill-label">{skill.label}</span>
              <span className="meteor-game__skill-cooldown">{formatCooldown(cooldown)}</span>
              <i style={{ transform: `scaleX(${progress})` }} />
            </button>
          );
        })}
      </div>

      <div className="meteor-game__mobile-controls" aria-label="Touch game controls">
        <div className="meteor-game__dpad">
          <button type="button" onPointerDown={() => pressMove("w")} onPointerUp={() => releaseMove("w")} onPointerCancel={() => releaseMove("w")} onPointerLeave={() => releaseMove("w")}>W</button>
          <button type="button" onPointerDown={() => pressMove("a")} onPointerUp={() => releaseMove("a")} onPointerCancel={() => releaseMove("a")} onPointerLeave={() => releaseMove("a")}>A</button>
          <button type="button" onPointerDown={() => pressMove("s")} onPointerUp={() => releaseMove("s")} onPointerCancel={() => releaseMove("s")} onPointerLeave={() => releaseMove("s")}>S</button>
          <button type="button" onPointerDown={() => pressMove("d")} onPointerUp={() => releaseMove("d")} onPointerCancel={() => releaseMove("d")} onPointerLeave={() => releaseMove("d")}>D</button>
        </div>
        <div className="meteor-game__skills-touch">
          <button type="button" onClick={() => useSkill("q")}>Q</button>
          <button type="button" onClick={() => useSkill("e")}>E</button>
          <button type="button" onClick={() => useSkill("f")}>F</button>
        </div>
      </div>

      <div className="meteor-game__contact" id="contact" aria-label="Final page contact and navigation links">
        <div className="meteor-game__contact-group">
          <p className="meteor-game__contact-title">contact me</p>
          <a href="https://t.me/" target="_blank" rel="noreferrer" data-cursor="blue">
            Telegram account
          </a>
          <a href={github} target="_blank" rel="noreferrer" data-cursor="mint">
            GitHub projects
          </a>
          <a href={`mailto:${email}`} data-cursor="peach">
            Email / contact me
          </a>
        </div>

        <div className="meteor-game__contact-group">
          <p className="meteor-game__contact-title">page</p>
          <a href="#intro" data-cursor="pink">Home</a>
          <Link href="/playground" data-cursor="yellow">Playground</Link>
          <a href="#work" data-cursor="mint">Work</a>
        </div>
      </div>
    </div>
  );
}
