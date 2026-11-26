import React, { useMemo, useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { ExclusionRules, SellerLead } from '../types/os';
import { VERTICALS } from '../data/verticals';
import { computeVerticalAnalytics } from '../utils/outreachEngine';

interface VerticalsRegistryViewProps {
  onSelectVerticalInPipeline: (verticalId: SellerLead['verticalId']) => void;
}

export const VerticalsRegistryView: React.FC<VerticalsRegistryViewProps> = ({
  onSelectVerticalInPipeline,
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-[#0F2342]">
          Top 10 Low-Competition US Acquisition Niches &amp; Public Data Registries (2026–2027)
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Ranked by expected buy-side fee velocity (active PE/family-office liquidity × owner reply rate − cold-email saturation). Pull 100+ verified owners/day directly from state boards, trade directories, and OEM locators below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {VERTICALS.map((v) => (
          <section
            key={v.id}
            className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    Rank #{v.rank} · {v.pilotStatus} · Competition: {v.competitionLevel}
                  </div>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-[#0F2342]">
                    {v.name}
                  </h3>
                </div>
                <div className="text-right font-mono text-xs text-slate-700 shrink-0">
                  <div className="font-semibold text-[#0F2342]">{v.ebitdaMultipleRange}</div>
                  <div className="text-slate-500">{v.typicalEbitdaRange}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900">Target: </span>
                  {v.targetSubSegments}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Avoid: </span>
                  {v.avoidSubSegments}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Active Acquirers: </span>
                  {v.activePlatforms.join(' · ')}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-900">
                  Public Owner Data Sources
                </div>
                <ul className="mt-1.5 space-y-1.5 text-xs">
                  {v.dataSources.map((ds) => (
                    <li key={ds.name} className="text-slate-600">
                      <a
                        href={ds.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#0F2342] underline decoration-slate-300 hover:decoration-[#0F2342]"
                      >
                        {ds.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>{' '}
                      — {ds.extractionTip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-red-800">
                  Pre-Email Deal-Killer Filters
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {v.dealKillers.join(' · ')}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => onSelectVerticalInPipeline(v.id)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0F2342] hover:bg-slate-50"
              >
                Open {v.shortName} Pipeline
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

interface AnalyticsAuditViewProps {
  leads: SellerLead[];
  exclusions: ExclusionRules;
  onAddExclusion: (kind: 'domains' | 'companies' | 'emails', value: string) => void;
  onRemoveExclusion: (kind: 'domains' | 'companies' | 'emails', value: string) => void;
}

export const AnalyticsAuditView: React.FC<AnalyticsAuditViewProps> = ({
  leads,
  exclusions,
  onAddExclusion,
  onRemoveExclusion,
}) => {
  const [exclKind, setExclKind] = useState<'domains' | 'companies' | 'emails'>('domains');
  const [exclInput, setExclInput] = useState('');

  const rows = useMemo(
    () => computeVerticalAnalytics(leads, exclusions),
    [leads, exclusions]
  );

  const handleAddExcl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = exclInput.trim();
    if (!cleaned) return;
    onAddExclusion(exclKind, cleaned);
    setExclInput('');
  };

  return (
    <div className="space-y-8">
      {/* Day-14 Go / Pivot Decision Matrix */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[#0F2342]">
            Multi-Niche KPI Scorecard &amp; 14-Day Go / Pivot Decision Matrix
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Scale trigger: ≥1.5% positive &ldquo;Yes&rdquo; reply rate and ≥40% call-to-buyer intro rate. Pivot trigger: &lt;0.6% positive rate after 300–400 verified sends.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-6 py-2.5 font-semibold">Vertical</th>
                <th className="px-4 py-2.5 text-right font-semibold">Total Targets</th>
                <th className="px-4 py-2.5 text-right font-semibold">Eligible Ready</th>
                <th className="px-4 py-2.5 text-right font-semibold">Contacted</th>
                <th className="px-4 py-2.5 text-right font-semibold">Positive Replies</th>
                <th className="px-4 py-2.5 text-right font-semibold">Positive %</th>
                <th className="px-4 py-2.5 text-right font-semibold">Calls / Intros</th>
                <th className="px-6 py-2.5 text-right font-semibold">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr key={r.verticalId} className="hover:bg-slate-50/70">
                  <td className="px-6 py-3 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{r.totalLeads}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{r.eligibleReady}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{r.sentCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold">
                    {r.positiveReplies}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">
                    {r.positiveReplyRatePct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {r.callsOrIntros}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold">
                    <span
                      className={
                        r.verdict === 'Scale'
                          ? 'text-emerald-700'
                          : r.verdict === 'Optimize'
                            ? 'text-amber-700'
                            : r.verdict === 'Pivot'
                              ? 'text-red-700'
                              : 'text-slate-500'
                      }
                    >
                      {r.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Global Do-Not-Contact & PE-Backed Exclusions */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#0F2342]">
            Global Exclusion List (PE-Owned / Do-Not-Contact Guardrail)
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Any matching domain, company, or email is automatically rejected during CSV import and blocked from Dispatch 100 queues.
          </p>
        </div>

        <form onSubmit={handleAddExcl} className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Exclusion type"
            value={exclKind}
            onChange={(e) => setExclKind(e.target.value as 'domains' | 'companies' | 'emails')}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
          >
            <option value="domains">Domain</option>
            <option value="companies">Company Name</option>
            <option value="emails">Email Address</option>
          </select>
          <input
            type="text"
            value={exclInput}
            onChange={(e) => setExclInput(e.target.value)}
            placeholder="e.g., consolidator-domain.com"
            className="min-w-[240px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461]"
          >
            <Plus className="h-3.5 w-3.5" /> Add Exclusion
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
          {(['domains', 'companies', 'emails'] as const).map((kind) => (
            <div key={kind} className="space-y-2 border-t border-slate-100 pt-3">
              <div className="text-xs font-semibold capitalize text-slate-800">
                Excluded {kind} ({exclusions[kind].length})
              </div>
              <ul className="space-y-1.5 text-xs">
                {exclusions[kind].map((val) => (
                  <li
                    key={val}
                    className="flex items-center justify-between gap-2 text-slate-700"
                  >
                    <span className="font-mono truncate">{val}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveExclusion(kind, val)}
                      aria-label={`Remove exclusion ${val}`}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
