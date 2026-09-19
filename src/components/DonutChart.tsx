import { CATEGORY_MAP } from '../constants';
import type { CategoryId } from '../types';

export type DonutSlice = { id: CategoryId; amount: number };

const SIZE = 148;
const STROKE = 30;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const CENTER = SIZE / 2;

/** ラベルを描く下限。これ未満の区画はラベルを省略する(要件 6.1)。 */
const LABEL_MIN_RATIO = 0.05;

/**
 * カテゴリ別支出割合のドーナツグラフ。
 * 円弧は circle の stroke-dasharray で描くため、1 カテゴリが 100% でも破綻しない。
 */
export function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const visible = slices.filter((s) => s.amount > 0);

  if (total <= 0 || visible.length === 0) {
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="データなし">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="var(--ring-empty)"
          strokeWidth={STROKE}
        />
        <text
          x={CENTER}
          y={CENTER}
          textAnchor="middle"
          dominantBaseline="central"
          className="donut__empty-label"
        >
          データなし
        </text>
      </svg>
    );
  }

  let acc = 0;
  const arcs = visible.map((s) => {
    const ratio = s.amount / total;
    const start = acc;
    acc += ratio;
    return { ...s, ratio, start };
  });

  const label = arcs
    .map((a) => `${CATEGORY_MAP[a.id].label} ${((a.ratio * 100) | 0).toString()}パーセント`)
    .join('、');

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
        {arcs.map((a) => (
          <circle
            key={a.id}
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="none"
            stroke={CATEGORY_MAP[a.id].color}
            strokeWidth={STROKE}
            strokeDasharray={`${a.ratio * C} ${C}`}
            strokeDashoffset={-a.start * C}
          />
        ))}
      </g>
      {arcs
        .filter((a) => a.ratio >= LABEL_MIN_RATIO)
        .map((a) => {
          const angle = (a.start + a.ratio / 2) * 2 * Math.PI - Math.PI / 2;
          return (
            <text
              key={a.id}
              x={CENTER + R * Math.cos(angle)}
              y={CENTER + R * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="central"
              className="donut__slice-label"
            >
              {CATEGORY_MAP[a.id].label}
            </text>
          );
        })}
    </svg>
  );
}
