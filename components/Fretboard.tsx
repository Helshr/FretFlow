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

export interface FretPos {
  string: number; // 6..1
  fret: number; // 0..12，0=空弦
}

/**
 * 可复用指板图（0–12 品，6 弦在顶部）。
 * - positions：要标记的音名位置（accent 圆点 + label）
 * - active：正在播放的位置（更大 + 白环，跟随音频）
 */
export default function Fretboard({
  positions = [],
  active = null,
  label,
  className = 'mx-auto max-w-[640px]',
}: {
  positions?: FretPos[];
  active?: FretPos | null;
  label?: string;
  className?: string;
}) {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={label ? `${label} positions` : 'fretboard'} className={`h-auto w-full ${className}`}>
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

      {/* 品数 */}
      {Array.from({length: FRETS + 1}, (_, i) => (
        <text
          key={`f${i}`}
          x={X0 + i * FRET_W}
          y={FRET_LABEL_Y}
          textAnchor="middle"
          fontSize={12}
          fill="#6b7280"
        >
          {i}
        </text>
      ))}

      {/* 指板圆点（位于品格中间；12 品为双点） */}
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

      {/* 高亮位置 */}
      {positions.map((p, i) => {
        const cx = fretX(p.fret);
        const cy = stringY(p.string);
        const isActive =
          active && active.string === p.string && active.fret === p.fret;
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={isActive ? 14 : 10}
              fill="#e8a850"
              stroke={isActive ? '#fff' : 'none'}
              strokeWidth={isActive ? 2.5 : 0}
            />
            {label && (
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="#0a0a0a"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}