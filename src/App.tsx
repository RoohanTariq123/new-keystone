import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Compass,
  Download,
  FileText,
  Globe,
  Layers,
  Menu,
  MessageSquareReply,
  Plus,
  Search,
  Send,
  Upload,
  X,
} from 'lucide-react';
import {
  BuyerMandate,
  DailySplitAllocation,
  ExclusionRules,
  FeeAgreementStatus,
  LeadStage,
  SellerLead,
  SendingInbox,
  VerticalId,
} from './types/os';
import { VERTICALS, VERTICAL_MAP } from './data/verticals';
import {
  ALL_SEED_LEADS,
  INITIAL_BUYERS,
  INITIAL_EXCLUSIONS,
  INITIAL_INBOXES,
} from './data/seedData';
import {
  buildMillionVerifierExportCsv,
  calculateRetirementScore,
  evaluateLeadEligibility,
  routeLeadToBuyers,
} from './utils/outreachEngine';
import { LeadDrawer } from './components/LeadDrawer';
import { CsvImportModal } from './components/CsvImportModal';
import { AddLeadModal } from './components/AddLeadModal';
import { Dispatch100View } from './components/Dispatch100View';
import { BuyersView } from './components/BuyersView';
import { FollowUpsRepliesView } from './components/FollowUpsRepliesView';
import {
  AnalyticsAuditView,
  VerticalsRegistryView,
} from './components/VerticalsAnalyticsView';
import { WebsitePreviewView } from './components/WebsitePreviewView';
import { AgreementsSetupView } from './components/AgreementsSetupView';

type NavView =
  | 'pipeline'
  | 'dispatch'
  | 'buyers'
  | 'agreements'
  | 'replies'
  | 'verticals'
  | 'analytics'
  | 'website';

const STORAGE_KEY = 'keystone_multiniche_os_v3';

const DEFAULT_ALLOCATIONS: DailySplitAllocation[] = [
  { verticalId: 'dock_door', targetCount: 30 },
  { verticalId: 'cfesa_kitchen', targetCount: 30 },
  { verticalId: 'liquid_waste', targetCount: 15 },
  { verticalId: 'legacy_hvac', targetCount: 25 },
];

interface PersistedState {
  leads: SellerLead[];
  buyers: BuyerMandate[];
  inboxes: SendingInbox[];
  exclusions: ExclusionRules;
  allocations: DailySplitAllocation[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.leads) && Array.isArray(parsed.buyers)) {
        return {
          leads: parsed.leads,
          buyers: parsed.buyers,
          inboxes: Array.isArray(parsed.inboxes) ? parsed.inboxes : INITIAL_INBOXES,
          exclusions: parsed.exclusions || INITIAL_EXCLUSIONS,
          allocations: Array.isArray(parsed.allocations)
            ? parsed.allocations
            : DEFAULT_ALLOCATIONS,
        };
      }
    }
  } catch {
    // fall back to clean seed state
  }
  return {
    leads: ALL_SEED_LEADS,
    buyers: INITIAL_BUYERS,
    inboxes: INITIAL_INBOXES,
    exclusions: INITIAL_EXCLUSIONS,
    allocations: DEFAULT_ALLOCATIONS,
  };
}

const VIEW_TITLES: Record<NavView, string> = {
  pipeline: 'Off-Market Pipeline',
  dispatch: 'Dispatch 100 Engine',
  buyers: 'Buyer Waterfall & Fees',
  agreements: 'Agreements & Setup Kit',
  replies: 'Replies & Follow-Ups',
  verticals: 'Niches & Public Registries',
  analytics: 'KPI Audit & Exclusions',
  website: 'Multi-Niche Website',
};

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);
  const [leads, setLeads] = useState<SellerLead[]>(initial.leads);
  const [buyers, setBuyers] = useState<BuyerMandate[]>(initial.buyers);
  const [inboxes, setInboxes] = useState<SendingInbox[]>(initial.inboxes);
  const [exclusions, setExclusions] = useState<ExclusionRules>(initial.exclusions);
  const [allocations, setAllocations] = useState<DailySplitAllocation[]>(initial.allocations);

  const [activeView, setActiveView] = useState<NavView>('pipeline');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [draftAgreementBuyerId, setDraftAgreementBuyerId] = useState<string | null>(null);

  // Pipeline filters
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'ALL'>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<
    'ALL' | 'ELIGIBLE' | 'NEEDS_VERIFY' | 'BLOCKED' | 'ACTIVE_REPLIES'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        leads,
        buyers,
        inboxes,
        exclusions,
        allocations,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [leads, buyers, inboxes, exclusions, allocations]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  );

  // Aggregate top-level KPIs
  const kpis = useMemo(() => {
    const eligibleReady = leads.filter(
      (l) =>
        (l.stage === 'Ready' || l.stage === 'Queued') &&
        evaluateLeadEligibility(l, exclusions).eligible
    ).length;
    const positiveReplies = leads.filter((l) =>
      ['Replied — Positive', 'Call Booked', 'NDA / Buyer Intro', 'LOI'].includes(l.stage)
    ).length;
    const dueFollowUps = leads.filter(
      (l) => l.stage === 'Sent T1' || l.stage === 'Sent T2'
    ).length;
    const signedBuyers = buyers.filter((b) => b.agreementStatus === 'Signed').length;
    const safeCapacity = inboxes
      .filter((i) => i.status === 'Active' && i.bounceRatePct < 2.0 && i.warmupDay >= 14)
      .reduce((sum, i) => sum + i.dailyColdCap, 0);
    return {
      eligibleReady,
      positiveReplies,
      dueFollowUps,
      signedBuyers,
      safeCapacity,
    };
  }, [leads, buyers, inboxes, exclusions]);

  const unverifiedLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.emailVerification === 'Unverified' &&
          l.dealKillerFlags.length === 0 &&
          l.stage !== 'Excluded'
      ),
    [leads]
  );

  const handleExportMillionVerifier = () => {
    const targets =
      verticalFilter === 'ALL'
        ? unverifiedLeads
        : unverifiedLeads.filter((l) => l.verticalId === verticalFilter);
    const csv = buildMillionVerifierExportCsv(targets);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keystone-millionverifier-targets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredPipelineLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads
      .filter((lead) => {
        if (verticalFilter !== 'ALL' && lead.verticalId !== verticalFilter) {
          return false;
        }
        const elig = evaluateLeadEligibility(lead, exclusions);
        if (eligibilityFilter === 'ELIGIBLE') {
          if (!elig.eligible || !['Ready', 'Queued'].includes(lead.stage)) return false;
        } else if (eligibilityFilter === 'NEEDS_VERIFY') {
          if (lead.emailVerification !== 'Unverified' || lead.dealKillerFlags.length > 0) {
            return false;
          }
        } else if (eligibilityFilter === 'BLOCKED') {
          if (elig.eligible) return false;
        } else if (eligibilityFilter === 'ACTIVE_REPLIES') {
          if (
            !['Replied — Positive', 'Call Booked', 'NDA / Buyer Intro', 'LOI'].includes(
              lead.stage
            )
          ) {
            return false;
          }
        }
        if (q) {
          const v = VERTICAL_MAP[lead.verticalId];
          const hay =
            `${lead.company} ${lead.ownerName} ${lead.email} ${lead.domain} ${lead.city} ${lead.state} ${v.shortName} ${lead.credentialTag}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sDiff =
          calculateRetirementScore(b.signals).score -
          calculateRetirementScore(a.signals).score;
        if (sDiff !== 0) return sDiff;
        const aYr = a.foundedYear > 0 ? a.foundedYear : 9999;
        const bYr = b.foundedYear > 0 ? b.foundedYear : 9999;
        return aYr - bYr;
      });
  }, [leads, verticalFilter, eligibilityFilter, searchQuery, exclusions]);

  const handleUpdateLead = (updated: SellerLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleUpdateStage = (leadId: string, nextStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, stage: nextStage, sentAt: nextStage.startsWith('Sent') ? new Date().toISOString().slice(0, 10) : l.sentAt }
          : l
      )
    );
  };

  const handleMarkBatchSent = (leadIds: string[]) => {
    const idSet = new Set(leadIds);
    const today = new Date().toISOString().slice(0, 10);
    setLeads((prev) =>
      prev.map((l) =>
        idSet.has(l.id)
          ? { ...l, stage: 'Sent T1', sentAt: today, daysSinceLastTouch: 0 }
          : l
      )
    );
  };

  const handleImportLeads = (newLeads: SellerLead[]) => {
    setLeads((prev) => [...newLeads, ...prev]);
  };

  const handleAddLead = (lead: SellerLead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  const handleAddBuyer = (buyer: BuyerMandate) => {
    setBuyers((prev) => [buyer, ...prev]);
  };

  const handleUpdateBuyerStatus = (buyerId: string, status: FeeAgreementStatus) => {
    setBuyers((prev) =>
      prev.map((b) => (b.id === buyerId ? { ...b, agreementStatus: status } : b))
    );
  };

  const handleChangeAllocation = (verticalId: VerticalId, targetCount: number) => {
    setAllocations((prev) =>
      prev.map((a) => (a.verticalId === verticalId ? { ...a, targetCount } : a))
    );
  };

  const handleToggleInboxStatus = (inboxId: string) => {
    setInboxes((prev) =>
      prev.map((i) =>
        i.id === inboxId
          ? { ...i, status: i.status === 'Active' ? 'Paused (Bounce)' : 'Active' }
          : i
      )
    );
  };

  const handleAddExclusion = (
    kind: 'domains' | 'companies' | 'emails',
    value: string
  ) => {
    setExclusions((prev) => {
      if (prev[kind].some((v) => v.toLowerCase() === value.toLowerCase())) return prev;
      return { ...prev, [kind]: [value, ...prev[kind]] };
    });
  };

  const handleRemoveExclusion = (
    kind: 'domains' | 'companies' | 'emails',
    value: string
  ) => {
    setExclusions((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((v) => v !== value),
    }));
  };

  const navItems: Array<{
    id: NavView;
    label: string;
    icon: React.ReactNode;
    meta?: string;
  }> = [
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: <Layers className="h-4 w-4" />,
      meta: String(leads.length),
    },
    {
      id: 'dispatch',
      label: 'Dispatch 100',
      icon: <Send className="h-4 w-4" />,
      meta: `${kpis.safeCapacity}/d`,
    },
    {
      id: 'buyers',
      label: 'Buyers',
      icon: <Briefcase className="h-4 w-4" />,
      meta: `${buyers.length}`,
    },
    {
      id: 'agreements',
      label: 'Agreements & Setup',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'replies',
      label: 'Replies & Bumps',
      icon: <MessageSquareReply className="h-4 w-4" />,
      meta: String(kpis.positiveReplies + kpis.dueFollowUps),
    },
    {
      id: 'verticals',
      label: 'Niches & Sources',
      icon: <Compass className="h-4 w-4" />,
      meta: '10+1',
    },
    {
      id: 'analytics',
      label: 'KPI Audit',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 'website',
      label: 'Website',
      icon: <Globe className="h-4 w-4" />,
    },
  ];

  const renderSidebarNav = () => (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="font-display text-lg font-bold tracking-tight text-[#0F2342] whitespace-nowrap">
            Keystone Deal Partners
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Multi-Niche Outreach OS
          </div>
        </div>

        <nav aria-label="Workspace Navigation" className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F2342] text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.meta && (
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {item.meta}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Compact Daily Quota Summary */}
      <div className="border-t border-slate-200 px-5 py-4 text-xs">
        <div className="font-semibold text-slate-800">Daily 100 Split Target</div>
        <div className="mt-2 space-y-1 text-slate-600">
          {allocations.map((a) => (
            <div key={a.verticalId} className="flex items-center justify-between">
              <span className="truncate">{VERTICAL_MAP[a.verticalId].shortName}</span>
              <span className="font-mono tabular-nums text-slate-900">
                {a.targetCount}/d
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[252px] shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{renderSidebarNav()}</div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-[264px] border-r border-slate-200 bg-white shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="rounded p-2 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderSidebarNav()}
          </div>
          <button
            type="button"
            aria-label="Dismiss navigation backdrop"
            className="flex-1 bg-slate-900/35"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Breadcrumb Left — Global Vertical Filter & Primary Action Right */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="hidden text-slate-500 sm:inline">Keystone OS</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <h1 className="font-display text-base font-semibold text-[#0F2342] truncate">
                {VIEW_TITLES[activeView]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {(activeView === 'pipeline' || activeView === 'buyers') && (
              <select
                aria-label="Filter by vertical"
                value={verticalFilter}
                onChange={(e) => setVerticalFilter(e.target.value as VerticalId | 'ALL')}
                className="hidden sm:block max-w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#0F2342] focus:outline-none"
              >
                <option value="ALL">All 11 Verticals</option>
                {VERTICALS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.shortName} ({v.pilotStatus})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2342] px-3 py-2 sm:px-4 text-xs font-semibold text-white hover:bg-[#173461] whitespace-nowrap shrink-0"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="sm:hidden">Import CSV</span>
              <span className="hidden sm:inline">Import Leads CSV</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
          {activeView === 'pipeline' && (
            <div className="space-y-6">
              {/* 4-Column Executive KPI Row */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">Eligible Ready Targets</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
                    {kpis.eligibleReady}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Verified personal owner emails · zero deal-killers
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">Active Replies &amp; Intros</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
                    {kpis.positiveReplies}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {kpis.dueFollowUps} due for Day +4 / Day +10 bump
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">Signed Buyer Mandates</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
                    {kpis.signedBuyers} / {buyers.length}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Tier-1 PE · Tier-2 FO · Tier-3 Funded Searchers
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">Safe Multi-Inbox Capacity</div>
                  <div className="mt-1 font-mono text-2xl font-semibold text-[#0F2342] tabular-nums">
                    {kpis.safeCapacity}/day
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    10 warmed secondary inboxes · primary protected
                  </div>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      aria-label="Search targets"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search company, owner, city, vertical..."
                      className="w-64 rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-[#0F2342] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1">
                    {(
                      [
                        ['ALL', 'All'],
                        ['ELIGIBLE', 'Eligible Ready'],
                        ['NEEDS_VERIFY', `Needs Verification (${unverifiedLeads.length})`],
                        ['ACTIVE_REPLIES', 'Positive Replies'],
                        ['BLOCKED', 'Blocked / Hold'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEligibilityFilter(key)}
                        className={`rounded px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                          eligibilityFilter === key
                            ? 'bg-white text-[#0F2342] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportMillionVerifier}
                    disabled={unverifiedLeads.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#0F2342]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F2342] hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export for MillionVerifier ({unverifiedLeads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F2342] hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Target
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('dispatch')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Build 100/Day Batch
                  </button>
                </div>
              </div>

              {/* High-Density Multi-Niche Targets Data Grid */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="px-5 py-3 font-semibold">Target Company &amp; Credentials</th>
                      <th className="px-4 py-3 font-semibold">Vertical &amp; Geo</th>
                      <th className="px-4 py-3 font-semibold">Owner &amp; Direct Email</th>
                      <th className="px-4 py-3 text-right font-semibold">Est. Scale</th>
                      <th className="px-4 py-3 font-semibold">Primary Buyer Match</th>
                      <th className="px-4 py-3 text-right font-semibold">Score</th>
                      <th className="px-5 py-3 text-right font-semibold">Stage &amp; Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPipelineLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                          No targets match your active filters. Reset filters or import a registry CSV.
                        </td>
                      </tr>
                    ) : (
                      filteredPipelineLeads.map((lead) => {
                        const v = VERTICAL_MAP[lead.verticalId];
                        const score = calculateRetirementScore(lead.signals).score;
                        const elig = evaluateLeadEligibility(lead, exclusions);
                        const matches = routeLeadToBuyers(lead, buyers);
                        const topMatch = matches[0];

                        return (
                          <tr
                            key={lead.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-slate-900">{lead.company}</div>
                              <div className="mt-0.5 text-slate-500">
                                {lead.foundedYear > 0 ? `Est. ${lead.foundedYear}` : 'Founded Unverified'} · {lead.credentialTag}
                                {lead.ownsRealEstate ? ' · Owns RE' : ''}
                              </div>
                              {!elig.eligible && (
                                <div className="mt-0.5 font-medium text-red-700">
                                  Blocked: {elig.blockers[0]}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="font-medium text-slate-800">{v.shortName}</div>
                              <div className="text-slate-500">
                                {lead.city}, {lead.state}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-medium text-slate-900">{lead.ownerName}</div>
                              <div className="font-mono text-slate-600">
                                {lead.email || (
                                  <span className="text-amber-700">
                                    Unverified · {lead.domain || 'Verify domain'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap">
                              {lead.estRevenueM > 0 ? (
                                <>
                                  <div className="font-medium text-slate-900">
                                    ${lead.estRevenueM.toFixed(1)}M Rev
                                  </div>
                                  <div className="text-slate-500">
                                    ${lead.estEbitdaM.toFixed(2)}M EBITDA
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-medium text-slate-500">Unverified</div>
                                  <div className="text-slate-400">Screen scale</div>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {topMatch ? (
                                <>
                                  <div className="font-medium text-slate-900">
                                    {topMatch.buyer.firmName}
                                  </div>
                                  <div className="text-slate-500">
                                    {topMatch.priorityLabel} · {matches.length} total fit
                                  </div>
                                </>
                              ) : (
                                <span className="text-amber-700">Add Buyer Mandate</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#0F2342] whitespace-nowrap">
                              {score}/6
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className={`font-medium ${
                                    [
                                      'Replied — Positive',
                                      'Call Booked',
                                      'NDA / Buyer Intro',
                                      'LOI',
                                    ].includes(lead.stage)
                                      ? 'text-emerald-700'
                                      : lead.stage === 'Excluded' || !elig.eligible
                                        ? 'text-red-700'
                                        : 'text-slate-600'
                                  }`}
                                >
                                  {lead.stage}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLeadId(lead.id)}
                                  aria-label={`Inspect ${lead.company}`}
                                  className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#0F2342] hover:bg-slate-50"
                                >
                                  Inspect
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'dispatch' && (
            <Dispatch100View
              leads={leads}
              inboxes={inboxes}
              buyers={buyers}
              exclusions={exclusions}
              allocations={allocations}
              onChangeAllocation={handleChangeAllocation}
              onToggleInboxStatus={handleToggleInboxStatus}
              onMarkBatchSent={handleMarkBatchSent}
            />
          )}

          {activeView === 'buyers' && (
            <BuyersView
              buyers={buyers}
              selectedVerticalFilter={verticalFilter}
              onAddBuyer={handleAddBuyer}
              onUpdateBuyerStatus={handleUpdateBuyerStatus}
              onDraftAgreement={(buyerId) => {
                setDraftAgreementBuyerId(buyerId);
                setActiveView('agreements');
              }}
            />
          )}

          {activeView === 'agreements' && (
            <AgreementsSetupView
              buyers={buyers}
              initialBuyerId={draftAgreementBuyerId}
            />
          )}

          {activeView === 'replies' && (
            <FollowUpsRepliesView
              leads={leads}
              buyers={buyers}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onUpdateStage={handleUpdateStage}
            />
          )}

          {activeView === 'verticals' && (
            <VerticalsRegistryView
              onSelectVerticalInPipeline={(vid) => {
                setVerticalFilter(vid);
                setActiveView('pipeline');
              }}
            />
          )}

          {activeView === 'analytics' && (
            <AnalyticsAuditView
              leads={leads}
              exclusions={exclusions}
              onAddExclusion={handleAddExclusion}
              onRemoveExclusion={handleRemoveExclusion}
            />
          )}

          {activeView === 'website' && <WebsitePreviewView />}
        </main>
      </div>

      {/* Drawers & Modals */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          buyers={buyers}
          exclusions={exclusions}
          onClose={() => setSelectedLeadId(null)}
          onUpdateLead={handleUpdateLead}
        />
      )}

      {showCsvModal && (
        <CsvImportModal
          existingLeads={leads}
          exclusions={exclusions}
          onImport={handleImportLeads}
          onClose={() => setShowCsvModal(false)}
        />
      )}

      {showAddLeadModal && (
        <AddLeadModal
          onAdd={handleAddLead}
          onClose={() => setShowAddLeadModal(false)}
        />
      )}
    </div>
  );
}
