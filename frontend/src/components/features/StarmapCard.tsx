import { useEffect, useMemo, useRef, useState } from 'react';
import type { PolarisSummary } from '@/services/polarisSummaryService';
import { extractInThisReportInfo } from '@/polaris/needs-analysis/parse';

interface StarmapCardProps {
  summary: PolarisSummary;
  onOpen?: (id: string) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width || el.clientWidth;
      setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

export default function StarmapCard({ summary, onOpen, onDelete, deleting }: StarmapCardProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();

  const info = useMemo(
    () => extractInThisReportInfo(summary.summary_content),
    [summary.summary_content]
  );
  const createdAt = useMemo(
    () => new Date(summary.created_at).toLocaleString(),
    [summary.created_at]
  );

  // Content tiers
  // tier 3: >= 900px (rich details)
  // tier 2: >= 520px (compact key info)
  // tier 1: < 520px (minimal)
  const tier = width >= 900 ? 3 : width >= 520 ? 2 : 1;

  const segments = useMemo(() => {
    if (!info) return [] as Array<{ key: string; value: number; className: string }>;
    const c = info.counts || ({} as any);
    const values = [
      {
        key: 'Modalities',
        value: Number(c.modalities || 0),
        className: 'from-primary-400 to-primary-500',
      },
      { key: 'Phases', value: Number(c.phases || 0), className: 'from-fuchsia-400 to-fuchsia-500' },
      {
        key: 'Metrics',
        value: Number(c.metrics || 0),
        className: 'from-emerald-400 to-emerald-500',
      },
      {
        key: 'Objectives',
        value: Number(c.objectives || 0),
        className: 'from-cyan-400 to-cyan-500',
      },
    ];
    const total = values.reduce((sum, s) => sum + s.value, 0) || 1;
    return values.map((v) => ({
      ...v,
      value: Math.max(0, Math.min(100, Math.round((v.value / total) * 100))),
    }));
  }, [info]);

  return (
    <div
      ref={ref}
      className="glass-card hover:border-primary-400/30 group rounded-xl border border-white/10 p-5 transition-all duration-300 hover:bg-white/8 md:p-6"
    >
      {/* Animated top bar infographic for tier 3 */}
      {tier === 3 && segments.length > 0 && (
        <div className="mb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="flex h-full w-full">
              {segments.map((s, idx) => (
                <div
                  key={idx}
                  className={`h-full bg-gradient-to-r ${s.className} transition-all duration-700`}
                  style={{ width: `${s.value}%` }}
                  title={`${s.key}: ${s.value}%`}
                />
              ))}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-white/60">
            {segments.map((s, idx) => (
              <span key={idx} className="inline-flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-sm bg-gradient-to-r ${s.className}`}
                />
                {s.key}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpen?.(summary.id)}
          className="min-w-0 flex-1 text-left"
          aria-label="Open starmap"
        >
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white md:text-lg">
              {summary.report_title || summary.company_name || 'Untitled Discovery'}
            </h3>
            <span className="text-white/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/60 md:text-xs">{createdAt}</p>

          {tier === 1 && <p className="mt-3 text-xs text-white/65">Tap to view details</p>}

          {tier === 2 && info && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="text-[11px] text-white/60">Sections</div>
                <div className="truncate text-sm font-semibold text-white/90">
                  {info.sections.slice(0, 3).join(', ')}
                  {info.sections.length > 3 ? '…' : ''}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="text-[11px] text-white/60">Highlights</div>
                <div className="text-sm font-semibold text-white/90">
                  {info.counts.modalities} mods · {info.counts.phases} phases ·{' '}
                  {info.counts.metrics} metrics
                </div>
              </div>
            </div>
          )}

          {tier === 3 && info && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 md:p-4">
                <div className="mb-2 text-[11px] tracking-wide text-white/60 uppercase">
                  In this report
                </div>
                <ul className="space-y-1 text-xs text-white/75">
                  {info.sections.slice(0, 6).map((s, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="bg-primary-300 h-1.5 w-1.5 rounded-full" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 md:p-4">
                <div className="mb-2 text-[11px] tracking-wide text-white/60 uppercase">
                  Key counts
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px] text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-primary-400/70 h-1.5 w-1.5 rounded-full" />
                    <span className="text-white/60">Modalities:</span>{' '}
                    <span className="font-semibold text-white/90">{info.counts.modalities}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400/70" />
                    <span className="text-white/60">Objectives:</span>{' '}
                    <span className="font-semibold text-white/90">{info.counts.objectives}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                    <span className="text-white/60">Phases:</span>{' '}
                    <span className="font-semibold text-white/90">{info.counts.phases}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
                    <span className="text-white/60">Metrics:</span>{' '}
                    <span className="font-semibold text-white/90">{info.counts.metrics}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 md:p-4">
                <div className="mb-2 text-[11px] tracking-wide text-white/60 uppercase">
                  Problem statement
                </div>
                <p className="line-clamp-5 text-xs leading-relaxed text-white/75 md:text-[13px]">
                  {info.problemStatement || '—'}
                </p>
              </div>
            </div>
          )}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(summary.id)}
            disabled={deleting}
            className="p-1 text-white/40 opacity-0 transition-colors group-hover:opacity-100 hover:text-red-400 focus:opacity-100"
            title="Delete starmap"
            aria-label="Delete starmap"
          >
            {deleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
