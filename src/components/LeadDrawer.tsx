import React, { useState } from 'react';
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react';
import {
  BuyerMandate,
  EmailAngle,
  ExclusionRules,
  LeadStage,
  SellerLead,
} from '../types/os';
import { VERTICAL_MAP } from '../data/verticals';
import {
  buildBlindTeaser,
  buildFollowUpDay10PlainText,
  buildFollowUpDay4PlainText,
  buildLinkedInNote,
  buildOutlookWebComposeUrl,
  buildPlainTextEml,
  buildSellerEmail1PlainText,
  buildSellerSubject,
  calculateRetirementScore,
  evaluateLeadEligibility,
  routeLeadToBuyers,
} from '../utils/outreachEngine';

const ALL_STAGES: LeadStage[] = [
  'Ready',
  'Queued',
  'Sent T1',
  'Sent T2',
  'Sent T3',
  'Replied — Positive',
  'Call Booked',
  'NDA / Buyer Intro',
  'LOI',
  'Not Now',
  'Excluded',
];

interface LeadDrawerProps {
  lead: SellerLead;
  buyers: BuyerMandate[];
  exclusions: ExclusionRules;
  onClose: () => void;
  onUpdateLead: (updated: SellerLead) => void;
}

type PreviewTab = 'T1_RE' | 'T1_TECH' | 'T2' | 'T3' | 'LI' | 'TEASER';

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  lead,
  buyers,
  exclusions,
  onClose,
  onUpdateLead,
}) => {
  const [previewTab, setPreviewTab] = useState<PreviewTab>('T1_RE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState(lead.replySnippet || '');
  const [askingDraft, setAskingDraft] = useState(
    lead.askingPriceM ? String(lead.askingPriceM) : ''
  );
  const [notesDraft, setNotesDraft] = useState(lead.notes || '');

  const vertical = VERTICAL_MAP[lead.verticalId];
  const scoreInfo = calculateRetirementScore(lead.signals);
  const eligibility = evaluateLeadEligibility(lead, exclusions);
  const buyerMatches = routeLeadToBuyers(lead, buyers);

  const getPreviewContent = (): { subject: string; body: string } => {
    switch (previewTab) {
      case 'T1_RE':
        return {
          subject: buildSellerSubject(lead, 'REAL_ESTATE_LEGACY'),
          body: buildSellerEmail1PlainText(lead, 'REAL_ESTATE_LEGACY'),
        };
      case 'T1_TECH':
        return {
          subject: buildSellerSubject(lead, 'TECHNICAL_VALUATION'),
          body: buildSellerEmail1PlainText(lead, 'TECHNICAL_VALUATION'),
        };
      case 'T2':
        return {
          subject: `Re: ${buildSellerSubject(lead, 'REAL_ESTATE_LEGACY')}`,
          body: buildFollowUpDay4PlainText(lead),
        };
      case 'T3':
        return {
          subject: `Re: ${buildSellerSubject(lead, 'REAL_ESTATE_LEGACY')}`,
          body: buildFollowUpDay10PlainText(lead),
        };
      case 'LI':
        return {
          subject: 'LinkedIn Connection Note (<300 chars)',
          body: buildLinkedInNote(lead),
        };
      case 'TEASER':
        return {
          subject: `Confidential Blind Profile — ${vertical.shortName}`,
          body: buildBlindTeaser(lead),
        };
    }
  };

  const preview = getPreviewContent();

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard restrictions in headless tests
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDownloadEml = () => {
    const eml = buildPlainTextEml(
      `${lead.ownerName} - ${lead.company}`,
      lead.email,
      preview.subject,
      preview.body
    );
    const blob = new Blob([eml], { type: 'message/rfc822;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lead.company.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 28)}_${previewTab}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveQualification = () => {
    const parsedAsk = askingDraft.trim() ? Number(askingDraft) : undefined;
    onUpdateLead({
      ...lead,
      replySnippet: replyDraft.trim() || undefined,
      askingPriceM: parsedAsk && !Number.isNaN(parsedAsk) ? parsedAsk : undefined,
      notes: notesDraft,
    });
    setCopiedKey('saved');
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const angleForOutlook: EmailAngle =
    previewTab === 'T1_TECH' ? 'TECHNICAL_VALUATION' : 'REAL_ESTATE_LEGACY';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect ${lead.company}`}
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-[#0F2342] truncate">
              {lead.company}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {vertical.shortName} · {lead.city}, {lead.state} · Est. {lead.foundedYear} ·{' '}
              <span className="font-mono tabular-nums">
                ${lead.estRevenueM.toFixed(1)}M Rev / ${lead.estEbitdaM.toFixed(2)}M EBITDA
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead drawer"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Owner & Stage Control */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-b border-slate-200 pb-5">
            <div>
              <div className="text-xs font-semibold text-slate-500">Owner &amp; Direct Inbox</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {lead.ownerName} <span className="font-normal text-slate-500">({lead.ownerTitle})</span>
              </div>
              <div className="mt-0.5 font-mono text-xs text-slate-700">{lead.email}</div>
              <div className="mt-1 text-xs text-slate-500">
                {lead.emailVerification} · {lead.recipientEsp} ·{' '}
                {lead.ownsRealEstate ? 'Owns Real Estate' : 'Leased Facility'}
              </div>
            </div>
            <div>
              <label
                htmlFor="drawer-stage-select"
                className="block text-xs font-semibold text-slate-500"
              >
                Pipeline Stage
              </label>
              <select
                id="drawer-stage-select"
                value={lead.stage}
                onChange={(e) =>
                  onUpdateLead({ ...lead, stage: e.target.value as LeadStage })
                }
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-[#0F2342] focus:outline-none"
              >
                {ALL_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 text-xs text-slate-600">
                Retirement Score:{' '}
                <strong className="font-mono text-[#0F2342]">{scoreInfo.score}/6</strong> ·{' '}
                <span
                  className={
                    eligibility.eligible ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'
                  }
                >
                  {eligibility.eligible ? 'Eligible for 100/Day Dispatch' : 'Blocked by Guardrail'}
                </span>
              </div>
            </div>
          </div>

          {/* Eligibility Blockers if any */}
          {!eligibility.eligible && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              <div className="font-semibold">Deliverability / Deal-Killer Guardrail Triggered</div>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {eligibility.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ranked 3-Tier Buyer Waterfall */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Matched 3-Tier Buyer Waterfall ({buyerMatches.length})
            </h3>
            {buyerMatches.length === 0 ? (
              <p className="mt-2 text-xs text-amber-700">
                No signed buyer matches this deal size/geography yet. Add a Tier-2 Family Office or Tier-3 Funded Searcher in the Buyers tab before emailing.
              </p>
            ) : (
              <div className="mt-2 divide-y divide-slate-200 rounded-md border border-slate-200">
                {buyerMatches.slice(0, 4).map((m) => (
                  <div key={m.buyer.id} className="px-4 py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{m.buyer.firmName}</span>
                      <span className="font-mono text-slate-600">{m.priorityLabel}</span>
                    </div>
                    <div className="mt-0.5 text-slate-600">{m.matchReason}</div>
                    {m.warningNote && (
                      <div className="mt-1 font-medium text-amber-700">Warning: {m.warningNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plain-Text Outreach & Blind Teaser Studio */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Pure Plain-Text Sequence &amp; Blind Teaser
              </h3>
              <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
                {(
                  [
                    ['T1_RE', 'T1 Real Estate'],
                    ['T1_TECH', 'T1 Technical'],
                    ['T2', 'T2 Day +4'],
                    ['T3', 'T3 Day +10'],
                    ['LI', 'LinkedIn'],
                    ['TEASER', 'Blind Teaser'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPreviewTab(key)}
                    className={`rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                      previewTab === key
                        ? 'bg-white text-[#0F2342] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">
                Subject: <span className="font-medium text-slate-900">{preview.subject}</span>
              </div>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800">
                {preview.body}
              </pre>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(`${preview.subject}\n\n${preview.body}`, 'copy')}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#173461]"
              >
                {copiedKey === 'copy' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === 'copy' ? 'Copied' : 'Copy Plain Text'}
              </button>
              {previewTab !== 'LI' && previewTab !== 'TEASER' && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadEml}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download .eml
                  </button>
                  <a
                    href={buildOutlookWebComposeUrl(
                      lead.email,
                      buildSellerSubject(lead, angleForOutlook),
                      preview.body
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Outlook Draft
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Reply & Qualification Logger */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Seller Reply &amp; Qualification Notes
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="drawer-reply-input"
                  className="block text-xs font-medium text-slate-600"
                >
                  Seller Reply Snippet
                </label>
                <input
                  id="drawer-reply-input"
                  type="text"
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="e.g., Yes, give me a call Tuesday at 11am ET..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0F2342] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="drawer-ask-input"
                  className="block text-xs font-medium text-slate-600"
                >
                  Asking Price ($M)
                </label>
                <input
                  id="drawer-ask-input"
                  type="number"
                  step="0.1"
                  min="0"
                  value={askingDraft}
                  onChange={(e) => setAskingDraft(e.target.value)}
                  placeholder="e.g., 12.5"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#0F2342] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="drawer-notes-input"
                className="block text-xs font-medium text-slate-600"
              >
                Deal Context &amp; Pre-Screen Notes
              </label>
              <textarea
                id="drawer-notes-input"
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0F2342] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveQualification}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0F2342] hover:bg-slate-50"
            >
              {copiedKey === 'saved' ? 'Saved Qualification Notes' : 'Save Qualification Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
