'use client';

import {useRef} from 'react';
import {
  DOUBLE_INLAY_FRETS,
  FRET_LABEL_Y,
  FRETS,
  FRET_W,
  INLAY_Y,
  LAST_X,
  SINGLE_INLAY_FRETS,
  STRING_LABEL_X,
  TOP,
  VIEW_H,
  VIEW_W,
  X0,
  fretX,
  stringY,
} from '@/lib/fretboard';

export interface MarkedPos {
  string: number; // 6..1
  fret: number; // 0..12
  label: string; // 该位置音名
}

/**
 * 可点击指板（0–12 品，6 弦在顶部）：用于找音游戏。
 * - found：已正确找到的位置（绿色实心 + 音名）
 * - wrong：点错的位置（红色 + 音名，1s 后由调用方清除）
 * - revealed：hint 露出的位置（琥珀虚线环）
 * 点击坐标 → 最近的弦×品格（空弦=琴枕左侧小区间）。
 */
export default function FindBoard({
  found,
  wrong,
  revealed,
  onPositionClick,
}: {
  found: MarkedPos[];
  wrong: MarkedPos[];
  revealed: {string: number; fret: number}[];
  onPositionClick: (s: number, f: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    const s = Math.max(1, Math.min(6, 6 - Math.round((y - TOP) / 22)));
    const f = Math.max(0, Math.min(12, Math.round((x - X0) / FRET_W + 0.5)));
    onPositionClick(s, f);
  }

  const key = (s: number, f: number) => `${s}-${f}`;
  const foundKeys = new Set(found.map((p) => key(p.string, p.fret)));
  const wrongOverlay = new Map(wrong.map((p) => [key(p.string, p.fret), p]));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="clickable fretboard"
      className="h-auto w-full cursor-pointer"
      onClick={handleClick}
    >
      {/* 弦号标签 */}
      {[6, 5, 4, 3, 2, 1].map((s) => (
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

      {/* 品数（1–12） */}
      {Array.from({length: FRETS}, (_, i) => (
        <text
          key={`f${i + 1}`}
          x={X0 + (i + 1) * FRET_W}
          y={FRET_LABEL_Y}
          textAnchor="middle"
          fontSize={12}
          fill="#6b7280"
        >
          {i + 1}
        </text>
      ))}

      {/* 指板圆点 */}
      {SINGLE_INLAY_FRETS.map((f) => (
        <circle key={`in${f}`} cx={fretX(f)} cy={INLAY_Y} r={5} fill="#3a3e46" />
      ))}
      {DOUBLE_INLAY_FRETS.map((f) => (
        <g key={`in${f}`}>
          <circle cx={fretX(f)} cy={INLAY_Y - 18} r={5} fill="#3a3e46" />
          <circle cx={fretX(f)} cy={INLAY_Y + 18} r={5} fill="#3a3e46" />
        </g>
      ))}

      {/* 琴枕 */}
      <line
        x1={X0}
        y1={TOP - 12}
        x2={X0}
        y2={stringY(1) + 12}
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
          y2={stringY(1) + 12}
          stroke={i === 0 ? '#5a6068' : '#454a52'}
          strokeWidth={1}
        />
      ))}

      {/* 弦 */}
      {[6, 5, 4, 3, 2, 1].map((s) => (
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

      {/* hint 露出的位置：琥珀虚线环 */}
      {revealed.map((p, i) => {
        if (foundKeys.has(key(p.string, p.fret))) return null;
        return (
          <circle
            key={`r${i}`}
            cx={fretX(p.fret)}
            cy={stringY(p.string)}
            r={13}
            fill="none"
            stroke="#e8a850"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        );
      })}

      {/* 点错的位置：红色 + 实际音名 */}
      {wrongOverlay.size > 0 &&
        [...wrongOverlay.entries()].filter(([k]) => !foundKeys.has(k)).map(([k, p]) => (
          <g key={k}>
            <circle
              cx={fretX(p.fret)}
              cy={stringY(p.string)}
              r={10}
              fill="#ef6461"
            />
            <text
              x={fretX(p.fret)}
              y={stringY(p.string) + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#0a0a0a"
            >
              {p.label}
            </text>
          </g>
        ))}

      {/* 已找到的位置：绿色实心 + 音名 */}
      {found.map((p, i) => (
        <g key={i}>
          <circle
            cx={fretX(p.fret)}
            cy={stringY(p.string)}
            r={10}
            fill="#2ecc71"
            stroke="#fff"
            strokeWidth={1}
          />
          <text
            x={fretX(p.fret)}
            y={stringY(p.string) + 4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            fill="#0a0a0a"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}