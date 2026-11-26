import React, { useMemo, useState } from 'react';
import { Check, Copy, FileText, ArrowRight } from 'lucide-react';
import { BuyerMandate, LeadStage, SellerLead } from '../types/os';
import { VERTICAL_MAP } from '../data/verticals';
import {
  buildBlindTeaser,
  buildFollowUpDay10PlainText,
  buildFollowUpDay4PlainText,
  routeLeadToBuyers,
} from '../utils/outreachEngine';

interface FollowUpsRepliesViewProps {
  leads: SellerLead[];
  buyers: BuyerMandate[];
  onSelectLead: (lead: SellerLead) => void;
  onUpdateStage: (leadId: string, nextStage: LeadStage) => void;
}

export const FollowUpsRepliesView: React.FC<FollowUpsRepliesViewProps> = ({
  leads,
  buyers,
  onSelectLead,
  onUpdateStage,
}) => {
  const [subTab, setSubTab] = useState<'replies' | 'followups'>('replies');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeReplies = useMemo(
    () =>
      leads.filter((l) =>
        ['Replied — Positive', 'Call Booked', 'NDA / Buyer Intro', 'LOI'].includes(
          l.stage
        )
      ),
    [leads]
  );

  const dueFollowUps = useMemo(
    () => leads.filter((l) => l.stage === 'Sent T1' || l.stage === 'Sent T2'),
    [leads]
  );

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard error
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSubTab('replies')}
            className={`rounded px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
              subTab === 'replies'
                ? 'bg-white text-[#0F2342] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Seller Replies &amp; Intros ({activeReplies.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('followups')}
            className={`rounded px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
              subTab === 'followups'
                ? 'bg-white text-[#0F2342] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Due Follow-Up Bumps — Day +4 / +10 ({dueFollowUps.length})
          </button>
        </div>
        <div className="text-xs text-slate-600">
          Speed-to-lead target: call positive seller replies within 2 hours &amp; send Blind Teaser to top 3 matched signed buyers.
        </div>
      </div>

      {subTab === 'replies' ? (
        <div className="space-y-4">
          {activeReplies.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              No positive seller replies logged yet. Open any lead in the Pipeline drawer to log a reply and generate a Confidential Blind Teaser.
            </div>
          ) : (
            activeReplies.map((lead) => {
              const vertical = VERTICAL_MAP[lead.verticalId];
              const matches = routeLeadToBuyers(lead, buyers);
              const nextStage: LeadStage =
                lead.stage === 'Replied — Positive'
                  ? 'Call Booked'
                  : lead.stage === 'Call Booked'
                    ? 'NDA / Buyer Intro'
                    : 'LOI';

              return (
                <article
                  key={lead.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-semibold text-[#0F2342]">
                          {lead.company}
                        </h3>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-emerald-700">
                          {lead.stage}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {vertical.shortName} · {lead.city}, {lead.state} · {lead.ownerName}{' '}
                        ({lead.phone || lead.email}) ·{' '}
                        <span className="font-mono">
                          ~${lead.estRevenueM.toFixed(1)}M Rev / ${lead.estEbitdaM.toFixed(2)}M EBITDA
                        </span>
                        {lead.askingPriceM ? ` · Asking $${lead.askingPriceM.toFixed(1)}M` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(buildBlindTeaser(lead), `teaser-${lead.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F2342] hover:bg-slate-50"
                      >
                        {copiedId === `teaser-${lead.id}` ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Blind Teaser Copied
                          </>
                        ) : (
                          <>
                            <FileText className="h-3.5 w-3.5" /> Copy Blind Teaser
                          </>
                        )}
                      </button>
                      {lead.stage !== 'LOI' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStage(lead.id, nextStage)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173461]"
                        >
                          Advance to {nextStage}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectLead(lead)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>

                  {lead.replySnippet && (
                    <div className="rounded-md bg-slate-50 px-4 py-2.5 text-xs text-slate-800">
                      <span className="font-semibold text-slate-500">Seller Reply: </span>
                      &ldquo;{lead.replySnippet}&rdquo;
                    </div>
                  )}

                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Top Matched Buyers: </span>
                    {matches.length > 0
                      ? matches
                          .slice(0, 3)
                          .map((m) => `${m.buyer.firmName} (${m.buyer.agreementStatus})`)
                          .join(' · ')
                      : 'No matched signed buyer — add buyer mandate immediately'}
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {dueFollowUps.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              No pending Touch #2 or Touch #3 follow-ups. Once you mark a Dispatch 100 batch as Sent T1, Day +4 and Day +10 bumps queue here automatically.
            </div>
          ) : (
            dueFollowUps.map((lead) => {
              const isTouch2 = lead.stage === 'Sent T1';
              const copyText = isTouch2
                ? buildFollowUpDay4PlainText(lead)
                : buildFollowUpDay10PlainText(lead);
              const nextStage: LeadStage = isTouch2 ? 'Sent T2' : 'Sent T3';

              return (
                <article
                  key={lead.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#0F2342]">
                        {lead.company} — {isTouch2 ? 'Touch #2 (Day +4 New Angle)' : 'Touch #3 (Day +10 Breakup)'}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {VERTICAL_MAP[lead.verticalId].shortName} · {lead.ownerName} ({lead.email}) ·{' '}
                        {lead.ownsRealEstate ? 'Real Estate NNN Angle' : 'Partial Liquidity Angle'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(copyText, `fu-${lead.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        {copiedId === `fu-${lead.id}` ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy Bump
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStage(lead.id, nextStage)}
                        className="rounded-md bg-[#0F2342] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173461]"
                      >
                        Mark {nextStage}
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 font-sans text-xs leading-relaxed text-slate-700">
                    {copyText}
                  </pre>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
