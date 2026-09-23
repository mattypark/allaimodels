'use client';

import { useMemo, useState } from 'react';
import CapabilityScatter, { type ScatterPoint } from './CapabilityScatter';
import type { ModelData, SuiteData } from '@/lib/data';

type Props = {
  models: ModelData[];
  suites: SuiteData[];
  accents: Record<string, string>;
  labNames: Record<string, string>;
};

const MAX = 5;

export default function Compare({ models, suites, accents, labNames }: Props) {
  const [picked, setPicked] = useState<string[]>(
    models.slice(0, 3).map((m) => `${m.lab}/${m.id}`),
  );

  const chosen = picked
    .map((k) => models.find((m) => `${m.lab}/${m.id}` === k))
    .filter((m): m is ModelData => Boolean(m));

  function toggle(key: string) {
    setPicked((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length >= MAX
          ? prev
          : [...prev, key],
    );
  }

  // Only suites at least one chosen model actually reports.
  const rows = useMemo(() => {
    const used = new Set(chosen.flatMap((m) => m.benchmarks.map((b) => b.suite)));
    return suites.filter((s) => used.has(s.slug));
  }, [chosen, suites]);

  const scatter: ScatterPoint[] = models
    .filter((m) => m.pricing && m.context)
    .map((m) => ({
      name: m.name,
      lab: m.lab,
      price: m.pricing!.input_per_mtok,
      context: m.context!.input_tokens,
      released: m.released,
      accent: accents[m.lab] ?? '#d97757',
    }));

  const scored = models.filter((m) => m.benchmarks.some((b) => b.comparable)).length;

  return (
    <>
      <div className="picker">
        <p className="eyebrow">Pick up to {MAX}</p>
        <ul>
          {models.map((m) => {
            const key = `${m.lab}/${m.id}`;
            const on = picked.includes(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={on}
                  data-on={on}
                  onClick={() => toggle(key)}
                  style={{ '--dot': accents[m.lab] } as React.CSSProperties}
                  disabled={!on && picked.length >= MAX}
                >
                  <span className="picker__dot" aria-hidden="true" />
                  {m.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="table-scroll">
        <table className="cmp">
          <caption className="sr-only">
            Specifications and benchmark results for the selected models. Cells marked
            not comparable were measured under conditions that differ between labs.
          </caption>
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              {chosen.map((m) => (
                <th scope="col" key={`${m.lab}/${m.id}`}>
                  <span className="cmp__lab mono">{labNames[m.lab] ?? m.lab}</span>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Released</th>
              {chosen.map((m) => (
                <td key={`${m.lab}/${m.id}`}>
                  {m.released}
                  {m.date_precision === 'observed' && <em> (first seen, not announced)</em>}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Context</th>
              {chosen.map((m) => (
                <td key={`${m.lab}/${m.id}`}>
                  {m.context ? m.context.input_tokens.toLocaleString() : <span className="na">not sourced</span>}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Price in / out</th>
              {chosen.map((m) => (
                <td key={`${m.lab}/${m.id}`}>
                  {m.pricing ? (
                    `$${m.pricing.input_per_mtok} / $${m.pricing.output_per_mtok}`
                  ) : (
                    <span className="na">not sourced</span>
                  )}
                </td>
              ))}
            </tr>

            {rows.map((s) => (
              <tr key={s.slug}>
                <th scope="row">
                  {s.name}
                  {s.comparability_warning && (
                    <span className="cmp__hint" title={s.comparability_warning}>
                      ⚠
                    </span>
                  )}
                </th>
                {chosen.map((m) => {
                  const hits = m.benchmarks.filter((b) => b.suite === s.slug);
                  if (hits.length === 0) {
                    return (
                      <td key={`${m.lab}/${m.id}`}>
                        <span className="na">not sourced</span>
                      </td>
                    );
                  }
                  return (
                    <td key={`${m.lab}/${m.id}`}>
                      {hits.map((b, i) => (
                        <span
                          key={i}
                          className="cmp__val"
                          data-comparable={b.comparable}
                          title={
                            b.comparable
                              ? undefined
                              : `Not comparable. ${b.harness_notes ?? s.comparability_warning ?? ''}`
                          }
                        >
                          {b.value}
                          {b.unit === 'percent' ? '%' : ''}
                          <small>{b.metric}</small>
                        </span>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="cmp__note">
        Greyed values were measured under conditions that differ between labs — hover one
        for the reason. Blank cells mean no source has been found, not zero.
      </p>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">The frontier</p>
          <h2>Price against context, over time.</h2>
          <p>
            Every model with both a sourced price and a sourced context window. Depth is
            the release date, because the story of this field is the frontier moving
            down and to the right. The third axis becomes benchmark score once coverage
            supports it — {scored} models currently have a comparable result, which is
            not yet a chart.
          </p>
        </div>
        <CapabilityScatter points={scatter} />
      </section>
    </>
  );
}
