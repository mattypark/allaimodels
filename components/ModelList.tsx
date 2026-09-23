'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VideoFacade from './VideoFacade';
import BenchmarkBars from './BenchmarkBars';
import type { ModelData, SuiteData } from '@/lib/data';

const STATUS_LABEL: Record<string, string> = {
  current: 'Current',
  preview: 'Limited',
  legacy: 'Legacy',
  retired: 'Retired',
};

function fmtContext(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  return `${Math.round(n / 1000)}K`;
}

/**
 * The model list expands in place rather than navigating away.
 *
 * Comparing two models in a lineup means holding both in view; a page
 * transition throws away that context every time you get curious. Each row
 * opens under itself with the launch video, the specs and the benchmarks.
 * Every model also has its own route for deep links and search engines.
 */
export default function ModelList({
  models,
  suites,
}: {
  models: ModelData[];
  suites: SuiteData[];
}) {
  const [open, setOpen] = useState<string | null>(models[0]?.id ?? null);
  const list = useRef<HTMLUListElement>(null);

  /**
   * Arriving from a globe dot: ?model=<id> opens that row and scrolls to it,
   * so a click on the sphere lands on the thing that was clicked rather than
   * on the top of a long list.
   *
   * Read from location rather than useSearchParams, which opts the whole route
   * out of static prerendering unless it is wrapped in Suspense. Every lab page
   * is otherwise fully static, and one query parameter is not worth losing that.
   */
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('model');
    if (!asked || !models.some((m) => m.id === asked)) return;

    setOpen(asked);
    // Waits a frame so the row is laid out before it is scrolled to.
    const frame = requestAnimationFrame(() => {
      list.current
        ?.querySelector(`[data-model="${CSS.escape(asked)}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [models]);

  return (
    <ul className="models" ref={list}>
      {models.map((m) => {
        const isOpen = open === m.id;
        return (
          <li key={m.id} data-model={m.id} data-status={m.status}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`panel-${m.id}`}
                onClick={() => setOpen(isOpen ? null : m.id)}
              >
                <span className="models__status mono">{STATUS_LABEL[m.status]}</span>
                <span className="models__name">{m.name}</span>

                <span className="models__facts mono">
                  {m.context && <span>{fmtContext(m.context.input_tokens)} ctx</span>}
                  {m.pricing && (
                    <span>
                      ${m.pricing.input_per_mtok} / ${m.pricing.output_per_mtok}
                    </span>
                  )}
                  <time dateTime={m.released}>
                    {m.date_precision === 'observed' ? 'seen ' : ''}
                    {m.released}
                  </time>
                </span>

                <span className="models__chevron" aria-hidden="true" data-open={isOpen}>
                  ↓
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`panel-${m.id}`}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="models__panel">
                    <div className="models__detail">
                      <p className="models__summary">{m.summary}</p>

                      <dl className="specs">
                        {m.context && (
                          <>
                            <dt>Context</dt>
                            <dd>
                              {m.context.input_tokens.toLocaleString()} in
                              {m.context.output_tokens
                                ? ` · ${m.context.output_tokens.toLocaleString()} out`
                                : ''}
                              {m.context.tokenizer_note && (
                                <span className="specs__note">{m.context.tokenizer_note}</span>
                              )}
                            </dd>
                          </>
                        )}
                        {m.pricing && (
                          <>
                            <dt>Price</dt>
                            <dd>
                              ${m.pricing.input_per_mtok} in / ${m.pricing.output_per_mtok} out
                              per million tokens
                              {m.pricing.notes && (
                                <span className="specs__note">{m.pricing.notes}</span>
                              )}
                            </dd>
                          </>
                        )}
                        {m.knowledge_cutoff && (
                          <>
                            <dt>Knowledge</dt>
                            <dd>through {m.knowledge_cutoff}</dd>
                          </>
                        )}
                        {m.retirement_not_before && (
                          <>
                            <dt>Retires</dt>
                            <dd>not before {m.retirement_not_before}</dd>
                          </>
                        )}
                        {Object.keys(m.api_ids).length > 0 && (
                          <>
                            <dt>API ids</dt>
                            <dd>
                              <ul className="ids">
                                {Object.entries(m.api_ids).map(([platform, id]) => (
                                  <li key={platform}>
                                    <span>{platform}</span>
                                    <code>{id}</code>
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </>
                        )}
                      </dl>

                      <p className="models__sources mono">
                        Sourced from{' '}
                        {m.sources.map((s, i) => (
                          <span key={s}>
                            {i > 0 && ' · '}
                            <a href={s} target="_blank" rel="noopener noreferrer">
                              {new URL(s).hostname.replace(/^www\./, '')}
                            </a>
                          </span>
                        ))}
                      </p>
                    </div>

                    <div className="models__aside">
                      {m.video ? (
                        <VideoFacade
                          youtubeId={m.video.youtube_id}
                          title={m.video.title ?? `${m.name} launch`}
                        />
                      ) : (
                        <div className="models__novideo">
                          <p className="eyebrow">No launch video sourced</p>
                          <p>
                            The weekly refresh looks for one. Until it finds a verified
                            URL, this space stays empty rather than showing a guess.
                          </p>
                        </div>
                      )}

                      <BenchmarkBars results={m.benchmarks} suites={suites} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
