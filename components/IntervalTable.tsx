import {C_MAJOR_NOTES, intervalById} from '@/lib/intervals/cmajor';
import {INTERVAL_TABLE} from '@/lib/intervals/table';

/**
 * C 大调音程对照表（7×7，像乘法表）：行=起点，列=终点，格子=上行音程。
 * 每格 = 缩写 + 本地化全名（如 M2 / 大二度）。用原生 <details> 折叠，默认收起。
 */
export default function IntervalTable({
  label,
  names,
}: {
  label: string;
  names: Record<string, string>; // id → 本地化音程名（含 P1）
}) {
  return (
    <details className="group mb-6">
      <summary className="cursor-pointer select-none text-center text-sm font-semibold text-muted transition hover:text-text">
        {label}
        <span className="ml-1 text-[#3a3e46] transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="mx-auto border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="h-8 w-8" />
              {C_MAJOR_NOTES.map((n) => (
                <th
                  key={n}
                  className="h-8 w-9 text-center text-xs font-bold text-muted"
                >
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {C_MAJOR_NOTES.map((start, ri) => (
              <tr key={start}>
                <th className="h-8 w-8 text-center text-xs font-bold text-muted">
                  {start}
                </th>
                {C_MAJOR_NOTES.map((end, ci) => {
                  const cell = INTERVAL_TABLE[ri][ci];
                  const isTritone = cell === 'A4' || cell === 'd5';
                  const isUnison = cell === 'P1';
                  const abbr = cell === 'P1' ? 'P1' : intervalById(cell).abbr;
                  return (
                    <td
                      key={end}
                      className={`min-w-16 rounded-md px-1 py-1 text-center ${
                        isTritone
                          ? 'bg-[#e8a850]/15 text-accent'
                          : isUnison
                            ? 'text-[#3a3e46]'
                            : 'bg-card-2 text-text'
                      }`}
                    >
                      <div className="text-[9px] font-semibold leading-tight opacity-60">
                        {abbr}
                      </div>
                      <div className="text-xs font-semibold leading-tight">
                        {names[cell] ?? ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}