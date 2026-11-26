import {
  BuyerMandate,
  DailySplitAllocation,
  DispatchAssignment,
  EmailAngle,
  ExclusionRules,
  LeadEligibilityResult,
  RankedBuyerMatch,
  ScoreSignals,
  SellerLead,
  SendingInbox,
  VerticalAnalyticsRow,
  VerticalId,
} from '../types/os';
import { VERTICALS, VERTICAL_MAP } from '../data/verticals';

const ROLE_INBOX_PREFIXES = new Set([
  'info',
  'service',
  'office',
  'contact',
  'csr',
  'admin',
  'hr',
  'customerservice',
  'support',
  'sales',
  'hello',
  'dispatch',
  'mail',
  'billing',
  'accounting',
  'parts',
  'estimates',
]);

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
}

export function isDirectNamedEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1].includes('.')) return false;
  return !ROLE_INBOX_PREFIXES.has(parts[0]);
}

export function calculateRetirementScore(signals: ScoreSignals): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if (signals.founded1996OrEarlier) {
    score += 1;
    reasons.push('+1 founded <=1996');
  }
  if (signals.livingFounderStillOwner) {
    score += 1;
    reasons.push('+1 founder still owner');
  }
  if (signals.thirtyPlusYearTrackRecord) {
    score += 1;
    reasons.push('+1 30+ yr track record');
  }
  if (signals.familyOwnedNoSuccessorNamed) {
    score += 1;
    reasons.push('+1 no named successor');
  }
  if (signals.smallFounderRunTeam) {
    score += 1;
    reasons.push('+1 10-60 team size');
  }
  if (signals.founderNameInCompany) {
    score += 1;
    reasons.push('+1 founder name in company');
  }
  if (signals.nextGenAlreadyInCharge) {
    score -= 1;
    reasons.push('-1 next-gen already leading');
  }

  return { score, reasons };
}

export function isExcludedLead(
  lead: Pick<SellerLead, 'company' | 'domain' | 'website' | 'email'>,
  exclusions: ExclusionRules
): boolean {
  const domain = normalizeDomain(lead.domain || lead.website || '');
  const company = lead.company.trim().toLowerCase();
  const email = lead.email.trim().toLowerCase();

  if (domain && exclusions.domains.some((d) => normalizeDomain(d) === domain)) {
    return true;
  }
  if (company && exclusions.companies.some((c) => c.trim().toLowerCase() === company)) {
    return true;
  }
  if (email && exclusions.emails.some((e) => e.trim().toLowerCase() === email)) {
    return true;
  }
  return false;
}

export function evaluateLeadEligibility(
  lead: SellerLead,
  exclusions: ExclusionRules
): LeadEligibilityResult {
  const blockers: string[] = [];

  if (lead.stage === 'Excluded') {
    blockers.push('Marked Excluded');
  }
  if (isExcludedLead(lead, exclusions)) {
    blockers.push('Matches Exclusion List (domain/company/email)');
  }
  if (!lead.email.trim()) {
    blockers.push('Needs owner email — export for MillionVerifier / Clay enrichment');
  } else if (!isDirectNamedEmail(lead.email)) {
    blockers.push('Role or invalid inbox (blocked to protect reply rate)');
  }
  if (lead.emailVerification === 'Unverified' || lead.emailVerification === 'Invalid') {
    blockers.push(`Email ${lead.emailVerification} (verify before send to hold bounce <1.5%)`);
  }
  if (lead.dealKillerFlags.length > 0) {
    blockers.push(`Deal-killer flag: ${lead.dealKillerFlags.join('; ')}`);
  }

  return {
    eligible: blockers.length === 0,
    blockers,
  };
}

export function routeLeadToBuyers(
  lead: SellerLead,
  buyers: BuyerMandate[]
): RankedBuyerMatch[] {
  const leadState = lead.state.trim().toUpperCase();
  const matches: Array<{ score: number; match: RankedBuyerMatch }> = [];

  for (const buyer of buyers) {
    if (!buyer.verticals.includes(lead.verticalId)) continue;

    const stateOk =
      buyer.states.includes('ALL') || buyer.states.includes(leadState);
    if (!stateOk) continue;

    const scaleUnknown = lead.estRevenueM === 0 && lead.estEbitdaM === 0;
    const ebitdaFits =
      lead.estEbitdaM >= buyer.minEbitdaM * 0.85 &&
      lead.estEbitdaM <= buyer.maxEbitdaM;
    const revFits = lead.estRevenueM >= buyer.minRevenueM * 0.85;

    if (!scaleUnknown && !ebitdaFits && !revFits) continue;

    let warningNote: string | undefined;
    if (lead.isOnMarket && !buyer.allowsListedDeals) {
      warningNote = `${buyer.firmName} pays $0 on listed/brokered deals — require written co-broker split or pivot.`;
    } else if (scaleUnknown) {
      warningNote = `Revenue/EBITDA unverified — confirm scale ($${buyer.minEbitdaM}M+ EBITDA) before buyer intro.`;
    } else if (lead.estRevenueM < buyer.minRevenueM) {
      warningNote = `Slightly below $${buyer.minRevenueM.toFixed(1)}M rev floor — pitch as tuck-in or route to Tier-3 searcher.`;
    }

    let rankScore = 0;
    if (buyer.agreementStatus === 'Signed') rankScore += 40;
    else if (buyer.agreementStatus === 'In Redline') rankScore += 25;
    else if (buyer.agreementStatus === 'Pitched') rankScore += 12;

    if (buyer.tier === 'TIER_1_PLATFORM') rankScore += 30;
    else if (buyer.tier === 'TIER_2_LMM_PE_FO') rankScore += 22;
    else if (buyer.tier === 'TIER_3_FUNDED_SEARCHER') rankScore += 18;
    else rankScore += 10;

    if (lead.isOnMarket && !buyer.allowsListedDeals) rankScore -= 50;
    if (lead.estRevenueM >= buyer.minRevenueM && lead.estEbitdaM >= buyer.minEbitdaM) {
      rankScore += 15;
    }

    // Special priority: Tier-3 Funded Searchers jump ahead when deal is confirmed <$4.5M rev / <$1.1M EBITDA
    if (
      !scaleUnknown &&
      buyer.tier === 'TIER_3_FUNDED_SEARCHER' &&
      lead.estEbitdaM < 1.1 &&
      lead.estRevenueM < 4.5
    ) {
      rankScore += 20;
    }

    const priorityLabel: RankedBuyerMatch['priorityLabel'] =
      buyer.tier === 'TIER_1_PLATFORM'
        ? 'Primary Mandate'
        : buyer.tier === 'TIER_2_LMM_PE_FO'
          ? 'Tier-2 Backup'
          : buyer.tier === 'TIER_3_FUNDED_SEARCHER'
            ? 'Tier-3 Monetization'
            : 'Alternate Fit';

    matches.push({
      score: rankScore,
      match: {
        buyer,
        priorityLabel,
        matchReason: `${buyer.agreementStatus} · ${buyer.feeStructure} · $${buyer.minEbitdaM}M–$${buyer.maxEbitdaM}M EBITDA box`,
        warningNote,
      },
    });
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .map((m) => m.match);
}

export function getFirstName(fullName: string): string {
  const cleaned = fullName
    .replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '')
    .trim();
  return cleaned.split(/[\s,&/]+/)[0] || 'there';
}

export function buildSellerSubject(
  lead: SellerLead,
  angle: EmailAngle = 'REAL_ESTATE_LEGACY'
): string {
  const shortComp = lead.company.replace(/\b(inc\.?|llc|co\.?|corp\.?)\b/gi, '').trim();
  if (angle === 'TECHNICAL_VALUATION') {
    return `${shortComp} — confidential inquiry`;
  }
  return `Quick question regarding ${shortComp}`;
}

export function buildSellerEmail1PlainText(
  lead: SellerLead,
  angle: EmailAngle = 'REAL_ESTATE_LEGACY',
  senderName = 'Roohan Tariq',
  senderPhone = ''
): string {
  const first = getFirstName(lead.ownerName);
  const vertical = VERTICAL_MAP[lead.verticalId];
  const shortComp = lead.company.replace(/\b(inc\.?|llc|co\.?|corp\.?)\b/gi, '').trim();
  const phoneLine = senderPhone.trim() ? ` | ${senderPhone.trim()}` : '';

  if (angle === 'TECHNICAL_VALUATION') {
    return [
      `Hi ${first},`,
      '',
      `Saw ${shortComp}'s ${lead.credentialTag || vertical.credentialLabel} footprint in ${lead.city}, ${lead.state} — there are very few independent teams left with that level of technical depth.`,
      '',
      `I represent a small group of experienced industry buyers (not a broad broker blast) looking to acquire 1-2 established ${vertical.buyerDescriptor} businesses doing roughly ${vertical.typicalRevenueRange} in revenue. Our buyer pays our fee in full (zero broker commission to you), keeps existing leadership and technicians intact, and structures around your timeline.`,
      '',
      `No pressure at all if timing isn't right, but if you've ever wondered what ${shortComp} would realistically command in today's private market (${vertical.ebitdaMultipleRange} EBITDA comps), I'd be glad to share a quiet ballpark range on a 10-minute call.`,
      '',
      `Open to connecting briefly next week?`,
      '',
      `Best,`,
      `${senderName}`,
      `Keystone Deal Partners${phoneLine}`,
      `keystonedealpartners.com`,
    ].join('\n');
  }

  const realEstateClause = lead.ownsRealEstate
    ? 'let owners either exit cleanly or keep their real estate on a 10-year triple-net (NNN) lease for ongoing retirement income'
    : 'let owners either transition out over 6-12 months or take 75-80% liquidity now while keeping their team intact';

  return [
    `Hi ${first},`,
    '',
    `I'm reaching out directly because I represent a well-capitalized private buyer looking to partner with one established ${vertical.buyerDescriptor} in ${lead.state}.`,
    '',
    `They aren't a typical consolidator looking to rebrand your trucks or cut staff — they keep the local company name, invest in technician recruiting, and ${realEstateClause}.`,
    '',
    `Because our buyer covers all advisory fees (zero broker commission to you), most owners we speak with start with a quiet 10-minute call just to see a confidential ballpark valuation range based on recent ${vertical.shortName} transactions in your region.`,
    '',
    `Even if a transition is 12-24 months out, would you be open to a brief confidential conversation next week?`,
    '',
    `Best regards,`,
    `${senderName}`,
    `Keystone Deal Partners${phoneLine}`,
    `keystonedealpartners.com`,
  ].join('\n');
}

export function buildFollowUpDay4PlainText(
  lead: SellerLead,
  senderName = 'Roohan Tariq'
): string {
  const first = getFirstName(lead.ownerName);
  const vertical = VERTICAL_MAP[lead.verticalId];
  const shortComp = lead.company.replace(/\b(inc\.?|llc|co\.?|corp\.?)\b/gi, '').trim();

  const secondAngle = lead.ownsRealEstate
    ? `One detail I forgot to mention: if you own ${shortComp}'s facility, our buyer is very comfortable acquiring only the operating business while signing a long-term NNN lease with you — giving you liquidity plus ongoing rental income.`
    : `One detail worth adding: our buyer also backs partial-liquidity setups (taking 70-80% off the table now while offloading HR, recruiting, and compliance headaches to support your #2 manager).`;

  return [
    `${first} — just bubbling this back up in case it got buried during a busy week.`,
    '',
    secondAngle,
    '',
    `Most ${vertical.shortName} founders we work with start with a 10-minute off-the-record call 6-12 months before they are ready, just to get a realistic number on paper with zero broker fee.`,
    '',
    `Open to a quick call next week, or just reply "not now" and I won't crowd your inbox.`,
    '',
    `Best,`,
    `${senderName}`,
    `Keystone Deal Partners`,
  ].join('\n');
}

export function buildFollowUpDay10PlainText(
  lead: SellerLead,
  senderName = 'Roohan Tariq'
): string {
  const first = getFirstName(lead.ownerName);
  const shortComp = lead.company.replace(/\b(inc\.?|llc|co\.?|corp\.?)\b/gi, '').trim();

  return [
    `Hi ${first},`,
    '',
    `Last note from me so I don't clutter your inbox.`,
    '',
    `If you'd ever like a quiet, no-obligation valuation benchmark for ${shortComp} — or want to see how a deal keeping your team and local name intact would look down the road — just reply "later" and I'll check back in 6 months.`,
    '',
    `Wishing you and the team at ${shortComp} a strong finish to the year.`,
    '',
    `Best,`,
    `${senderName}`,
    `Keystone Deal Partners`,
  ].join('\n');
}

export function buildLinkedInNote(lead: SellerLead): string {
  const first = getFirstName(lead.ownerName);
  const vertical = VERTICAL_MAP[lead.verticalId];
  const shortComp = lead.company.replace(/\b(inc\.?|llc|co\.?|corp\.?)\b/gi, '').trim();
  const years = new Date().getFullYear() - lead.foundedYear;
  const track = years >= 25 ? `${years}+ yr` : 'established';
  const note = `Hi ${first} — came across ${shortComp} in ${lead.city}, ${lead.state} and respect the ${track} ${vertical.shortName} business you've built. Always glad to connect directly with independent trade founders here. - Roohan`;
  return note.length <= 290 ? note : `${note.slice(0, 287).trimEnd()}...`;
}

export function buildBuyerPitchEmail(buyer: BuyerMandate): {
  subject: string;
  body: string;
} {
  const primaryVert = VERTICAL_MAP[buyer.verticals[0]];
  return {
    subject: `proprietary ${primaryVert.shortName} add-ons ($${buyer.minEbitdaM}M–$${buyer.maxEbitdaM}M EBITDA) — Keystone Deal Partners`,
    body: [
      `Hi ${buyer.contactName},`,
      '',
      `Saw ${buyer.firmName}'s activity in ${primaryVert.name} — specifically ${buyer.recentAddonExample}.`,
      '',
      `We run a dedicated buy-side origination desk (Keystone Deal Partners) sourcing strictly off-market US commercial, mechanical, and industrial service businesses directly from retiring founders. We are launching a dedicated origination campaign targeting independent ${primaryVert.shortName} owners (${primaryVert.typicalRevenueRange} rev / $${buyer.minEbitdaM}M–$${buyer.maxEbitdaM}M EBITDA).`,
      '',
      `No retainers and no broad auctions — purely success-fee based (${buyer.feeStructure}), pre-filtered for your exact deal-killers, with a simple 48-hour active-dialogue carve-out.`,
      '',
      `Are you open to a quick 10-minute call Thursday or Friday to confirm your current add-on criteria and get a standard non-exclusive fee agreement in place before we launch next week's batch?`,
      '',
      `Best,`,
      `Roohan Tariq`,
      `Founder, Keystone Deal Partners`,
      `keystonedealpartners.com`,
    ].join('\n'),
  };
}

export function buildBlindTeaser(lead: SellerLead): string {
  const vertical = VERTICAL_MAP[lead.verticalId];
  const regionMap: Record<string, string> = {
    TX: 'South Central US',
    LA: 'Gulf South',
    FL: 'Southeast US',
    GA: 'Southeast US',
    NC: 'Southeast US',
    SC: 'Southeast US',
    TN: 'Mid-South',
    AL: 'Southeast US',
    VA: 'Mid-Atlantic',
    MD: 'Mid-Atlantic',
    PA: 'Mid-Atlantic',
    OH: 'Midwest US',
    IN: 'Midwest US',
    MI: 'Midwest US',
    IL: 'Midwest US',
    CO: 'Mountain West',
  };
  const region = regionMap[lead.state.toUpperCase()] || 'US Regional Market';
  const age = new Date().getFullYear() - lead.foundedYear;

  return [
    `CONFIDENTIAL NO-NAME ACQUISITION PROFILE — PROJECT ${lead.id.toUpperCase()}`,
    `Prepared by Keystone Deal Partners (Strictly Off-Market | Buyer-Paid Fee)`,
    `---------------------------------------------------------------------`,
    `Sector:           ${vertical.name}`,
    `Geography:        ${region} (Exact metro disclosed upon executed NDA)`,
    `Operating History:${age}+ years (founder-owned, retirement transition)`,
    `Scale (Est.):     ~$${lead.estRevenueM.toFixed(1)}M Revenue | ~$${lead.estEbitdaM.toFixed(2)}M Adjusted EBITDA`,
    `Team Profile:     ${lead.teamSize}`,
    `Credentials:      ${lead.credentialTag}`,
    `Real Estate:      ${lead.ownsRealEstate ? 'Facility owned by founder — available via 10-yr NNN lease or sale' : 'Leased operating facility'}`,
    `Seller Posture:   Confidential off-market dialogue active; no sell-side broker engaged`,
    `---------------------------------------------------------------------`,
    `Next Step: Confirm buy-box interest & 48-hour prior-contact check to receive NDA and seller intro.`,
  ].join('\n');
}

export function allocateDailyBatch100(
  leads: SellerLead[],
  inboxes: SendingInbox[],
  buyers: BuyerMandate[],
  exclusions: ExclusionRules,
  allocations: DailySplitAllocation[],
  angle: EmailAngle = 'REAL_ESTATE_LEGACY'
): {
  assignments: DispatchAssignment[];
  healthyInboxes: SendingInbox[];
  pausedInboxes: SendingInbox[];
  totalSafeCapacity: number;
} {
  const pausedInboxes = inboxes.filter(
    (i) => i.status === 'Paused (Bounce)' || i.bounceRatePct >= 2.0
  );
  const healthyInboxes = inboxes.filter(
    (i) =>
      i.status === 'Active' &&
      i.warmupDay >= 14 &&
      i.bounceRatePct < 2.0 &&
      i.spfOk &&
      i.dkimOk &&
      i.dmarcOk
  );

  const totalSafeCapacity = healthyInboxes.reduce(
    (sum, i) => sum + Math.max(0, i.dailyColdCap),
    0
  );

  if (healthyInboxes.length === 0) {
    return { assignments: [], healthyInboxes, pausedInboxes, totalSafeCapacity: 0 };
  }

  const eligibleReadyLeads = leads
    .filter(
      (l) =>
        (l.stage === 'Ready' || l.stage === 'Queued') &&
        evaluateLeadEligibility(l, exclusions).eligible
    )
    .sort((a, b) => {
      const scoreDiff =
        calculateRetirementScore(b.signals).score -
        calculateRetirementScore(a.signals).score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.foundedYear - b.foundedYear;
    });

  const selectedLeads: SellerLead[] = [];
  const usedIds = new Set<string>();

  for (const alloc of allocations) {
    if (alloc.targetCount <= 0) continue;
    const pool = eligibleReadyLeads.filter(
      (l) => l.verticalId === alloc.verticalId && !usedIds.has(l.id)
    );
    const slice = pool.slice(0, alloc.targetCount);
    for (const l of slice) {
      selectedLeads.push(l);
      usedIds.add(l.id);
    }
  }

  // Round-robin assignment with ESP matching preference & per-inbox daily cap enforcement
  const usageByInbox = new Map<string, number>();
  healthyInboxes.forEach((i) => usageByInbox.set(i.id, 0));

  const assignments: DispatchAssignment[] = [];
  const baseMinutes = 10 * 60; // 10:00 AM ET

  selectedLeads.forEach((lead, idx) => {
    const preferredProvider =
      lead.recipientEsp === 'Microsoft365' ? 'Microsoft 365' : 'Google Workspace';

    const candidates = healthyInboxes
      .filter((inb) => (usageByInbox.get(inb.id) ?? 0) < inb.dailyColdCap)
      .sort((a, b) => {
        const aMatch = a.provider === preferredProvider ? 0 : 1;
        const bMatch = b.provider === preferredProvider ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return (usageByInbox.get(a.id) ?? 0) - (usageByInbox.get(b.id) ?? 0);
      });

    if (candidates.length === 0) return;
    const chosen = candidates[0];
    const used = usageByInbox.get(chosen.id) ?? 0;
    usageByInbox.set(chosen.id, used + 1);

    // Spread across 10:00 AM - 1:00 PM ET (180 min window)
    const offsetMin = Math.floor((idx * 180) / Math.max(1, selectedLeads.length));
    const totalMin = baseMinutes + offsetMin;
    const hr = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    const suffix = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr > 12 ? hr - 12 : hr;
    const sendWindowEt = `${hr12}:${String(min).padStart(2, '0')} ${suffix} ET`;

    const routed = routeLeadToBuyers(lead, buyers);
    const primaryBuyer = routed[0]?.buyer.firmName || 'Unassigned — Add Buyer';

    assignments.push({
      lead,
      inbox: chosen,
      sendWindowEt,
      subject: buildSellerSubject(lead, angle),
      email1PlainText: buildSellerEmail1PlainText(lead, angle),
      followupDay4PlainText: buildFollowUpDay4PlainText(lead),
      followupDay10PlainText: buildFollowUpDay10PlainText(lead),
      primaryBuyer,
      retirementScore: calculateRetirementScore(lead.signals).score,
    });
  });

  return { assignments, healthyInboxes, pausedInboxes, totalSafeCapacity };
}

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildSmartleadCsv(assignments: DispatchAssignment[]): string {
  const headers = [
    'email',
    'first_name',
    'last_name',
    'company_name',
    'city',
    'state',
    'vertical',
    'retirement_score',
    'primary_buyer',
    'assigned_sender_inbox',
    'send_window_et',
    'subject_line',
    'email_1_plain_text',
    'followup_day4_plain_text',
    'followup_day10_plain_text',
    'linkedin_note',
  ];

  const rows = assignments.map((a) => {
    const nameParts = a.lead.ownerName.trim().split(/\s+/);
    const first = getFirstName(a.lead.ownerName);
    const last = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    return [
      a.lead.email,
      first,
      last,
      a.lead.company,
      a.lead.city,
      a.lead.state,
      VERTICAL_MAP[a.lead.verticalId].shortName,
      a.retirementScore,
      a.primaryBuyer,
      a.inbox.email,
      a.sendWindowEt,
      a.subject,
      a.email1PlainText,
      a.followupDay4PlainText,
      a.followupDay10PlainText,
      buildLinkedInNote(a.lead),
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function buildPlainTextEml(
  toName: string,
  toEmail: string,
  subject: string,
  body: string
): string {
  const safeName = toName.replace(/"/g, '');
  return [
    `To: "${safeName}" <${toEmail.trim()}>`,
    `Subject: ${subject}`,
    'X-Unsent: 1',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    body.replace(/\r?\n/g, '\r\n'),
    '',
  ].join('\r\n');
}

export function buildMillionVerifierExportCsv(leads: SellerLead[]): string {
  const headers = [
    'company_name',
    'vertical',
    'city',
    'state',
    'domain',
    'website',
    'founded_year',
    'credential_tag',
    'owner_name',
    'current_email',
    'verification_status',
    'data_source',
    'notes',
  ];

  const rows = leads.map((lead) =>
    [
      lead.company,
      VERTICAL_MAP[lead.verticalId].shortName,
      lead.city,
      lead.state,
      lead.domain || normalizeDomain(lead.website),
      lead.website,
      lead.foundedYear > 0 ? lead.foundedYear : '',
      lead.credentialTag,
      lead.ownerName,
      lead.email,
      lead.emailVerification,
      lead.dataSource,
      lead.notes,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\r\n');
}

export function buildBuySideFeeAgreementText(params: {
  buyerName: string;
  sponsorName: string;
  signatoryName: string;
  signatoryTitle: string;
  targetVerticalsLabel: string;
  minEbitdaM: number;
  maxEbitdaM: number;
  feePreset: 'LEHMAN_321' | 'DOUBLE_LEHMAN' | 'FLAT_3_PCT';
  minimumFeeK: number;
  tailMonths: number;
  carveOutBusinessHours: number;
  governingState: string;
  effectiveDate: string;
}): string {
  const feeClause =
    params.feePreset === 'LEHMAN_321'
      ? [
          '  - 3.0% of the first $5,000,000 of Aggregate Transaction Value;',
          '  - 2.0% of Aggregate Transaction Value between $5,000,001 and $15,000,000;',
          '  - 1.0% of Aggregate Transaction Value above $15,000,000;',
        ].join('\n')
      : params.feePreset === 'DOUBLE_LEHMAN'
        ? [
            '  - 5.0% of the first $2,000,000 of Aggregate Transaction Value;',
            '  - 4.0% of Aggregate Transaction Value between $2,000,001 and $4,000,000;',
            '  - 3.0% of Aggregate Transaction Value between $4,000,001 and $6,000,000;',
            '  - 2.0% of Aggregate Transaction Value between $6,000,001 and $8,000,000;',
            '  - 1.0% of Aggregate Transaction Value above $8,000,000;',
          ].join('\n')
        : '  - A flat success fee equal to 3.0% of Aggregate Transaction Value;';

  const buyerLabel = params.buyerName.trim() || '[BUYER LEGAL ENTITY]';
  const sponsorLine = params.sponsorName.trim()
    ? ` (an affiliate/portfolio company of ${params.sponsorName.trim()})`
    : '';
  const minFeeFormatted = `$${Math.max(0, Math.round(params.minimumFeeK)).toLocaleString('en-US')},000`;

  return [
    '===============================================================================',
    'NON-EXCLUSIVE BUY-SIDE M&A ORIGINATION & SUCCESS FEE AGREEMENT',
    '[TEMPLATE FOR ATTORNEY REVIEW — NOT LEGAL ADVICE]',
    '===============================================================================',
    '',
    `Effective Date: ${params.effectiveDate}`,
    '',
    `This Non-Exclusive Buy-Side M&A Origination Agreement ("Agreement") is entered into`,
    `by and between Keystone Deal Partners ("Advisor") and ${buyerLabel}${sponsorLine}`,
    `("Buyer").`,
    '',
    '1. NON-EXCLUSIVE ENGAGEMENT & TARGET CRITERIA',
    `   Buyer engages Advisor on a non-exclusive, success-fee-only basis ($0 monthly`,
    `   retainer) to identify, pre-qualify, and introduce strictly off-market acquisition`,
    `   candidates ("Targets") operating in ${params.targetVerticalsLabel} with estimated`,
    `   Adjusted EBITDA between $${params.minEbitdaM.toFixed(2)}M and $${params.maxEbitdaM.toFixed(2)}M.`,
    '   Nothing herein restricts Advisor from presenting non-accepted Targets to other',
    '   buyers or restricts Buyer from sourcing acquisitions independently.',
    '',
    '2. SUCCESS FEE SCHEDULE & MINIMUM FEE',
    '   If Buyer (or any affiliate, portfolio company, or controlled entity of Buyer)',
    '   consummates an acquisition, merger, asset purchase, recapitalization, or majority',
    '   equity investment ("Transaction") with an Introduced Target, Buyer shall pay',
    '   Advisor a cash Success Fee at Closing by wire transfer equal to the greater of:',
    feeClause,
    `   or a Minimum Success Fee of ${minFeeFormatted} (${minFeeFormatted} floor).`,
    '   "Aggregate Transaction Value" includes cash paid at closing, assumed interest-',
    '   bearing debt, seller notes, rollover equity, and contingent earn-outs (with the',
    '   fee portion attributable to earn-outs payable pro-rata as earn-outs are paid).',
    '   Real estate purchased alongside the operating entity is excluded from Aggregate',
    '   Transaction Value unless explicitly requested and negotiated by Buyer.',
    '',
    `3. ${params.carveOutBusinessHours}-HOUR ACTIVE DIALOGUE CARVE-OUT (PRIOR CONTACT RULE)`,
    '   Advisor will disclose each Target name in writing via email ("Introduction Notice").',
    `   A Target shall be deemed an "Introduced Target" unless Buyer notifies Advisor in`,
    `   writing within ${params.carveOutBusinessHours} business hours of receipt of the Introduction Notice that`,
    '   Buyer has engaged in documented, two-way substantive written or verbal M&A',
    '   dialogue directly with the Target\'s owner(s) within the preceding six (6) months.',
    '   For clarity: passive CRM records, purchased lead lists, unanswered cold emails,',
    '   general trade-show encounters, or third-party broker blasts do NOT constitute',
    '   prior active dialogue and shall not exclude Advisor\'s Success Fee.',
    '',
    `4. ${params.tailMonths}-MONTH FEE TAIL & NON-CIRCUMVENTION`,
    `   Buyer\'s obligation to pay the Success Fee shall survive termination of this`,
    `   Agreement for twenty-four (${params.tailMonths}) months following the date of the Introduction`,
    '   Notice for any Introduced Target. Buyer agrees not to circumvent Advisor by',
    '   contacting an Introduced Target directly without Advisor\'s written acknowledgment',
    '   after receiving a confidential no-name profile or Introduction Notice.',
    '',
    '5. CONFIDENTIALITY & SELLER PRIVACY',
    '   Buyer shall hold all Target identities, financials, and owner communications in',
    '   strict confidence and shall not contact any Target employees, customers, vendors,',
    '   or lenders without prior written consent from the Target\'s owner.',
    '',
    '6. TERM, TERMINATION & GOVERNING LAW',
    '   Either party may terminate this Agreement upon thirty (30) days\' written notice;',
    `   provided that Sections 2, 3, 4, and 5 survive termination for all previously`,
    `   Introduced Targets. This Agreement is governed by the laws of the State of`,
    `   ${params.governingState}, without regard to conflict-of-law principles.`,
    '',
    'IN WITNESS WHEREOF, the parties execute this Agreement as of the Effective Date.',
    '',
    'KEYSTONE DEAL PARTNERS                      BUYER:',
    `                                            ${buyerLabel}`,
    '',
    'Signature: ___________________________      Signature: ___________________________',
    'Name:      Roohan Tariq                     Name:      ' + (params.signatoryName.trim() || '___________________________'),
    'Title:     Founder                          Title:     ' + (params.signatoryTitle.trim() || '___________________________'),
    'Email:     roohan@keystonedealpartners.com  Date:      ___________________________',
    'Date:      ___________________________',
  ].join('\n');
}

export function buildOutlookWebComposeUrl(
  toEmail: string,
  subject: string,
  body: string
): string {
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
    toEmail.trim()
  )}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export interface CsvImportPreview {
  validLeads: SellerLead[];
  rejectedRows: Array<{ rowNumber: number; company: string; email: string; reason: string }>;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseLeadsCsv(
  rawCsv: string,
  defaultVerticalId: VerticalId,
  existingLeads: SellerLead[],
  exclusions: ExclusionRules
): CsvImportPreview {
  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      validLeads: [],
      rejectedRows: [
        {
          rowNumber: 1,
          company: '—',
          email: '—',
          reason: 'CSV must include a header row and at least one data row.',
        },
      ],
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const findCol = (...keys: string[]) =>
    headers.findIndex((h) => keys.some((k) => h.includes(k)));

  const companyIdx = findCol('company', 'business', 'shop', 'account');
  const ownerIdx = findCol('owner', 'contact', 'name', 'president', 'founder');
  const emailIdx = findCol('email', 'mail');
  const cityIdx = findCol('city');
  const stateIdx = findCol('state');
  const websiteIdx = findCol('website', 'url', 'domain');
  const foundedIdx = findCol('founded', 'year');
  const revIdx = findCol('rev', 'revenue');
  const ebitdaIdx = findCol('ebitda');
  const reIdx = findCol('realestate', 'ownsbuilding', 'property');
  const credIdx = findCol('credential', 'cert', 'license', 'tag');
  const sourceIdx = findCol('source', 'registry');
  const verticalIdx = findCol('vertical', 'niche', 'sector');

  const resolveVerticalId = (rawVal: string): VerticalId => {
    const cleaned = rawVal.trim().toLowerCase();
    if (!cleaned) return defaultVerticalId;
    const match = VERTICALS.find(
      (v) =>
        v.id === cleaned ||
        v.shortName.toLowerCase() === cleaned ||
        v.name.toLowerCase().includes(cleaned) ||
        cleaned.includes(v.shortName.toLowerCase().split(' ')[0])
    );
    return match ? match.id : defaultVerticalId;
  };

  const existingEmailSet = new Set(existingLeads.map((l) => l.email.trim().toLowerCase()));
  const batchEmailSet = new Set<string>();

  const validLeads: SellerLead[] = [];
  const rejectedRows: CsvImportPreview['rejectedRows'] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const company = (companyIdx >= 0 ? cols[companyIdx] : '') || '';
    const ownerName = (ownerIdx >= 0 ? cols[ownerIdx] : '') || '';
    const email = (emailIdx >= 0 ? cols[emailIdx] : '').trim();
    const city = (cityIdx >= 0 ? cols[cityIdx] : '') || 'Unknown';
    const state = ((stateIdx >= 0 ? cols[stateIdx] : '') || 'US').toUpperCase().slice(0, 2);
    const website = (websiteIdx >= 0 ? cols[websiteIdx] : '') || '';
    const domain = normalizeDomain(website || email.split('@')[1] || '');
    const foundedYear = Number(foundedIdx >= 0 ? cols[foundedIdx] : '') || 1992;
    const estRevenueM = Number(revIdx >= 0 ? cols[revIdx] : '') || 6.0;
    const estEbitdaM =
      Number(ebitdaIdx >= 0 ? cols[ebitdaIdx] : '') || Number((estRevenueM * 0.18).toFixed(2));
    const ownsRealEstate =
      reIdx >= 0 ? /^(true|yes|y|1)$/i.test(cols[reIdx] || '') : true;
    const resolvedVerticalId =
      verticalIdx >= 0 ? resolveVerticalId(cols[verticalIdx] || '') : defaultVerticalId;
    const credentialTag =
      (credIdx >= 0 ? cols[credIdx] : '') || VERTICAL_MAP[resolvedVerticalId].credentialLabel;
    const dataSource = (sourceIdx >= 0 ? cols[sourceIdx] : '') || 'CSV Registry Import';

    if (!company) {
      rejectedRows.push({ rowNumber: i + 1, company: 'Missing', email, reason: 'Missing company name' });
      continue;
    }
    if (!email || !email.includes('@')) {
      rejectedRows.push({ rowNumber: i + 1, company, email: email || 'Missing', reason: 'Missing or invalid email' });
      continue;
    }
    if (!isDirectNamedEmail(email)) {
      rejectedRows.push({
        rowNumber: i + 1,
        company,
        email,
        reason: 'Blocked role inbox (info@/service@/office@) to protect reply rate',
      });
      continue;
    }
    const lowerEmail = email.toLowerCase();
    if (existingEmailSet.has(lowerEmail) || batchEmailSet.has(lowerEmail)) {
      rejectedRows.push({ rowNumber: i + 1, company, email, reason: 'Duplicate email already in pipeline' });
      continue;
    }
    if (isExcludedLead({ company, domain, website, email }, exclusions)) {
      rejectedRows.push({ rowNumber: i + 1, company, email, reason: 'Matches Exclusion List' });
      continue;
    }

    batchEmailSet.add(lowerEmail);
    const founded1996 = foundedYear <= 1996;
    const thirtyPlus = new Date().getFullYear() - foundedYear >= 30;
    const ownerLast = ownerName.trim().split(/\s+/).slice(-1)[0]?.toLowerCase() || '';
    const founderNameInCompany =
      ownerLast.length >= 4 && company.toLowerCase().includes(ownerLast);

    validLeads.push({
      id: `imp-${Date.now()}-${i}`,
      company,
      verticalId: resolvedVerticalId,
      city,
      state,
      website: website || `https://${domain}`,
      domain,
      ownerName: ownerName || 'Founder / Owner',
      ownerTitle: 'Owner / President',
      email,
      emailVerification: 'Verified',
      recipientEsp: lowerEmail.endsWith('@gmail.com') ? 'Google' : 'Microsoft365',
      foundedYear,
      estRevenueM,
      estEbitdaM,
      teamSize: '15-35 employees',
      ownsRealEstate,
      credentialTag,
      dataSource,
      dealKillerFlags: [],
      signals: {
        founded1996OrEarlier: founded1996,
        livingFounderStillOwner: true,
        thirtyPlusYearTrackRecord: thirtyPlus,
        familyOwnedNoSuccessorNamed: true,
        smallFounderRunTeam: true,
        founderNameInCompany,
        nextGenAlreadyInCharge: false,
      },
      stage: 'Ready',
      notes: `Imported via CSV (${dataSource}).`,
    });
  }

  return { validLeads, rejectedRows };
}

export function computeVerticalAnalytics(
  leads: SellerLead[],
  exclusions: ExclusionRules
): VerticalAnalyticsRow[] {
  const sentStages = new Set([
    'Sent T1',
    'Sent T2',
    'Sent T3',
    'Replied — Positive',
    'Call Booked',
    'NDA / Buyer Intro',
    'LOI',
    'Not Now',
  ]);
  const positiveStages = new Set([
    'Replied — Positive',
    'Call Booked',
    'NDA / Buyer Intro',
    'LOI',
  ]);
  const introStages = new Set(['Call Booked', 'NDA / Buyer Intro', 'LOI']);

  return VERTICALS.map((v) => {
    const vLeads = leads.filter((l) => l.verticalId === v.id);
    const eligibleReady = vLeads.filter(
      (l) =>
        (l.stage === 'Ready' || l.stage === 'Queued') &&
        evaluateLeadEligibility(l, exclusions).eligible
    ).length;
    const sentCount = vLeads.filter((l) => sentStages.has(l.stage)).length;
    const positiveReplies = vLeads.filter((l) => positiveStages.has(l.stage)).length;
    const callsOrIntros = vLeads.filter((l) => introStages.has(l.stage)).length;
    const positiveReplyRatePct =
      sentCount > 0 ? Number(((positiveReplies / sentCount) * 100).toFixed(1)) : 0;
    const introConversionPct =
      positiveReplies > 0
        ? Number(((callsOrIntros / positiveReplies) * 100).toFixed(1))
        : 0;

    let verdict: VerticalAnalyticsRow['verdict'] = 'Pending Sample';
    if (sentCount >= 2) {
      if (positiveReplyRatePct >= 1.5) verdict = 'Scale';
      else if (positiveReplyRatePct >= 0.8) verdict = 'Optimize';
      else verdict = 'Pivot';
    }

    return {
      verticalId: v.id,
      name: v.name,
      shortName: v.shortName,
      totalLeads: vLeads.length,
      eligibleReady,
      sentCount,
      positiveReplies,
      callsOrIntros,
      positiveReplyRatePct,
      introConversionPct,
      verdict,
    };
  });
}

export function generateMultiNicheWebsiteHtml(): string {
  return `<!doctype html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Keystone Deal Partners — Confidential Buy-Side M&amp;A for Essential US Service Founders</title>
  <meta
    name="description"
    content="Confidential, 0% seller-commission buy-side introductions for established US commercial, mechanical, and industrial service business owners ($3M–$40M+ revenue)."
  />
  <link rel="canonical" href="https://keystonedealpartners.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Keystone Deal Partners" />
  <meta property="og:url" content="https://keystonedealpartners.com/" />
  <meta
    property="og:title"
    content="Keystone Deal Partners — A Private Exit Conversation With Zero Broker Commission"
  />
  <meta
    property="og:description"
    content="Start with a confidential ballpark valuation range. Buyers pay our fee in full; your local company name, staff, trucks, and real estate options stay intact."
  />
  <meta name="twitter:card" content="summary_large_image" />
  <meta
    name="twitter:title"
    content="Keystone Deal Partners — Buy-Side M&amp;A Introductions (0% Seller Fee)"
  />
  <meta
    name="twitter:description"
    content="Private, off-market exit conversations for US commercial facility, kitchen equipment, HVAC/mechanical, environmental, and industrial service founders."
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Public+Sans:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Keystone Deal Partners",
      "url": "https://keystonedealpartners.com",
      "email": "roohan@keystonedealpartners.com",
      "founder": {
        "@type": "Person",
        "name": "Roohan Tariq",
        "jobTitle": "Founder"
      },
      "areaServed": {
        "@type": "Country",
        "name": "United States"
      },
      "description": "Buy-side M&A origination firm serving founder-owners of established US commercial, mechanical, and industrial service businesses ($3M–$40M+ revenue) with zero seller commission and buyer-blind confidentiality."
    }
  </script>
  <style>
    :root {
      --bg: #FAF9F6;
      --surface: #FFFFFF;
      --navy: #11223D;
      --navy-hover: #1A3359;
      --ink: #1E293B;
      --muted: #475569;
      --subtle: #64748B;
      --border: #E2E8F0;
      --accent: #1E4D3B;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, .serif {
      font-family: 'Newsreader', Georgia, serif;
      color: var(--navy);
      letter-spacing: -0.015em;
    }
    .mono {
      font-family: 'JetBrains Mono', ui-monospace, monospace;
    }
    .wrap {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 24px;
    }
    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(250, 249, 246, 0.94);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
    }
    .nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 70px;
    }
    .brand {
      font-family: 'Newsreader', Georgia, serif;
      font-size: clamp(17px, 2.4vw, 22px);
      font-weight: 600;
      color: var(--navy);
      text-decoration: none;
      white-space: nowrap;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .nav-links a {
      color: var(--muted);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }
    .nav-links a:hover { color: var(--navy); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--navy);
      color: #FFFFFF;
      padding: 11px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--navy);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease;
    }
    .btn:hover { background: var(--navy-hover); }
    .btn-outline {
      background: transparent;
      color: var(--navy);
      border: 1px solid #CBD5E1;
    }
    .btn-outline:hover { background: #F1F5F9; }
    .nav-cta {
      padding: 9px 16px;
      font-size: 13px;
      flex-shrink: 0;
    }

    /* Hero */
    .hero {
      padding: clamp(56px, 8vw, 96px) 0 clamp(44px, 6vw, 72px);
      border-bottom: 1px solid var(--border);
    }
    .eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 16px;
    }
    .hero h1 {
      font-size: clamp(32px, 5vw, 54px);
      line-height: 1.1;
      font-weight: 500;
      max-width: 820px;
      margin: 0 0 22px;
      text-wrap: balance;
    }
    .hero-lead {
      font-size: clamp(16px, 2vw, 19px);
      color: var(--muted);
      max-width: 720px;
      margin: 0 0 32px;
    }
    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
      margin-bottom: 48px;
    }
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
      padding-top: 28px;
      border-top: 1px solid var(--border);
    }
    .trust-val {
      font-family: 'Newsreader', Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: var(--navy);
    }
    .trust-lbl {
      font-size: 13px;
      color: var(--muted);
      margin-top: 4px;
    }

    /* Sections */
    section.band {
      padding: clamp(56px, 7vw, 88px) 0;
      border-bottom: 1px solid var(--border);
      scroll-margin-top: 76px;
    }
    section.band-white { background: var(--surface); }
    section.band-navy {
      background: var(--navy);
      color: #E2E8F0;
      border-bottom: none;
    }
    section.band-navy h2,
    section.band-navy h3 { color: #FFFFFF; }
    .section-head {
      max-width: 720px;
      margin-bottom: 40px;
    }
    .section-head h2 {
      font-size: clamp(26px, 3.6vw, 38px);
      line-height: 1.18;
      font-weight: 500;
      margin: 0 0 12px;
    }
    .section-head p {
      margin: 0;
      font-size: 16px;
      color: var(--muted);
    }
    .band-navy .section-head p { color: #CBD5E1; }

    /* Grids & Cards */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 28px;
    }
    .card-soft {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
    }
    .card-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--accent);
      margin-bottom: 10px;
    }
    .card h3 {
      font-size: 21px;
      font-weight: 500;
      margin: 0 0 10px;
      line-height: 1.25;
    }
    .card p {
      margin: 0 0 14px;
      font-size: 14.5px;
      color: var(--muted);
    }
    .card ul {
      margin: 0;
      padding-left: 18px;
      font-size: 13.5px;
      color: var(--ink);
    }
    .card ul li { margin-bottom: 6px; }
    .navy-card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      padding: 26px;
    }
    .navy-card h3 { font-size: 20px; margin: 0 0 8px; }
    .navy-card p { margin: 0; font-size: 14px; color: #CBD5E1; }

    /* Process */
    .step-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
    }
    .step-card h3 { font-size: 19px; margin: 0 0 8px; }
    .step-card p { margin: 0; font-size: 14px; color: var(--muted); }

    /* FAQ */
    .faq-list {
      max-width: 860px;
      border-top: 1px solid var(--border);
    }
    details.faq-item {
      border-bottom: 1px solid var(--border);
      padding: 20px 0;
    }
    details.faq-item summary {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-family: 'Newsreader', Georgia, serif;
      font-size: 20px;
      font-weight: 500;
      color: var(--navy);
    }
    details.faq-item summary::-webkit-details-marker { display: none; }
    details.faq-item summary::after {
      content: '+';
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      color: var(--subtle);
      flex-shrink: 0;
    }
    details.faq-item[open] summary::after { content: '−'; }
    details.faq-item p {
      margin: 12px 0 0;
      font-size: 14.5px;
      color: var(--muted);
      max-width: 780px;
    }

    /* Inquiry Form */
    .inquiry-layout {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: 40px;
      align-items: start;
    }
    .form-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 32px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .field-full { grid-column: 1 / -1; }
    label {
      display: block;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--navy);
      margin-bottom: 6px;
    }
    input, select, textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      font-family: 'Public Sans', sans-serif;
      font-size: 14px;
      color: var(--ink);
      background: #FFFFFF;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--navy);
    }
    .hidden-field { display: none; }
    .direct-box {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      font-size: 14px;
      color: var(--muted);
    }
    .direct-box a {
      color: var(--navy);
      font-weight: 600;
      text-decoration: none;
    }
    .direct-box a:hover { text-decoration: underline; }

    footer {
      padding: 36px 0;
      font-size: 13px;
      color: var(--subtle);
      background: var(--bg);
    }
    .footer-inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .nav-links { display: none; }
      .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .inquiry-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .trust-grid, .grid-2, .grid-4, .form-grid { grid-template-columns: 1fr; }
      .form-card { padding: 22px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap nav-bar">
      <a class="brand" href="#top">Keystone Deal Partners</a>
      <nav class="nav-links" aria-label="Primary Navigation">
        <a href="#sectors">Sectors</a>
        <a href="#structures">Deal Structures</a>
        <a href="#process">How It Works</a>
        <a href="#confidentiality">Confidentiality</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a class="btn nav-cta" href="#inquiry">Valuation Range</a>
    </div>
  </header>

  <main id="top">
    <!-- HERO -->
    <section class="hero">
      <div class="wrap">
        <div class="eyebrow">Private Buy-Side M&amp;A Origination · United States</div>
        <h1>A Private Exit Conversation — With Zero Broker Commission.</h1>
        <p class="hero-lead">
          Keystone Deal Partners introduces established, founder-owned US commercial, mechanical, and
          industrial service businesses ($3M–$40M+ revenue) directly to vetted, well-capitalized
          acquirers. Our buyers pay our advisory fee in full — keeping your local company name,
          technicians, and real estate options intact.
        </p>
        <div class="hero-actions">
          <a class="btn" href="#inquiry">Request a Confidential Ballpark Valuation</a>
          <a class="btn btn-outline" href="#process">How Our 4-Step Process Works</a>
        </div>
        <div class="trust-grid">
          <div>
            <div class="trust-val">0% Seller Fee</div>
            <div class="trust-lbl">Buyers cover 100% of advisory fees at closing. No retainers, no broker commission.</div>
          </div>
          <div>
            <div class="trust-val">100% Off-Market</div>
            <div class="trust-lbl">Never listed on public broker portals. Your name is never shared without your written NDA.</div>
          </div>
          <div>
            <div class="trust-val">$3M–$40M+ Revenue</div>
            <div class="trust-lbl">Tailored buyer network from funded operators ($750K+ EBITDA) to national PE platforms.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- TARGET SECTORS -->
    <section id="sectors" class="band band-white">
      <div class="wrap">
        <div class="section-head">
          <div class="eyebrow">Active Buy-Side Mandates</div>
          <h2>Essential Commercial, Mechanical &amp; Industrial Service Sectors</h2>
          <p>
            We work exclusively with recurring-service, technician-driven US businesses where
            reputation, compliance, and long-term customer relationships matter.
          </p>
        </div>

        <div class="grid-2">
          <article class="card">
            <div class="card-num">01 / COMMERCIAL FACILITY &amp; EQUIPMENT</div>
            <h3>Overhead Doors, Loading Docks &amp; Commercial Kitchens</h3>
            <p>
              Mission-critical commercial facility maintenance with emergency dispatch, planned
              maintenance agreements, and multi-decade customer retention.
            </p>
            <ul>
              <li>Commercial overhead doors, rolling steel, dock levelers &amp; automatic entrances (IDA / AAADM)</li>
              <li>CFESA-certified commercial kitchen equipment (hot-side) &amp; commercial refrigeration (cold-side)</li>
              <li>Warehouse facility maintenance &amp; industrial cold-storage door service</li>
            </ul>
          </article>

          <article class="card">
            <div class="card-num">02 / MECHANICAL, HVAC &amp; POWER SYSTEMS</div>
            <h3>Residential &amp; Commercial Trades + Critical Power</h3>
            <p>
              Established service-and-replacement contractors and accredited electrical testing
              specialists serving homeowners, hospitals, and data centers.
            </p>
            <ul>
              <li>Residential &amp; commercial HVAC, plumbing, and electrical service &amp; replacement</li>
              <li>NETA-accredited high-voltage electrical testing &amp; switchgear maintenance</li>
              <li>EGSA standby commercial generator maintenance, load-bank testing &amp; ATS service</li>
            </ul>
          </article>

          <article class="card">
            <div class="card-num">03 / ENVIRONMENTAL &amp; INDUSTRIAL ROUTES</div>
            <h3>Liquid Waste, Water Chemistry &amp; Rotating Equipment</h3>
            <p>
              Compliance-mandated recurring route businesses and specialized aftermarket mechanical
              repair shops with high switching costs.
            </p>
            <ul>
              <li>Commercial grease trap (FOG), lift-station pumping &amp; non-hazardous liquid waste routes</li>
              <li>Industrial cooling tower &amp; boiler water treatment (AWT / ASHRAE 188 compliance)</li>
              <li>Industrial compressed air systems, vacuum pumps &amp; EASA electric motor/pump rebuilds</li>
            </ul>
          </article>

          <article class="card">
            <div class="card-num">04 / TESTING, INSPECTION &amp; CONTROLS</div>
            <h3>Metrology Labs, Crane Safety &amp; Industrial Automation</h3>
            <p>
              Accredited engineering, calibration, and safety inspection firms supporting aerospace,
              food processing, manufacturing, and healthcare facilities.
            </p>
            <ul>
              <li>A2LA / NVLAP ISO/IEC 17025 accredited calibration &amp; metrology laboratories</li>
              <li>OSHA 1910.179 overhead bridge crane &amp; hoist inspection and repair contractors</li>
              <li>CSIA-certified PLC/SCADA systems integrators &amp; industrial refrigeration controls</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- FLEXIBLE DEAL STRUCTURES -->
    <section id="structures" class="band">
      <div class="wrap">
        <div class="section-head">
          <div class="eyebrow">Built Around Founder Goals</div>
          <h2>Exit Cleanly — Or Structure Around Your Real Estate &amp; Team</h2>
          <p>
            Because we represent multiple buyer tiers (national platforms, lower-middle-market
            family offices, and funded acquisition entrepreneurs), you aren't forced into a single
            one-size-fits-all buyout structure.
          </p>
        </div>
        <div class="grid-4">
          <div class="card-soft">
            <div class="card-num">OPTION A</div>
            <h3 class="serif" style="font-size:19px;margin:0 0 8px;">Full Retirement Transition</h3>
            <p style="margin:0;font-size:13.5px;color:var(--muted);">
              100% liquidity with a clean 6–12 month handoff so your customers and senior techs are
              fully supported as you step back.
            </p>
          </div>
          <div class="card-soft">
            <div class="card-num">OPTION B</div>
            <h3 class="serif" style="font-size:19px;margin:0 0 8px;">Keep Your Real Estate (NNN)</h3>
            <p style="margin:0;font-size:13.5px;color:var(--muted);">
              Sell only the operating company and keep your shop or warehouse on a 10-year
              triple-net (NNN) lease for steady retirement income.
            </p>
          </div>
          <div class="card-soft">
            <div class="card-num">OPTION C</div>
            <h3 class="serif" style="font-size:19px;margin:0 0 8px;">Partial Liquidity / Rollover</h3>
            <p style="margin:0;font-size:13.5px;color:var(--muted);">
              Take 70–80% cash off the table today, offload HR and recruiting headaches, and keep a
              minority stake for a second upside payout.
            </p>
          </div>
          <div class="card-soft">
            <div class="card-num">OPTION D</div>
            <h3 class="serif" style="font-size:19px;margin:0 0 8px;">Local Name &amp; Team Intact</h3>
            <p style="margin:0;font-size:13.5px;color:var(--muted);">
              We prioritize buyers who keep your local company name on the trucks, retain your
              office staff, and invest in technician training.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="process" class="band band-white">
      <div class="wrap">
        <div class="section-head">
          <div class="eyebrow">Simple, Quiet, Zero Pressure</div>
          <h2>How Our 4-Step Confidential Process Works</h2>
          <p>
            Most owners we speak with start with a quiet 10-minute conversation 6 to 24 months
            before they ever decide to transact — purely to know what their business is worth in
            today's private market.
          </p>
        </div>
        <div class="grid-4">
          <div class="step-card">
            <div class="card-num">STEP 01</div>
            <h3>10-Minute Call</h3>
            <p>
              A brief, off-the-record call directly with Roohan Tariq to understand your trade,
              approximate scale, and ideal timeline. Zero financial statements required.
            </p>
          </div>
          <div class="step-card">
            <div class="card-num">STEP 02</div>
            <h3>Ballpark Valuation Range</h3>
            <p>
              We share a realistic, confidential valuation range based on active private-market
              EBITDA multiples currently closing in your exact industry and region.
            </p>
          </div>
          <div class="step-card">
            <div class="card-num">STEP 03</div>
            <h3>Buyer-Blind Match &amp; NDA</h3>
            <p>
              If the numbers interest you, we present 1–3 vetted buyer profiles. Your company name is
              disclosed only after you approve the buyer and sign a mutual NDA.
            </p>
          </div>
          <div class="step-card">
            <div class="card-num">STEP 04</div>
            <h3>Direct Offer &amp; Closing</h3>
            <p>
              Meet the buyer's principals directly, review a transparent Letter of Intent (LOI), and
              close on your timeline — with 0% commission charged to you.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CONFIDENTIALITY & 0% GUARANTEE -->
    <section id="confidentiality" class="band band-navy">
      <div class="wrap">
        <div class="section-head">
          <div class="eyebrow" style="color:#93C5FD;">Our Written Commitment to Founders</div>
          <h2>Strict Confidentiality &amp; Zero Seller Commission</h2>
          <p>
            Selling a business you spent 25+ years building requires discretion first. Every
            conversation with Keystone Deal Partners operates under four hard rules:
          </p>
        </div>
        <div class="grid-2">
          <div class="navy-card">
            <h3>1. Zero Seller Commission — Ever</h3>
            <p>
              Unlike traditional business brokers who charge sellers 6%–10% of the sale price, our
              buy-side fee is paid 100% by the acquiring group at closing. You keep every dollar of
              your negotiated purchase price.
            </p>
          </div>
          <div class="navy-card">
            <h3>2. Never Listed on Public Portals</h3>
            <p>
              Your business is never posted on BizBuySell, LoopNet, or mass email blasts. We make
              targeted, private introductions only to vetted acquirers whose mandate fits your
              exact sector and size.
            </p>
          </div>
          <div class="navy-card">
            <h3>3. Employee &amp; Customer Privacy</h3>
            <p>
              No buyer is permitted to visit your shop, speak with your technicians, or contact any
              customer or vendor without your explicit advance permission late in confirmatory due
              diligence.
            </p>
          </div>
          <div class="navy-card">
            <h3>4. Zero Exclusivity or Lock-In</h3>
            <p>
              Speaking with us never ties up your company in a 12-month exclusive listing contract.
              You can pause, walk away, or revisit the conversation a year later at zero cost.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="band band-white">
      <div class="wrap">
        <div class="section-head">
          <div class="eyebrow">Founder Questions</div>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div class="faq-list">
          <details class="faq-item" open>
            <summary>How does Keystone Deal Partners get paid if I pay 0% commission?</summary>
            <p>
              We operate strictly on the buy-side. Institutional acquirers, family offices, and
              funded acquisition partners pay us a success fee directly out of their own transaction
              budget when a deal closes. You never pay a retainer, marketing fee, or closing
              commission.
            </p>
          </details>
          <details class="faq-item">
            <summary>Will my employees, competitors, or customers find out we talked?</summary>
            <p>
              No. Initial valuation discussions happen 1-on-1 directly with you under complete
              confidentiality. Before any buyer ever learns your company name, we describe your
              business anonymously ("no-name profile") and obtain a signed mutual NDA from the
              buyer.
            </p>
          </details>
          <details class="faq-item">
            <summary>I own my commercial shop/warehouse — can I keep the real estate?</summary>
            <p>
              Yes. Most of our commercial service, dock/door, mechanical, and industrial buyers are
              very comfortable purchasing only the operating business while signing a 10-year
              triple-net (NNN) lease with you — giving you upfront cash plus ongoing monthly rental
              income. If you prefer to sell the property too, we can structure that as well.
            </p>
          </details>
          <details class="faq-item">
            <summary>My company is around $3M–$5M in revenue — is that too small?</summary>
            <p>
              Not at all. While large national roll-ups often focus on $5M–$40M+ platforms, we also
              maintain direct relationships with lower-middle-market family offices and
              institutionally backed funded searchers actively acquiring well-run $3M–$5M revenue
              ($750K–$1.5M EBITDA) founder businesses.
            </p>
          </details>
          <details class="faq-item">
            <summary>What if I am not ready to exit for another 12 to 24 months?</summary>
            <p>
              That is actually the best time to start a quiet conversation. Getting a realistic
              ballpark valuation range today shows you exactly which levers (service-agreement mix,
              management bench, or clean add-backs) can add 1x–2x to your EBITDA multiple before
              you decide to transition.
            </p>
          </details>
          <details class="faq-item">
            <summary>How is this different from hiring a traditional business broker?</summary>
            <p>
              Traditional brokers charge sellers 6%–10%, require a 12-month exclusive listing
              agreement, and blast your business to hundreds of unqualified tire-kickers. We charge
              sellers $0, require no exclusivity, and introduce you quietly only to vetted buyers
              with committed capital in your exact trade.
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- NETLIFY CONFIDENTIAL INQUIRY FORM -->
    <section id="inquiry" class="band">
      <div class="wrap">
        <div class="inquiry-layout">
          <div>
            <div class="eyebrow">Confidential Inquiry</div>
            <h2 style="font-size:clamp(26px,3.6vw,38px);line-height:1.18;font-weight:500;margin:0 0 14px;">
              Request a Private Ballpark Valuation Range
            </h2>
            <p style="font-size:15.5px;color:var(--muted);margin:0 0 20px;">
              Share a few high-level details below (no tax returns or sensitive spreadsheets
              needed). Roohan Tariq reviews every inquiry personally and replies within 1 business
              day with a confidential range or a time for a brief 10-minute call.
            </p>
            <div class="card-soft">
              <div class="mono" style="font-size:11px;color:var(--accent);margin-bottom:6px;">
                DIRECT PRINCIPAL CONTACT
              </div>
              <div style="font-weight:600;color:var(--navy);font-size:15px;">Roohan Tariq</div>
              <div style="font-size:13.5px;color:var(--muted);">Founder, Keystone Deal Partners</div>
              <div class="direct-box" style="margin-top:14px;padding-top:14px;">
                Email directly:
                <a href="mailto:roohan@keystonedealpartners.com?subject=Confidential%20Valuation%20Inquiry">
                  roohan@keystonedealpartners.com
                </a>
              </div>
            </div>
          </div>

          <div class="form-card">
            <form
              name="confidential-inquiry"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="confidential-inquiry" />
              <p class="hidden-field">
                <label>Do not fill this out: <input name="bot-field" /></label>
              </p>

              <div class="form-grid">
                <div>
                  <label for="ownerName">Your Name *</label>
                  <input id="ownerName" name="ownerName" type="text" required placeholder="e.g., Gary Callahan" />
                </div>
                <div>
                  <label for="companyName">Company Name (Optional / Confidential)</label>
                  <input id="companyName" name="companyName" type="text" placeholder="e.g., Midwest Industrial Dock Co." />
                </div>
                <div>
                  <label for="sector">Primary Industry Sector *</label>
                  <select id="sector" name="sector" required>
                    <option value="">Select your sector...</option>
                    <option value="Commercial Overhead Doors & Loading Docks">Commercial Overhead Doors &amp; Loading Docks</option>
                    <option value="Commercial Kitchen & Refrigeration (CFESA)">Commercial Kitchen &amp; Refrigeration (CFESA)</option>
                    <option value="Residential / Commercial HVAC, Plumbing or Electrical">Residential / Commercial HVAC, Plumbing or Electrical</option>
                    <option value="Grease Trap / Liquid Waste / Environmental Routes">Grease Trap / Liquid Waste / Environmental Routes</option>
                    <option value="Industrial Water Treatment / Compressed Air / Pumps">Industrial Water Treatment / Compressed Air / Pumps</option>
                    <option value="Electrical Testing (NETA) / Standby Power (EGSA)">Electrical Testing (NETA) / Standby Power (EGSA)</option>
                    <option value="Calibration Lab (ISO 17025) / Crane / Controls">Calibration Lab (ISO 17025) / Crane / Automation</option>
                    <option value="Other Essential Commercial / Industrial Service">Other Essential Commercial / Industrial Service</option>
                  </select>
                </div>
                <div>
                  <label for="cityState">City &amp; State *</label>
                  <input id="cityState" name="cityState" type="text" required placeholder="e.g., Columbus, OH" />
                </div>
                <div>
                  <label for="contact">Best Email or Phone *</label>
                  <input id="contact" name="contact" type="text" required placeholder="Direct email or cell number" />
                </div>
                <div>
                  <label for="revenueRange">Approx. Annual Revenue</label>
                  <select id="revenueRange" name="revenueRange">
                    <option value="$3M–$5M">$3M – $5M</option>
                    <option value="$5M–$10M" selected>$5M – $10M</option>
                    <option value="$10M–$25M">$10M – $25M</option>
                    <option value="$25M+">$25M+</option>
                  </select>
                </div>
                <div>
                  <label for="realEstate">Facility / Real Estate</label>
                  <select id="realEstate" name="realEstate">
                    <option value="Own building — open to NNN lease or sale">Own building — open to NNN lease or sale</option>
                    <option value="Own building — prefer to keep & lease back">Own building — prefer to keep &amp; lease back</option>
                    <option value="Leased facility">Leased operating facility</option>
                  </select>
                </div>
                <div>
                  <label for="timeline">Ideal Transition Timeline</label>
                  <select id="timeline" name="timeline">
                    <option value="Exploring valuation range only">Exploring valuation range only</option>
                    <option value="Within 6–12 months">Within 6 – 12 months</option>
                    <option value="12–24 months out">12 – 24 months out</option>
                    <option value="Ready for immediate discussions">Ready for immediate discussions</option>
                  </select>
                </div>
                <div class="field-full">
                  <label for="fitProfile">Anything else helpful to know? (Optional)</label>
                  <textarea
                    id="fitProfile"
                    name="fitProfile"
                    rows="3"
                    placeholder="Approximate team size, service mix, or best day/time for a quiet 10-minute call..."
                  ></textarea>
                </div>
              </div>

              <div style="margin-top:20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
                <span style="font-size:12px;color:var(--subtle);">
                  100% confidential · Never shared without written consent.
                </span>
                <button type="submit" class="btn">Request Confidential Valuation Range</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="wrap footer-inner">
      <div>
        <strong style="color:var(--navy);">Keystone Deal Partners</strong> · Private Buy-Side M&amp;A Origination · United States
      </div>
      <div>
        Direct: <a href="mailto:roohan@keystonedealpartners.com" style="color:var(--navy);text-decoration:none;">roohan@keystonedealpartners.com</a> · 0% Seller Commission · Strictly Confidential
      </div>
    </div>
  </footer>
</body>
</html>`;
}
