import React, { useMemo, useState } from 'react';
import { Check, Download, Pause, Play, Send } from 'lucide-react';
import {
  BuyerMandate,
  DailySplitAllocation,
  EmailAngle,
  ExclusionRules,
  SellerLead,
  SendingInbox,
  VerticalId,
} from '../types/os';
import { VERTICALS, VERTICAL_MAP } from '../data/verticals';
import {
  allocateDailyBatch100,
  buildSmartleadCsv,
  evaluateLeadEligibility,
} from '../utils/outreachEngine';

interface Dispatch100ViewProps {
  leads: SellerLead[];
  inboxes: SendingInbox[];
  buyers: BuyerMandate[];
  exclusions: ExclusionRules;
  allocations: DailySplitAllocation[];
  onChangeAllocation: (verticalId: VerticalId, targetCount: number) => void;
  onToggleInboxStatus: (inboxId: string) => void;
  onMarkBatchSent: (leadIds: string[]) => void;
}

export const Dispatch100View: React.FC<Dispatch100ViewProps> = ({
  leads,
  inboxes,
  buyers,
  exclusions,
  allocations,
  onChangeAllocation,
  onToggleInboxStatus,
  onMarkBatchSent,
}) => {
  const [angle, setAngle] = useState<EmailAngle>('REAL_ESTATE_LEGACY');
  const [exportedBanner, setExportedBanner] = useState<string | null>(null);

  const allocationResult = useMemo(
    () =>
      allocateDailyBatch100(
        leads,
        inboxes,
        buyers,
        exclusions,
        allocations,
        angle
      ),
    [leads, inboxes, buyers, exclusions, allocations, angle]
  );

  const totalTargetQuota = useMemo(
    () => allocations.reduce((sum, a) => sum + a.targetCount, 0),
    [allocations]
  );

  const avgBounce = useMemo(() => {
    if (inboxes.length === 0) return 0;
    return (
      inboxes.reduce((sum, i) => sum + i.bounceRatePct, 0) / inboxes.length
    );
  }, [inboxes]);

  const googleCount = inboxes.filter((i) => i.provider === 'Google Workspace').length;
  const m365Count = inboxes.filter((i) => i.provider === 'Microsoft 365').length;

  const handleDownloadSmartleadCsv = () => {
    const csv = buildSmartleadCsv(allocationResult.assignments);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `Keystone_MultiNiche_Smartlead_Batch_${dateStamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedBanner(
      `Exported ${allocationResult.assignments.length} plain-text multi-inbox leads (T1 + Day +4 + Day +10) ready for Smartlead / Instantly.`
    );
    setTimeout(() => setExportedBanner(null), 4000);
  };

  const handleMarkSent = () => {
    if (allocationResult.assignments.length === 0) return;
    onMarkBatchSent(allocationResult.assignments.map((a) => a.lead.id));
    setExportedBanner(
      `Marked ${allocationResult.assignments.length} targets as Sent T1 — Day +4 follow-up timers activated.`
    );
    setTimeout(() => setExportedBanner(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Top Infrastructure Guardrail Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Safe Daily Capacity</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
            {allocationResult.totalSafeCapacity}/day
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {allocationResult.healthyInboxes.length} active · {allocationResult.pausedInboxes.length} paused
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Domain &amp; ESP Split</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
            {googleCount}G / {m365Count}M
          </div>
          <div className="mt-1 text-xs text-slate-600">
            5 lookalike domains · primary protected
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Fleet Bounce Rate</div>
          <div
            className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
              avgBounce < 1.5 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {avgBounce.toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Guardrail ceiling: &lt;1.5% (auto-pause ≥2.0%)
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Queued Right Now</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
            {allocationResult.assignments.length} / {totalTargetQuota}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            10:00 AM–1:00 PM ET staggered · plain text
          </div>
        </div>
      </div>

      {exportedBanner && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <Check className="h-4 w-4 shrink-0" />
          <span>{exportedBanner}</span>
        </div>
      )}

      {/* Daily 100-Email Multi-Niche Quota Allocator */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F2342]">
              Daily 100-Email Multi-Niche Split &amp; Sequencer Export
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Primary domain <span className="font-mono">keystonedealpartners.com</span> is locked out of cold sending. All batches dispatch via warmed lookalike domains with ESP matching and open/click tracking disabled.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAngle('REAL_ESTATE_LEGACY')}
                className={`rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                  angle === 'REAL_ESTATE_LEGACY'
                    ? 'bg-white text-[#0F2342] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Real Estate / Legacy Copy
              </button>
              <button
                type="button"
                onClick={() => setAngle('TECHNICAL_VALUATION')}
                className={`rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                  angle === 'TECHNICAL_VALUATION'
                    ? 'bg-white text-[#0F2342] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Technical / Valuation Copy
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownloadSmartleadCsv}
              disabled={allocationResult.assignments.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461] disabled:opacity-40 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Export Smartlead / Instantly CSV ({allocationResult.assignments.length})
            </button>
            <button
              type="button"
              onClick={handleMarkSent}
              disabled={allocationResult.assignments.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5" />
              Mark Queued as Sent T1
            </button>
          </div>
        </div>

        {/* Quota Controls Grid */}
        <div className="grid grid-cols-1 gap-4 border-b border-slate-200 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {allocations.map((alloc) => {
            const v = VERTICAL_MAP[alloc.verticalId];
            const readyCount = leads.filter(
              (l) =>
                l.verticalId === alloc.verticalId &&
                (l.stage === 'Ready' || l.stage === 'Queued') &&
                evaluateLeadEligibility(l, exclusions).eligible
            ).length;
            return (
              <div key={alloc.verticalId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`quota-${alloc.verticalId}`}
                    className="font-semibold text-slate-800"
                  >
                    {v.shortName}
                  </label>
                  <span className="font-mono text-slate-500">{readyCount} in pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={`quota-${alloc.verticalId}`}
                    type="number"
                    min={0}
                    max={60}
                    value={alloc.targetCount}
                    onChange={(e) =>
                      onChangeAllocation(
                        alloc.verticalId,
                        Math.max(0, Math.min(60, Number(e.target.value) || 0))
                      )
                    }
                    className="w-20 rounded-md border border-slate-300 px-2.5 py-1.5 font-mono text-xs text-slate-900"
                  />
                  <span className="text-xs text-slate-500">emails/day ({v.pilotStatus})</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Queued Batch Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-6 py-2.5 font-semibold">Send Slot</th>
                <th className="px-4 py-2.5 font-semibold">Target Company &amp; Owner</th>
                <th className="px-4 py-2.5 font-semibold">Vertical</th>
                <th className="px-4 py-2.5 font-semibold">Assigned Sender Inbox</th>
                <th className="px-4 py-2.5 font-semibold">Primary Buyer Match</th>
                <th className="px-4 py-2.5 text-right font-semibold">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allocationResult.assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No eligible Ready leads match the current vertical quotas. Import leads via CSV or raise a vertical quota above 0.
                  </td>
                </tr>
              ) : (
                allocationResult.assignments.map((a) => (
                  <tr key={a.lead.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3 font-mono text-slate-700 whitespace-nowrap">
                      {a.sendWindowEt}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{a.lead.company}</div>
                      <div className="text-slate-500">
                        {a.lead.ownerName} · <span className="font-mono">{a.lead.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {VERTICAL_MAP[a.lead.verticalId].shortName} · {a.lead.state}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-800">{a.inbox.email}</div>
                      <div className="text-slate-500">
                        {a.inbox.provider} (ESP Matched)
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {a.primaryBuyer}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#0F2342]">
                      {a.retirementScore}/6
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Secondary Domain & Sending Inbox Fleet Table */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-[#0F2342]">
            Secondary Domain &amp; Sending Inbox Fleet (10 Inboxes / 5 Lookalike Domains)
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Target ceiling: 10–15 cold emails/inbox/day + 10 warmup emails/day. Open &amp; click tracking strictly OFF for corporate Proofpoint/Mimecast inbox placement.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-6 py-2.5 font-semibold">Sender Inbox</th>
                <th className="px-4 py-2.5 font-semibold">ESP Provider</th>
                <th className="px-4 py-2.5 font-semibold">DNS &amp; Hygiene</th>
                <th className="px-4 py-2.5 text-right font-semibold">Warmup</th>
                <th className="px-4 py-2.5 text-right font-semibold">Daily Cap</th>
                <th className="px-4 py-2.5 text-right font-semibold">Bounce %</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-6 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inboxes.map((inb) => {
                const isHighBounce = inb.bounceRatePct >= 2.0;
                const effectiveStatus = isHighBounce ? 'Paused (Bounce)' : inb.status;
                return (
                  <tr key={inb.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3 font-mono font-medium text-slate-900">
                      {inb.email}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {inb.provider}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      SPF · 2048-DKIM · DMARC · 301 · No Pixel
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      Day {inb.warmupDay} ({inb.warmupHealthPct}%)
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {inb.dailyColdCap}/day
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-medium ${
                        isHighBounce
                          ? 'text-red-700'
                          : inb.bounceRatePct >= 1.5
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                      }`}
                    >
                      {inb.bounceRatePct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          effectiveStatus === 'Active'
                            ? 'text-emerald-700'
                            : effectiveStatus === 'Warming'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleInboxStatus(inb.id)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {inb.status === 'Active' ? (
                          <>
                            <Pause className="h-3 w-3" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Resume
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supported Verticals Note */}
      <div className="text-xs text-slate-500">
        All {VERTICALS.length} verticals are supported by the round-robin ESP-matching engine. Add Wave 2 verticals above once their 4–6 buyer fee agreements are signed.
      </div>
    </div>
  );
};
