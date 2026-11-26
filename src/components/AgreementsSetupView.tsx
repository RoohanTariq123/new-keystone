import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, FileText, ShieldCheck, Terminal } from 'lucide-react';
import { BuyerMandate, FeeSchedulePreset } from '../types/os';
import { VERTICAL_MAP } from '../data/verticals';
import { buildBuySideFeeAgreementText } from '../utils/outreachEngine';

interface AgreementsSetupViewProps {
  buyers: BuyerMandate[];
  initialBuyerId?: string | null;
}

const LOOKALIKE_DOMAINS = [
  { domain: 'keystonedealgroup.com', provider: 'Google Workspace', inboxes: 'roohan@ · r.tariq@' },
  { domain: 'keystonedealco.com', provider: 'Google Workspace', inboxes: 'roohan@ · rtariq@' },
  { domain: 'keystonedealadvisors.com', provider: 'Google Workspace', inboxes: 'roohan@ · r.tariq@' },
  { domain: 'getkeystonedeal.com', provider: 'Microsoft 365', inboxes: 'roohan@ · rtariq@' },
  { domain: 'keystonedealhq.com', provider: 'Microsoft 365', inboxes: 'roohan@ · r.tariq@' },
];

const BACKUP_DOMAINS = [
  'keystonedealsourcing.com',
  'keystoneorigination.com',
  'keystonedealteam.com',
  'keystonebuyergroup.com',
  'keystonedealconnect.com',
];

const ATTORNEY_REVIEW_POINTS = [
  '1. Licensing & M&A Broker Exemption: Confirm Exchange Act §15(b)(13) + state finder rules for cross-border buy-side success fees.',
  '2. Fee Formula Clarity: Pick ONE schedule (3-2-1 Lehman OR Flat 3%) + $100K–$125K floor; define cash, debt, rollover, earnouts & excluded real estate.',
  '3. 48-Hour Active Carve-Out: Require documented 2-way owner M&A dialogue in last 6 months; explicitly exclude passive CRM lists & unanswered emails.',
  '4. 24-Month Tail & Survival: Cover buyer affiliates, portfolio companies, add-ons, and survival after 30-day termination.',
  '5. Signatory Authority & Enforcement: Confirm fee-paying legal entity, governing law, non-circumvention, and cross-border enforceability.',
];

const DNS_SNIPPETS = [
  {
    id: 'spf-google',
    label: 'SPF Record (Google Workspace Domains #1–#3)',
    recordType: 'TXT @',
    value: 'v=spf1 include:_spf.google.com ~all',
  },
  {
    id: 'spf-m365',
    label: 'SPF Record (Microsoft 365 Domains #4–#5)',
    recordType: 'TXT @',
    value: 'v=spf1 include:spf.protection.outlook.com ~all',
  },
  {
    id: 'dmarc',
    label: 'DMARC Policy (All 5 Secondary Domains)',
    recordType: 'TXT _dmarc',
    value:
      'v=DMARC1; p=quarantine; rua=mailto:dmarc@keystonedealpartners.com; adkim=r; aspf=r; pct=100',
  },
  {
    id: 'cloudflare-redirect',
    label: 'Cloudflare 301 Redirect Rule (All 5 Secondary Domains → Primary)',
    recordType: 'Redirect Rule (301)',
    value: 'Match: * (apex + www)  →  Target: https://keystonedealpartners.com/',
  },
];

const GIT_CLEANUP_COMMANDS = `# Run inside your local keystone-deal-partners repo to scrub the old SHS PDF & keep history clean
git pull origin main
git rm "public/assets/aistudio/Keystone_Southern_BuysideAgreement__1___4__a92c7f32.pdf"
git commit -m "Remove confidential third-party buy-side agreement PDF from public assets"
git push origin main

# Verify no confidential PDFs remain tracked in public/
git ls-files public/`;

function inferPreset(feeStructure: string): FeeSchedulePreset {
  const lower = feeStructure.toLowerCase();
  if (lower.includes('double')) return 'DOUBLE_LEHMAN';
  if (lower.includes('flat')) return 'FLAT_3_PCT';
  return 'LEHMAN_321';
}

export const AgreementsSetupView: React.FC<AgreementsSetupViewProps> = ({
  buyers,
  initialBuyerId,
}) => {
  const [section, setSection] = useState<'agreement' | 'infra'>('agreement');
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(
    initialBuyerId || buyers[0]?.id || ''
  );

  const selectedBuyer = useMemo(
    () => buyers.find((b) => b.id === selectedBuyerId) || buyers[0],
    [buyers, selectedBuyerId]
  );

  const [buyerName, setBuyerName] = useState(selectedBuyer?.firmName || '');
  const [sponsorName, setSponsorName] = useState(selectedBuyer?.sponsorOrBacker || '');
  const [signatoryName, setSignatoryName] = useState(selectedBuyer?.contactName || '');
  const [signatoryTitle, setSignatoryTitle] = useState(selectedBuyer?.contactTitle || '');
  const [targetVerticalsLabel, setTargetVerticalsLabel] = useState(
    selectedBuyer
      ? selectedBuyer.verticals.map((v) => VERTICAL_MAP[v].name).join(' and ')
      : 'Commercial Overhead Doors & Loading Docks'
  );
  const [minEbitdaM, setMinEbitdaM] = useState(selectedBuyer?.minEbitdaM ?? 1.0);
  const [maxEbitdaM, setMaxEbitdaM] = useState(selectedBuyer?.maxEbitdaM ?? 5.0);
  const [feePreset, setFeePreset] = useState<FeeSchedulePreset>(
    selectedBuyer ? inferPreset(selectedBuyer.feeStructure) : 'LEHMAN_321'
  );
  const [minimumFeeK, setMinimumFeeK] = useState(selectedBuyer?.minimumFeeK ?? 125);
  const [tailMonths, setTailMonths] = useState(24);
  const [carveOutBusinessHours, setCarveOutBusinessHours] = useState(48);
  const [governingState, setGoverningState] = useState('Delaware');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const applyBuyerToForm = (buyer: BuyerMandate) => {
    setSelectedBuyerId(buyer.id);
    setBuyerName(buyer.firmName);
    setSponsorName(buyer.sponsorOrBacker);
    setSignatoryName(buyer.contactName);
    setSignatoryTitle(buyer.contactTitle);
    setTargetVerticalsLabel(
      buyer.verticals.map((v) => VERTICAL_MAP[v].name).join(' and ')
    );
    setMinEbitdaM(buyer.minEbitdaM);
    setMaxEbitdaM(buyer.maxEbitdaM);
    setFeePreset(inferPreset(buyer.feeStructure));
    setMinimumFeeK(buyer.minimumFeeK);
  };

  useEffect(() => {
    if (initialBuyerId) {
      const found = buyers.find((b) => b.id === initialBuyerId);
      if (found) {
        applyBuyerToForm(found);
        setSection('agreement');
      }
    }
  }, [initialBuyerId, buyers]);

  const effectiveDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const agreementText = useMemo(
    () =>
      buildBuySideFeeAgreementText({
        buyerName,
        sponsorName,
        signatoryName,
        signatoryTitle,
        targetVerticalsLabel,
        minEbitdaM,
        maxEbitdaM,
        feePreset,
        minimumFeeK,
        tailMonths,
        carveOutBusinessHours,
        governingState,
        effectiveDate,
      }),
    [
      buyerName,
      sponsorName,
      signatoryName,
      signatoryTitle,
      targetVerticalsLabel,
      minEbitdaM,
      maxEbitdaM,
      feePreset,
      minimumFeeK,
      tailMonths,
      carveOutBusinessHours,
      governingState,
      effectiveDate,
    ]
  );

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard permissions in sandbox
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const slug = (buyerName || 'buyer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const handleDownloadPrintableHtml = () => {
    const escaped = agreementText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Keystone Deal Partners — Buy-Side Fee Agreement (${buyerName})</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 820px; margin: 40px auto; padding: 0 24px; color: #0F172A; line-height: 1.55; }
  pre { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12.5px; line-height: 1.6; }
  .bar { margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #CBD5E1; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; font-size: 13px; }
  button { background: #0F2342; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
  @media print { .bar { display: none; } body { margin: 0; } }
</style>
</head>
<body>
  <div class="bar">
    <span><strong>Keystone Deal Partners</strong> — Printable Fee Agreement (Save as PDF via browser print)</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <pre>${escaped}</pre>
</body>
</html>`;
    downloadFile(`keystone-buyside-agreement-${slug}.html`, html, 'text/html;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      {/* Top Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSection('agreement')}
            className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
              section === 'agreement'
                ? 'bg-white text-[#0F2342] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Non-Exclusive Buy-Side Fee Agreement
          </button>
          <button
            type="button"
            onClick={() => setSection('infra')}
            className={`inline-flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${
              section === 'infra'
                ? 'bg-white text-[#0F2342] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            DNS, Warmup &amp; Repo Cleanup Kit
          </button>
        </div>

        {section === 'agreement' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyText('agreement', agreementText)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              {copiedKey === 'agreement' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" /> Copied Agreement
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Agreement
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  `keystone-buyside-agreement-${slug}.txt`,
                  agreementText,
                  'text/plain;charset=utf-8'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download .txt
            </button>
            <button
              type="button"
              onClick={handleDownloadPrintableHtml}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173461] whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download Printable PDF Kit (.html)
            </button>
          </div>
        )}
      </div>

      {section === 'agreement' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Form Controls */}
          <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="font-display text-base font-semibold text-[#0F2342]">
                Configure Fee Agreement Terms
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Pre-loads any buyer from your waterfall with the mandatory 48-hour Active Dialogue
                Carve-Out and 24-month fee tail. Have M&amp;A counsel review before execution.
              </p>
            </div>

            <div>
              <label htmlFor="ag-buyer-select" className="block text-xs font-semibold text-slate-700">
                Auto-Fill From Buyer Waterfall
              </label>
              <select
                id="ag-buyer-select"
                value={selectedBuyerId}
                onChange={(e) => {
                  const found = buyers.find((b) => b.id === e.target.value);
                  if (found) applyBuyerToForm(found);
                }}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.firmName} ({b.sponsorOrBacker})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ag-buyer-name" className="block text-xs font-semibold text-slate-700">
                  Buyer Legal Entity
                </label>
                <input
                  id="ag-buyer-name"
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label htmlFor="ag-sponsor" className="block text-xs font-semibold text-slate-700">
                  PE Sponsor / Backer
                </label>
                <input
                  id="ag-sponsor"
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label htmlFor="ag-sig-name" className="block text-xs font-semibold text-slate-700">
                  Buyer Signatory Name
                </label>
                <input
                  id="ag-sig-name"
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label htmlFor="ag-sig-title" className="block text-xs font-semibold text-slate-700">
                  Buyer Signatory Title
                </label>
                <input
                  id="ag-sig-title"
                  type="text"
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ag-verticals" className="block text-xs font-semibold text-slate-700">
                Target Sector Scope
              </label>
              <input
                id="ag-verticals"
                type="text"
                value={targetVerticalsLabel}
                onChange={(e) => setTargetVerticalsLabel(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ag-fee-preset" className="block text-xs font-semibold text-slate-700">
                  Fee Schedule Structure
                </label>
                <select
                  id="ag-fee-preset"
                  value={feePreset}
                  onChange={(e) => setFeePreset(e.target.value as FeeSchedulePreset)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="LEHMAN_321">3-2-1 Lehman</option>
                  <option value="DOUBLE_LEHMAN">Double Lehman (5/4/3/2/1)</option>
                  <option value="FLAT_3_PCT">Flat 3.0% of TEV</option>
                </select>
              </div>
              <div>
                <label htmlFor="ag-min-fee" className="block text-xs font-semibold text-slate-700">
                  Minimum Fee ($K)
                </label>
                <input
                  id="ag-min-fee"
                  type="number"
                  min={50}
                  max={500}
                  step={5}
                  value={minimumFeeK}
                  onChange={(e) => setMinimumFeeK(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="ag-min-eb" className="block text-xs font-semibold text-slate-700">
                  Min EBITDA ($M)
                </label>
                <input
                  id="ag-min-eb"
                  type="number"
                  step={0.1}
                  value={minEbitdaM}
                  onChange={(e) => setMinEbitdaM(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="ag-max-eb" className="block text-xs font-semibold text-slate-700">
                  Max EBITDA ($M)
                </label>
                <input
                  id="ag-max-eb"
                  type="number"
                  step={0.25}
                  value={maxEbitdaM}
                  onChange={(e) => setMaxEbitdaM(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="ag-carveout" className="block text-xs font-semibold text-slate-700">
                  Prior-Contact Carve-Out (Hrs)
                </label>
                <input
                  id="ag-carveout"
                  type="number"
                  min={24}
                  max={120}
                  value={carveOutBusinessHours}
                  onChange={(e) => setCarveOutBusinessHours(Number(e.target.value) || 48)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="ag-state" className="block text-xs font-semibold text-slate-700">
                  Governing Law State
                </label>
                <input
                  id="ag-state"
                  type="text"
                  value={governingState}
                  onChange={(e) => setGoverningState(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Attribution Clause Active
              </div>
              <p className="mt-1 text-emerald-800">
                Section 3 blocks buyers from using passive CRM lists or old cold emails to avoid
                paying your fee — requiring documented 2-way dialogue within 6 months, disclosed
                within {carveOutBusinessHours} business hours.
              </p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-[#0F2342]">
                5-Point US M&amp;A Attorney Review Checklist
              </div>
              {ATTORNEY_REVIEW_POINTS.map((pt) => (
                <div key={pt} className="leading-relaxed">
                  {pt}
                </div>
              ))}
            </div>
          </div>

          {/* Right Live Document Preview */}
          <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div>
                <div className="text-xs font-semibold text-[#0F2342]">
                  Live Agreement Draft — {buyerName || 'Buyer'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Effective {effectiveDate} · {tailMonths}-Month Tail · {carveOutBusinessHours}-Hr Active Carve-Out
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Min ${minimumFeeK}K
              </span>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-[11.5px] leading-relaxed text-slate-800 bg-white">
              {agreementText}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 5 Secondary Domains + DNS Records */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-white p-5 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="font-display text-base font-semibold text-[#0F2342]">
                  5 Secondary Lookalike Domains
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Register at Cloudflare Registrar or Porkbun (~$10–$12/yr each). Never send cold
                  volume from primary <span className="font-mono">keystonedealpartners.com</span>.
                </p>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                {LOOKALIKE_DOMAINS.map((d) => (
                  <div key={d.domain} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-mono font-semibold text-slate-900">{d.domain}</div>
                      <div className="text-slate-500">
                        {d.provider} · {d.inboxes}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(d.domain, d.domain)}
                      className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      {copiedKey === d.domain ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-[#0F2342]">Smartlead / Instantly Ramp Rules</div>
                <div>• Warmup: 14–21 days before first cold send (ramp 5 → 30/day, 35% warmup reply setting)</div>
                <div>• Send Cap: 10–15 cold emails/inbox/day × 10 inboxes = 100–150/day</div>
                <div>• Tracking: Plain-text ONLY · Disable open pixels &amp; click tracking</div>
                <div>• Guardrail: Auto-pause any inbox if bounce rate reaches 2.0%</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#0F2342]">
                    5 Backup .com Replacements (If Any Taken on Porkbun)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('backup-domains', BACKUP_DOMAINS.join('\n'))}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copiedKey === 'backup-domains' ? 'Copied' : 'Copy All 5'}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-600 leading-relaxed">
                  {BACKUP_DOMAINS.join(' · ')}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="font-display text-base font-semibold text-[#0F2342]">
                    Copy-Paste DNS &amp; 301 Redirect Records
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Add SPF, DKIM (generated inside Google Admin / M365 Defender), DMARC, and a 301
                    redirect so owners checking your sender domain land on{' '}
                    <span className="font-mono">keystonedealpartners.com</span>.
                  </p>
                </div>

                <div className="space-y-3">
                  {DNS_SNIPPETS.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-800">
                          {rec.label}{' '}
                          <span className="font-mono font-normal text-slate-500">
                            ({rec.recordType})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(rec.id, rec.value)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                          {copiedKey === rec.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-700" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy Record
                            </>
                          )}
                        </button>
                      </div>
                      <div className="mt-2 overflow-x-auto rounded border border-slate-200 bg-white px-3 py-2 font-mono text-[11.5px] text-slate-900">
                        {rec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub Repo Cleanup Block */}
              <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-semibold text-[#0F2342]">
                      Private GitHub Repo Confidentiality Cleanup
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Run these exact commands in your local{' '}
                      <span className="font-mono">RoohanTariq123/keystone-deal-partners</span>{' '}
                      terminal to delete the third-party SHS PDF from <span className="font-mono">public/</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('git-cleanup', GIT_CLEANUP_COMMANDS)}
                    className="inline-flex items-center gap-1 rounded-md bg-[#0F2342] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173461] whitespace-nowrap"
                  >
                    {copiedKey === 'git-cleanup' ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Commands
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-950 p-4 font-mono text-[11.5px] leading-relaxed text-slate-100">
                  {GIT_CLEANUP_COMMANDS}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
