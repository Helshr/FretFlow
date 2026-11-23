'use client';

import {useTranslations} from 'next-intl';
import {C_MAJOR_NOTES, intervalById} from '@/lib/intervals/cmajor';
import {INTERVAL_TABLE} from '@/lib/intervals/table';

/**
 * C 大调音程对照表（7×7，行为起点、列为终点）。同时是**出题范围选择器**：
 * 每个格子对应一个具体音程对（如 D→C），点击即勾选/取消该格，只出勾选格子的题。
 * 对角 P1（纯一度）是固定参考、不可勾选。格子 key = `${起点}-${终点}`。
 */
export default function IntervalTable({
  selectedKeys,
  onToggle,
}: {
  selectedKeys: string[];
  onToggle: (key: string) => void;
}) {
  const t = useTranslations('intervals');

  return (
    <div>
      <div className="mb-2 text-center text-xs text-muted">{t('tableClickHint')}</div>
      <div className="overflow-x-auto">
        <table className="mx-auto border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="h-7 w-7" />
              {C_MAJOR_NOTES.map((n) => (
                <th key={n} className="h-7 w-16 text-center text-xs font-bold text-muted">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {C_MAJOR_NOTES.map((start, ri) => (
              <tr key={start}>
                <th className="h-9 w-7 text-center text-xs font-bold text-muted">{start}</th>
                {C_MAJOR_NOTES.map((end, ci) => {
                  const cell = INTERVAL_TABLE[ri][ci];
                  if (cell === 'P1') {
                    return (
                      <td key={end}>
                        <div className="min-w-16 rounded-md px-1 py-1 text-center text-[#3a3e46]">
                          <div className="text-[9px] font-semibold leading-tight opacity-60">P1</div>
                          <div className="text-xs font-semibold leading-tight">{t('P1')}</div>
                        </div>
                      </td>
                    );
                  }
                  const key = `${start}-${end}`;
                  const on = selectedKeys.includes(key);
                  const isTritone = cell === 'A4' || cell === 'd5';
                  return (
                    <td key={end}>
                      <button
                        type="button"
                        onClick={() => onToggle(key)}
                        className={`min-w-16 rounded-md px-1 py-1 text-center transition ${
                          on
                            ? isTritone
                              ? 'bg-[#e8a850]/15 text-accent hover:brightness-110'
                              : 'bg-card-2 text-text hover:brightness-110'
                            : 'cursor-pointer border border-dashed border-line bg-card-2/40 text-[#3a3e46] hover:border-[#6b7280] hover:text-muted'
                        }`}
                      >
                        <div className="text-[9px] font-semibold leading-tight opacity-60">
                          {intervalById(cell).abbr}
                        </div>
                        <div className="text-xs font-semibold leading-tight">{t(cell)}</div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}