import { useEffect, useMemo, useState } from 'react';

/**
 * 牛乳瓶の中にコーヒー豆が溜まっていく表現(要件 8.2 / 8.3)。
 *
 * 豆の高さ = 瓶の内側の高さ × 達成率。豆の塊を瓶の内側でクリップし、
 * 下方向にずらしておいた分を戻すことで「溜まっていく」動きにする。
 */

const VB_W = 200;
const VB_H = 264;

/** 瓶の内側の上端・下端(ユーザー座標)。 */
const INNER_TOP = 34;
const INNER_BOTTOM = 246;
const INNER_H = INNER_BOTTOM - INNER_TOP;

const FILL_DURATION_MS = 1400;
const FALL_DURATION_MS = 850;

/** 瓶の外形。 */
const BOTTLE_PATH =
  'M72 28 L72 56 C72 68 34 76 32 102 L32 232 A14 14 0 0 0 46 246 L154 246 A14 14 0 0 0 168 232 L168 102 C166 76 128 68 128 56 L128 28 Z';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 瓶いっぱいに敷き詰めた豆。位置は index から決めるので再描画でも動かない。 */
function useBeanField() {
  return useMemo(() => {
    const beans: { x: number; y: number; rotate: number }[] = [];
    const rows = Math.ceil(INNER_H / 17) + 1;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        beans.push({
          x: 26 + c * 25 + (r % 2 === 0 ? 0 : 12.5),
          y: INNER_TOP + 8 + r * 17,
          rotate: ((r * 37 + c * 61) % 70) - 35,
        });
      }
    }
    return beans;
  }, []);
}

function Bean({ x, y, rotate, scale = 1 }: { x: number; y: number; rotate: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <ellipse rx="9.6" ry="6.8" fill="var(--bean)" />
      <path
        d="M-7.4 0.2 C-4.6 -3.2 -2 -3.2 0 0 C2 3.2 4.6 3.2 7.4 -0.2"
        fill="none"
        stroke="var(--bean-dark)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

export function MilkBottle({ ratio, playKey }: { ratio: number; playKey: number }) {
  const reduced = prefersReducedMotion();
  const [level, setLevel] = useState(reduced ? ratio : 0);
  const beans = useBeanField();

  useEffect(() => {
    if (reduced) {
      setLevel(ratio);
      return;
    }
    // いったん空にしてから、次のフレームで目標値へ動かしてアニメーションを再生する。
    setLevel(0);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setLevel(ratio));
    });
    return () => cancelAnimationFrame(id);
  }, [ratio, playKey, reduced]);

  const surfaceY = INNER_BOTTOM - INNER_H * ratio;
  const clipId = 'bottle-inner-clip';

  return (
    <svg
      className="bottle"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`貯金の達成率 ${Math.round(ratio * 100)} パーセント`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BOTTLE_PATH} />
        </clipPath>
      </defs>

      {/* 瓶の中身(ガラスの内側) */}
      <path d={BOTTLE_PATH} fill="var(--glass)" />

      <g clipPath={`url(#${clipId})`}>
        {/* 溜まった豆。(1 - level) ぶん下にずらしておき、level に応じて上がってくる。 */}
        <g
          className="bean-level"
          style={{
            transform: `translateY(${(1 - level) * INNER_H}px)`,
            ['--fill-dur' as string]: `${FILL_DURATION_MS}ms`,
          }}
        >
          {beans.map((b, i) => (
            <Bean key={i} x={b.x} y={b.y} rotate={b.rotate} />
          ))}
        </g>

        {/* 上から降ってくる豆 */}
        {!reduced &&
          ratio > 0 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <g
              key={`${playKey}-${i}`}
              className="bean-fall"
              style={{
                ['--fall-delay' as string]: `${i * 110}ms`,
                ['--fall-dur' as string]: `${FALL_DURATION_MS}ms`,
                ['--fall-to' as string]: `${Math.max(12, surfaceY - INNER_TOP - 6)}px`,
              }}
            >
              <Bean
                x={84 + ((i * 29) % 34)}
                y={INNER_TOP + 2}
                rotate={(i * 47) % 70 - 35}
                scale={0.86}
              />
            </g>
          ))}
      </g>

      {/* ガラスの輪郭とハイライト */}
      <path
        d={BOTTLE_PATH}
        fill="none"
        stroke="var(--glass-line)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="66" y="12" width="68" height="20" rx="7" fill="var(--glass)" />
      <rect
        x="66"
        y="12"
        width="68"
        height="20"
        rx="7"
        fill="none"
        stroke="var(--glass-line)"
        strokeWidth="3"
      />
      <path
        d="M48 116 L48 226"
        stroke="var(--surface)"
        strokeOpacity="0.5"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}
