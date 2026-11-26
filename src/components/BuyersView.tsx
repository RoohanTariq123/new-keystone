import React, { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, FileText, Mail, Plus, X } from 'lucide-react';
import {
  BuyerMandate,
  BuyerTier,
  FeeAgreementStatus,
  VerticalId,
} from '../types/os';
import { VERTICALS, VERTICAL_MAP } from '../data/verticals';
import { buildBuyerPitchEmail } from '../utils/outreachEngine';

const TIER_LABELS: Record<BuyerTier, string> = {
  TIER_1_PLATFORM: 'Tier 1 · PE Platform',
  TIER_2_LMM_PE_FO: 'Tier 2 · LMM PE / FO',
  TIER_3_FUNDED_SEARCHER: 'Tier 3 · Funded Searcher',
  TIER_4_STRATEGIC: 'Tier 4 · Regional Strategic',
};

const STATUS_OPTIONS: FeeAgreementStatus[] = [
  'Signed',
  'In Redline',
  'Pitched',
  'Target',
];

interface BuyersViewProps {
  buyers: BuyerMandate[];
  selectedVerticalFilter: VerticalId | 'ALL';
  onAddBuyer: (buyer: BuyerMandate) => void;
  onUpdateBuyerStatus: (buyerId: string, status: FeeAgreementStatus) => void;
  onDraftAgreement: (buyerId: string) => void;
}

export const BuyersView: React.FC<BuyersViewProps> = ({
  buyers,
  selectedVerticalFilter,
  onAddBuyer,
  onUpdateBuyerStatus,
  onDraftAgreement,
}) => {
  const [tierFilter, setTierFilter] = useState<BuyerTier | 'ALL'>('ALL');
  const [pitchBuyer, setPitchBuyer] = useState<BuyerMandate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New buyer form state
  const [firmName, setFirmName] = useState('');
  const [sponsorOrBacker, setSponsorOrBacker] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<BuyerTier>('TIER_2_LMM_PE_FO');
  const [primaryVertical, setPrimaryVertical] = useState<VerticalId>('dock_door');
  const [minEbitda, setMinEbitda] = useState('1.0');
  const [maxEbitda, setMaxEbitda] = useState('3.5');
  const [feeStructure, setFeeStructure] = useState('Flat 3% ($125K min)');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredBuyers = useMemo(() => {
    return buyers.filter((b) => {
      if (
        selectedVerticalFilter !== 'ALL' &&
        !b.verticals.includes(selectedVerticalFilter)
      ) {
        return false;
      }
      if (tierFilter !== 'ALL' && b.tier !== tierFilter) return false;
      return true;
    });
  }, [buyers, selectedVerticalFilter, tierFilter]);

  const signedCount = buyers.filter((b) => b.agreementStatus === 'Signed').length;
  const tier3Count = buyers.filter((b) => b.tier === 'TIER_3_FUNDED_SEARCHER').length;

  const handleCopyPitch = async (buyer: BuyerMandate) => {
    const pitch = buildBuyerPitchEmail(buyer);
    try {
      await navigator.clipboard.writeText(`Subject: ${pitch.subject}\n\n${pitch.body}`);
    } catch {
      // ignore clipboard restrictions
    }
    setCopiedId(buyer.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCreateBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !contactName.trim() || !email.trim()) {
      setFormError('Firm name, corp-dev contact, and email are required.');
      return;
    }
    const minE = Number(minEbitda);
    const maxE = Number(maxEbitda);
    if (Number.isNaN(minE) || Number.isNaN(maxE) || minE <= 0 || maxE < minE) {
      setFormError('Enter valid Min and Max EBITDA figures ($M).');
      return;
    }

    onAddBuyer({
      id: `buyer-${Date.now()}`,
      firmName: firmName.trim(),
      sponsorOrBacker: sponsorOrBacker.trim() || 'Committed Capital',
      contactName: contactName.trim(),
      contactTitle: 'Corporate Development',
      email: email.trim(),
      phone: '—',
      tier,
      verticals: [primaryVertical],
      states: ['ALL'],
      minRevenueM: Number((minE * 4).toFixed(1)),
      minEbitdaM: minE,
      maxEbitdaM: maxE,
      feeStructure: feeStructure.trim() || 'Flat 3% ($125K min)',
      minimumFeeK: 125,
      agreementStatus: 'Pitched',
      hasActiveDialogueCarveout: true,
      allowsListedDeals: tier !== 'TIER_1_PLATFORM',
      recentAddonExample: `${VERTICAL_MAP[primaryVertical].shortName} expansion`,
      guardrails: '48-hour active-dialogue carve-out required; standard 24-month fee tail.',
    });

    setFirmName('');
    setSponsorOrBacker('');
    setContactName('');
    setEmail('');
    setFormError(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Waterfall Summary Strip */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Signed Buy-Side Mandates</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
            {signedCount} / {buyers.length}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Target: 4–6 signed buyers per active vertical before 100/day blast
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Sub-$5M Revenue Monetization</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
            {tier3Count} Funded Searchers
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Captures $750K–$2M EBITDA seller replies rejected by large PE floors
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Attribution Guardrail</div>
          <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700">
            48-Hr Active Rule
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Prior contact excludes fee only with 2-way dialogue in last 6 months
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1">
          {(
            [
              ['ALL', 'All Tiers'],
              ['TIER_1_PLATFORM', 'Tier 1 Platforms'],
              ['TIER_2_LMM_PE_FO', 'Tier 2 LMM PE / FO'],
              ['TIER_3_FUNDED_SEARCHER', 'Tier 3 Funded Searchers'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTierFilter(val)}
              className={`rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                tierFilter === val
                  ? 'bg-white text-[#0F2342] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461] whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Buyer Mandate
        </button>
      </div>

      {/* Inline Add Buyer Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateBuyer}
          className="rounded-lg border border-slate-300 bg-white p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#0F2342]">
              New Buy-Side Fee Mandate
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              aria-label="Close new buyer form"
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="b-firm" className="block text-xs font-semibold text-slate-700">
                Buyer / Platform Name
              </label>
              <input
                id="b-firm"
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                placeholder="e.g., DuraServ Corp"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="b-sponsor" className="block text-xs font-semibold text-slate-700">
                PE Sponsor / Capital Backer
              </label>
              <input
                id="b-sponsor"
                type="text"
                value={sponsorOrBacker}
                onChange={(e) => setSponsorOrBacker(e.target.value)}
                placeholder="e.g., Leonard Green & Partners"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="b-tier" className="block text-xs font-semibold text-slate-700">
                Buyer Tier
              </label>
              <select
                id="b-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as BuyerTier)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {Object.entries(TIER_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b-contact" className="block text-xs font-semibold text-slate-700">
                Corp-Dev Contact Name
              </label>
              <input
                id="b-contact"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g., Jordan Ellis"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="b-email" className="block text-xs font-semibold text-slate-700">
                Contact Email
              </label>
              <input
                id="b-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jellis@buyer.com"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="b-vert" className="block text-xs font-semibold text-slate-700">
                Primary Vertical
              </label>
              <select
                id="b-vert"
                value={primaryVertical}
                onChange={(e) => setPrimaryVertical(e.target.value as VerticalId)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
              >
                {VERTICALS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b-mineb" className="block text-xs font-semibold text-slate-700">
                Min EBITDA ($M)
              </label>
              <input
                id="b-mineb"
                type="number"
                step="0.1"
                value={minEbitda}
                onChange={(e) => setMinEbitda(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label htmlFor="b-maxeb" className="block text-xs font-semibold text-slate-700">
                Max EBITDA ($M)
              </label>
              <input
                id="b-maxeb"
                type="number"
                step="0.1"
                value={maxEbitda}
                onChange={(e) => setMaxEbitda(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label htmlFor="b-fee" className="block text-xs font-semibold text-slate-700">
                Fee Schedule
              </label>
              <input
                id="b-fee"
                type="text"
                value={feeStructure}
                onChange={(e) => setFeeStructure(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-md border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461]"
            >
              Save Buyer Mandate
            </button>
          </div>
        </form>
      )}

      {/* Buyer Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-semibold">Buyer &amp; Verified Contact</th>
              <th className="px-3 py-3 font-semibold">Tier &amp; Verticals</th>
              <th className="px-3 py-3 font-semibold">Mandate Box &amp; Fee</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredBuyers.map((b) => {
              const hasDirectEmail = b.email.includes('@');
              return (
                <tr key={b.id} className="hover:bg-slate-50/70">
                  <td className="max-w-[320px] px-4 py-3">
                    <div className="font-semibold text-slate-900">{b.firmName}</div>
                    <div className="text-slate-500">
                      {b.sponsorOrBacker} · {b.contactName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                      {hasDirectEmail ? (
                        <a
                          href={`mailto:${b.email}?subject=${encodeURIComponent(
                            buildBuyerPitchEmail(b).subject
                          )}`}
                          className="inline-flex items-center gap-1 font-mono text-[#0F2342] hover:underline break-all"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          {b.email}
                        </a>
                      ) : b.websiteUrl ? (
                        <a
                          href={b.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[#0F2342] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {b.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : null}
                      {b.phone && b.phone !== '—' && (
                        <span className="font-mono text-slate-400">· {b.phone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-800">{TIER_LABELS[b.tier]}</div>
                    <div className="text-slate-500">
                      {b.verticals.map((vid) => VERTICAL_MAP[vid].shortName).join(' · ')}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono font-medium text-slate-900 tabular-nums">
                      ${b.minEbitdaM}M–${b.maxEbitdaM}M EBITDA · Min ${b.minRevenueM}M rev
                    </div>
                    <div className="mt-0.5 text-slate-600">
                      {b.feeStructure} · {b.states.includes('ALL') ? 'All 50 States' : `${b.states.length} States`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.hasActiveDialogueCarveout ? '48-hr Carve-Out' : 'Strict Off-Market'} ·{' '}
                      {b.allowsListedDeals ? 'Listed OK' : '$0 Listed'}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      aria-label={`Agreement status for ${b.firmName}`}
                      value={b.agreementStatus}
                      onChange={(e) =>
                        onUpdateBuyerStatus(b.id, e.target.value as FeeAgreementStatus)
                      }
                      className={`rounded border px-2 py-1 text-xs font-semibold ${
                        b.agreementStatus === 'Signed'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : b.agreementStatus === 'In Redline'
                            ? 'border-amber-300 bg-amber-50 text-amber-800'
                            : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDraftAgreement(b.id)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-[#0F2342] hover:bg-slate-50"
                      >
                        <FileText className="h-3 w-3" />
                        Agreement
                      </button>
                      <button
                        type="button"
                        onClick={() => setPitchBuyer(b)}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Pitch
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPitch(b)}
                        className="inline-flex items-center gap-1 rounded bg-[#0F2342] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#173461]"
                      >
                        {copiedId === b.id ? (
                          <>
                            <Check className="h-3 w-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Buyer Pitch Preview Modal */}
      {pitchBuyer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Buyer pitch script for ${pitchBuyer.firmName}`}
        >
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#0F2342]">
                  7-Day Fee-Agreement Pitch — {pitchBuyer.firmName}
                </h3>
                <p className="text-xs text-slate-500">
                  To: {pitchBuyer.contactName}{' '}
                  {pitchBuyer.email.includes('@')
                    ? `(${pitchBuyer.email})`
                    : pitchBuyer.websiteUrl
                      ? `(Portal: ${pitchBuyer.websiteUrl})`
                      : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPitchBuyer(null)}
                aria-label="Close pitch preview"
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Subject:{' '}
                  <span className="font-semibold text-slate-900">
                    {buildBuyerPitchEmail(pitchBuyer).subject}
                  </span>
                </div>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-800">
                  {buildBuyerPitchEmail(pitchBuyer).body}
                </pre>
              </div>
              {pitchBuyer.guardrails && (
                <div className="mt-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Notes / Routing: </span>
                  {pitchBuyer.guardrails}
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setPitchBuyer(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
              >
                Close
              </button>
              {pitchBuyer.email.includes('@') && (
                <a
                  href={`mailto:${pitchBuyer.email}?subject=${encodeURIComponent(
                    buildBuyerPitchEmail(pitchBuyer).subject
                  )}&body=${encodeURIComponent(buildBuyerPitchEmail(pitchBuyer).body)}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0F2342] hover:bg-slate-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open Mail Draft
                </a>
              )}
              <button
                type="button"
                onClick={() => handleCopyPitch(pitchBuyer)}
                className="rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white"
              >
                {copiedId === pitchBuyer.id ? 'Copied to Clipboard' : 'Copy Buyer Pitch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
