import type {ChordDisplay} from '@/lib/chords/types';

// 坐标系统（与旧版 chordRenderer 一致）：viewBox 260x330
const X0 = 42;
const STRING_GAP = 36;
const Y0 = 48;
const FRET_GAP = 58;
const MARK_Y = 26;
const LAST_X = X0 + 5 * STRING_GAP;
const LAST_Y = Y0 + 4 * FRET_GAP;

// 把位规则：有空弦（fret 0）→ 开放和弦，画琴枕（pos 1）；否则 pos = 最小正品位
function position(frets: number[]): number {
  if (frets.some((f) => f === 0)) return 1;
  const pos = Math.min(...frets.filter((f) => f > 0));
  return Number.isFinite(pos) ? pos : 1;
}

function dotY(fret: number, pos: number): number {
  return Y0 + (fret - pos + 0.5) * FRET_GAP;
}

export default function ChordDiagram({
  name,
  frets,
  fingers,
  rootString,
  barre,
  className = 'w-full max-w-[300px]',
}: ChordDisplay & {className?: string}) {
  const rootIndex = rootString ? 6 - rootString : -1;
  const pos = position(frets);

  return (
    <svg
      viewBox="0 0 260 330"
      role="img"
      aria-label={name}
      className={`h-auto ${className}`}
    >
      {pos === 1 ? (
        <line
          x1={X0}
          y1={Y0}
          x2={LAST_X}
          y2={Y0}
          stroke="#d9b98a"
          strokeWidth={7}
          strokeLinecap="round"
        />
      ) : (
        <text
          x={X0 - 12}
          y={Y0 + FRET_GAP * 0.7}
          textAnchor="middle"
          fontSize={18}
          fill="#9aa0a8"
        >
          {pos}
        </text>
      )}

      {[0, 1, 2, 3, 4].map((j) => (
        <line
          key={`f${j}`}
          x1={X0}
          y1={Y0 + j * FRET_GAP}
          x2={LAST_X}
          y2={Y0 + j * FRET_GAP}
          stroke="#454a52"
          strokeWidth={1}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={`s${i}`}
          x1={X0 + i * STRING_GAP}
          y1={Y0}
          x2={X0 + i * STRING_GAP}
          y2={LAST_Y}
          stroke="#7f8793"
          strokeWidth={i === 0 ? 2.2 : 1.2}
        />
      ))}

      {barre && (
        <line
          x1={X0 + (6 - barre.to) * STRING_GAP}
          y1={dotY(pos, pos)}
          x2={X0 + (6 - barre.from) * STRING_GAP}
          y2={dotY(pos, pos)}
          stroke="#8f96a1"
          strokeWidth={9}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}

      {frets.map((f, i) => {
        const x = X0 + i * STRING_GAP;
        const g = 6 - i;
        if (f === -1) {
          return (
            <text
              key={i}
              x={x}
              y={MARK_Y + 6}
              textAnchor="middle"
              fontSize={16}
              fill="#6b7280"
            >
              ✕
            </text>
          );
        }
        if (f === 0) {
          return (
            <text
              key={i}
              x={x}
              y={MARK_Y + 6}
              textAnchor="middle"
              fontSize={16}
              fill="#9aa0a8"
            >
              ○
            </text>
          );
        }
        const y = dotY(f, pos);
        const onBarre = !!barre && f === pos && g >= barre.to && g <= barre.from;
        const isRoot = i === rootIndex;
        if (onBarre) {
          if (isRoot) {
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={16}
                fill="#2b2e35"
                stroke="#e8a850"
                strokeWidth={3}
              />
            );
          }
          return null;
        }
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={16}
              fill="#2b2e35"
              stroke={isRoot ? '#e8a850' : '#3a3e46'}
              strokeWidth={isRoot ? 3 : 1}
            />
            {fingers && fingers[i] > 0 && (
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize={14}
                fontWeight="bold"
                fill="#f5f5f5"
              >
                {fingers[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
