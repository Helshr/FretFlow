import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import cagedData from '@/data/caged.json';
import {enumerateShapeRoots} from '@/lib/chords/enumerate';
import {chordDisplay} from '@/lib/chords/display';
import type {DisplayLabels} from '@/lib/chords/display';
import type {CagedShape} from '@/lib/chords/types';
import {pageMetadata} from '@/lib/seo';
import ChordDiagram from '@/components/ChordDiagram';
import FeaturePage from '@/components/FeaturePage';

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale});
  return pageMetadata(t('home.chordChartTitle'), t('home.chordChartDesc'), '/chords', locale);
}

export default async function ChordsPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const labels: DisplayLabels = {
    major: t('chord.majorSuffix'),
    shape: t('chord.shapeSuffix'),
    power: t('chord.power'),
  };
  const shapes = cagedData.shapes as CagedShape[];

  return (
    <FeaturePage homeLabel={t('nav.home')} title={t('home.chordChart')} maxWidth="max-w-[1200px]" exclude="/chords">
      <p className="mb-4 text-sm text-muted">{t('home.chordChartNote')}</p>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-line bg-card">
              <th className="px-2 py-2 text-sm text-muted">{t('chord.shapeSuffix')}</th>
              {ROOTS.map((r) => (
                <th key={r} className="px-1 py-2 text-sm font-semibold">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shapes.map((shape) => {
              const cells = enumerateShapeRoots(shape);
              return (
                <tr key={shape.id} className="border-b border-line last:border-0">
                  <th className="px-2 py-2 text-sm font-bold text-accent">
                    {shape.id}
                  </th>
                  {cells.map((cell, i) =>
                    cell ? (
                      <td key={i} className="border-l border-line px-1 py-2 align-top">
                        <div className="text-xs font-semibold">
                          {chordDisplay(cell.chord, labels).name}
                        </div>
                        <div className="text-[10px] text-muted">
                          {cell.chord.shape} R{cell.chord.rootFret}
                        </div>
                        <ChordDiagram
                          {...chordDisplay(cell.chord, labels)}
                          className="mx-auto w-[96px]"
                        />
                        <div className="text-[9px] text-muted/60">
                          [{cell.chord.frets.join(',')}]
                        </div>
                      </td>
                    ) : (
                      <td key={i} className="border-l border-line bg-bg/40" />
                    ),
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </FeaturePage>
  );
}
