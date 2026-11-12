'use client';

import type {ScaleEntry} from '@/lib/scales/aug';
import {
  DOUBLE_INLAYS,
  FRET_LABEL_Y,
  FRETS,
  FRET_W,
  INLAY_FILL,
  INLAY_Y,
  LAST_X,
  SINGLE_INLAYS,
  STRING_LABEL_X,
  TOP,
  VIEW_H,
  VIEW_W,
  X0,
  fretX,
  stringY,
} from '@/lib/scales/board';

// 音级彩虹配色（1 = 根音琥珀）：1..7 大调音级
export const DEGREE_COLORS: Record<number, string> = {
  1: '#e8a850',
  2: '#ef4444',
  3: '#f97316',
  4: '#eab308',
  5: '#22c55e',
  6: '#14b8a6',
  7: '#6366f1',
};

/**
 * 指形指板图（0–21 品，1 弦在顶部）：只画当前指形覆盖到的音。
 * - notes：指形的全部位置（弦/品/音级/手指）
 * - labels：与 notes 对齐的音名
 * - reachKey：伸展音的 弦-品 位置（虚线环）
 * - labelMode：圆点内显示音级还是音名
 * - showFinger：圆点下方显示手指编号（默认关）
 */
export default function ScaleFretboard({
  notes,
  labels,
  reachKey,
  labelMode,
  showFinger,
}: {
  notes: ScaleEntry[];
  labels: string[];
  reachKey: string | null;
  labelMode: 'degree' | 'note';
  showFinger: boolean;
}) {
  const keyOf = (s: number, f: number) => `${s}-${f}`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="major scale finger pattern"
      className="h-auto w-full"
    >
      {/* 弦号标签（1 在顶部） */}
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <text
          key={`l${s}`}
          x={STRING_LABEL_X}
          y={stringY(s) + 4}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
        >
          {s}
        </text>
      ))}

      {/* 品数（1–21；0 即琴枕/空弦，不标） */}
      {Array.from({length: FRETS}, (_, i) => (
        <text
          key={`f${i + 1}`}
          x={X0 + (i + 1) * FRET_W}
          y={FRET_LABEL_Y}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
        >
          {i + 1}
        </text>
      ))}

      {/* 品记（指板圆点） */}
      {SINGLE_INLAYS.map((f) => (
        <circle key={`in${f}`} cx={fretX(f)} cy={INLAY_Y} r={5} fill={INLAY_FILL} />
      ))}
      {DOUBLE_INLAYS.map((f) => (
        <g key={`in${f}`}>
          <circle cx={fretX(f)} cy={INLAY_Y - 18} r={5} fill={INLAY_FILL} />
          <circle cx={fretX(f)} cy={INLAY_Y + 18} r={5} fill={INLAY_FILL} />
        </g>
      ))}

      {/* 琴枕 */}
      <line
        x1={X0}
        y1={TOP - 12}
        x2={X0}
        y2={stringY(6) + 12}
        stroke="#d9b98a"
        strokeWidth={6}
        strokeLinecap="round"
      />

      {/* 品线 */}
      {Array.from({length: FRETS + 1}, (_, i) => (
        <line
          key={`p${i}`}
          x1={X0 + i * FRET_W}
          y1={TOP - 12}
          x2={X0 + i * FRET_W}
          y2={stringY(6) + 12}
          stroke={i === 0 ? '#5a6068' : '#454a52'}
          strokeWidth={1}
        />
      ))}

      {/* 弦 */}
      {[1, 2, 3, 4, 5, 6].map((s) => (
        <line
          key={`s${s}`}
          x1={X0}
          y1={stringY(s)}
          x2={LAST_X}
          y2={stringY(s)}
          stroke="#7f8793"
          strokeWidth={s === 6 ? 1.8 : 1.2}
        />
      ))}

      {/* 指形音符 */}
      {notes.map((n, i) => {
        const cx = fretX(n.fret);
        const cy = stringY(n.string);
        const key = keyOf(n.string, n.fret);
        const isReach = reachKey !== null && key === reachKey;
        const showFingerHere = showFinger && n.fret > 0;
        return (
          <g key={i}>
            {/* 伸展音：虚线高亮环 */}
            {isReach && (
              <circle
                cx={cx}
                cy={cy}
                r={17}
                fill="none"
                stroke="#e8a850"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.95}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={12}
              fill={DEGREE_COLORS[n.degree] ?? '#e8a850'}
              stroke="#fff"
              strokeWidth={1.2}
            />
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="#0a0a0a"
            >
              {labelMode === 'degree' ? n.degree : labels[i]}
            </text>
            {showFingerHere && (
              <text
                x={cx}
                y={cy + 20}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {n.finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}