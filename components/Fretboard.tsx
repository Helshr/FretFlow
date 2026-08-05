export interface FretPos {
  string: number; // 6..1
  fret: number; // 0..12，0=空弦
}

const X0 = 40; // 琴枕 x
const FRET_W = 52; // 每品宽
const TOP = 44; // 6 弦 y
const SGAP = 22; // 弦间距
const FRETS = 12;
const LAST_X = X0 + FRETS * FRET_W;
const INLAY_FRETS = [3, 5, 7, 9, 12];

function stringY(s: number): number {
  return TOP + (6 - s) * SGAP;
}

// 有品的音位于品格中间（第 f 品 = f-1 与 f 两条品线之间的中点）；空弦（0 品）在琴枕处
function fretX(fret: number): number {
  return fret === 0 ? X0 : X0 + (fret - 0.5) * FRET_W;
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
  const midY = (TOP + stringY(1)) / 2;

  return (
    <svg viewBox="0 0 760 205" role="img" aria-label={label ? `${label} positions` : 'fretboard'} className={`h-auto w-full ${className}`}>
      {/* 弦号标签 */}
      {[6, 5, 4, 3, 2, 1].map((s) => (
        <text
          key={`l${s}`}
          x={X0 - 14}
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
          y={192}
          textAnchor="middle"
          fontSize={12}
          fill="#6b7280"
        >
          {i}
        </text>
      ))}

      {/* 指板圆点（位于品格中间） */}
      {INLAY_FRETS.map((f) => (
        <circle key={`in${f}`} cx={X0 + (f - 0.5) * FRET_W} cy={midY} r={5} fill="#3a3e46" />
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
              fill="#e94560"
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
                fill="#fff"
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
