import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateDailyBatch100,
  buildBlindTeaser,
  buildBuySideFeeAgreementText,
  buildFollowUpDay4PlainText,
  buildMillionVerifierExportCsv,
  buildSellerEmail1PlainText,
  buildSmartleadCsv,
  calculateRetirementScore,
  computeVerticalAnalytics,
  evaluateLeadEligibility,
  generateMultiNicheWebsiteHtml,
  isDirectNamedEmail,
  parseLeadsCsv,
  routeLeadToBuyers,
} from './outreachEngine';
import {
  ALL_SEED_LEADS,
  INITIAL_BUYERS,
  INITIAL_EXCLUSIONS,
  INITIAL_INBOXES,
  INITIAL_LEADS,
  REAL_RESEARCH_STARTER_TARGETS,
} from '../data/seedData';
import { RESEARCHED_CANDIDATE_TARGETS } from '../data/researchedTargets';

test('calculateRetirementScore scores 6 positive signals and subtracts next-gen penalty', () => {
  const full = calculateRetirementScore({
    founded1996OrEarlier: true,
    livingFounderStillOwner: true,
    thirtyPlusYearTrackRecord: true,
    familyOwnedNoSuccessorNamed: true,
    smallFounderRunTeam: true,
    founderNameInCompany: true,
    nextGenAlreadyInCharge: false,
  });
  assert.equal(full.score, 6);

  const withNextGen = calculateRetirementScore({
    founded1996OrEarlier: true,
    livingFounderStillOwner: true,
    thirtyPlusYearTrackRecord: true,
    familyOwnedNoSuccessorNamed: false,
    smallFounderRunTeam: true,
    founderNameInCompany: false,
    nextGenAlreadyInCharge: true,
  });
  assert.equal(withNextGen.score, 3);
});

test('isDirectNamedEmail blocks generic role inboxes and accepts personal owner emails', () => {
  assert.equal(isDirectNamedEmail('info@dockcompany.com'), false);
  assert.equal(isDirectNamedEmail('dispatch@kitchenrepair.com'), false);
  assert.equal(isDirectNamedEmail('service@hvacshop.com'), false);
  assert.equal(isDirectNamedEmail('not-an-email'), false);
  assert.equal(isDirectNamedEmail('gcallahan@midwestdockdoor.com'), true);
});

test('evaluateLeadEligibility rejects role inbox, unverified email, and deal-killer flags', () => {
  const cleanLead = INITIAL_LEADS.find((l) => l.id === 'lead-dd-2')!;
  const cleanRes = evaluateLeadEligibility(cleanLead, INITIAL_EXCLUSIONS);
  assert.equal(cleanRes.eligible, true);
  assert.equal(cleanRes.blockers.length, 0);

  const flaggedLead = INITIAL_LEADS.find((l) => l.id === 'lead-hv-3')!;
  const flaggedRes = evaluateLeadEligibility(flaggedLead, INITIAL_EXCLUSIONS);
  assert.equal(flaggedRes.eligible, false);
  assert.ok(flaggedRes.blockers.length >= 3);

  // Real researched starter & CSV candidate targets must remain safely blocked until verified via MillionVerifier
  assert.equal(REAL_RESEARCH_STARTER_TARGETS.length, 15);
  assert.equal(RESEARCHED_CANDIDATE_TARGETS.length, 103);
  assert.ok(ALL_SEED_LEADS.length >= 135);
  for (const realTarget of [...REAL_RESEARCH_STARTER_TARGETS, ...RESEARCHED_CANDIDATE_TARGETS]) {
    assert.equal(realTarget.emailVerification, 'Unverified');
    assert.equal(evaluateLeadEligibility(realTarget, INITIAL_EXCLUSIONS).eligible, false);
  }
  assert.ok(INITIAL_EXCLUSIONS.companies.includes('Whaley Foodservice'));
  assert.ok(INITIAL_EXCLUSIONS.companies.includes('K&D Factory Service'));
  assert.ok(INITIAL_EXCLUSIONS.companies.includes('TexDoor'));
});

test('routeLeadToBuyers prioritizes Tier-1 platforms, falls back to Tier-3 searchers for sub-$4.5M deals, and warns on SHS listed deals', () => {
  const dockLead = INITIAL_LEADS.find((l) => l.id === 'lead-dd-2')!;
  const dockMatches = routeLeadToBuyers(dockLead, INITIAL_BUYERS);
  assert.ok(dockMatches.length >= 3);
  assert.equal(dockMatches[0].buyer.firmName, 'US Dock & Door');

  const smallCfesa = INITIAL_LEADS.find((l) => l.id === 'lead-cf-3')!;
  const smallMatches = routeLeadToBuyers(smallCfesa, INITIAL_BUYERS);
  assert.ok(
    smallMatches.some((m) => m.buyer.tier === 'TIER_3_FUNDED_SEARCHER'),
    'Expected a Tier-3 funded searcher fallback for sub-$4.5M revenue CFESA target'
  );

  const listedHvac = { ...INITIAL_LEADS.find((l) => l.id === 'lead-hv-1')!, isOnMarket: true };
  const listedMatches = routeLeadToBuyers(listedHvac, INITIAL_BUYERS);
  const shsMatch = listedMatches.find((m) => m.buyer.id === 'buyer-shs');
  assert.ok(shsMatch?.warningNote?.includes('$0'));

  // Unverified-scale researched targets should still match vertical/state buyers with scale warning
  const unverifiedDock = RESEARCHED_CANDIDATE_TARGETS[0];
  const unverifiedMatches = routeLeadToBuyers(unverifiedDock, INITIAL_BUYERS);
  assert.ok(unverifiedMatches.length >= 3);
  assert.ok(unverifiedMatches[0].warningNote?.includes('unverified'));
});

test('allocateDailyBatch100 enforces bounce guardrails, ESP matching, and exports valid Smartlead CSV', () => {
  const inboxesWithBurned = INITIAL_INBOXES.map((inb, idx) =>
    idx === 0 ? { ...inb, bounceRatePct: 2.5 } : inb
  );
  const res = allocateDailyBatch100(
    INITIAL_LEADS,
    inboxesWithBurned,
    INITIAL_BUYERS,
    INITIAL_EXCLUSIONS,
    [
      { verticalId: 'dock_door', targetCount: 10 },
      { verticalId: 'cfesa_kitchen', targetCount: 10 },
      { verticalId: 'legacy_hvac', targetCount: 5 },
    ]
  );

  assert.equal(res.pausedInboxes.length, 1);
  assert.equal(res.healthyInboxes.length, 9);
  assert.ok(res.assignments.length > 0);
  assert.ok(
    res.assignments.every((a) => a.inbox.id !== 'inb-1'),
    'High-bounce inbox must never be assigned cold outreach'
  );

  const csv = buildSmartleadCsv(res.assignments);
  const lines = csv.split('\r\n');
  assert.ok(lines[0].includes('assigned_sender_inbox'));
  assert.ok(lines[0].includes('followup_day4_plain_text'));
  assert.ok(csv.includes('Keystone Deal Partners'));
});

test('plain-text templates avoid HTML tags and Touch #2 introduces a fresh angle', () => {
  const lead = INITIAL_LEADS.find((l) => l.id === 'lead-dd-2')!;
  const t1 = buildSellerEmail1PlainText(lead, 'REAL_ESTATE_LEGACY');
  const t2 = buildFollowUpDay4PlainText(lead);
  assert.equal(t1.includes('<html'), false);
  assert.equal(t2.includes('<p>'), false);
  assert.ok(t2.includes('NNN lease'));
});

test('buildBlindTeaser strips identifying company and owner names', () => {
  const lead = INITIAL_LEADS.find((l) => l.id === 'lead-dd-1')!;
  const teaser = buildBlindTeaser(lead);
  assert.equal(teaser.includes(lead.company), false);
  assert.equal(teaser.includes(lead.ownerName), false);
  assert.ok(teaser.includes('CONFIDENTIAL NO-NAME ACQUISITION PROFILE'));
});

test('parseLeadsCsv validates headers, routes optional vertical column, rejects role/missing emails, and imports valid leads', () => {
  const csv = [
    'company,vertical,owner,email,city,state,founded,revenue,ebitda,realestate',
    'Apex Cold Storage Doors LLC,dock_door,Martin Cole,mcole@apexcolddoors.example,Columbus,OH,1990,9.5,1.9,yes',
    'Great Plains Kitchen Service,cfesa_kitchen,Harold Jennings,hjennings@gpkitchen.example,Kansas City,MO,1988,7.4,1.45,yes',
    'Bad Role Shop,dock_door,Jane Doe,info@badroleshop.example,Dallas,TX,1992,6.0,1.2,yes',
    'Missing Email Co,dock_door,Bob Smith,,Tampa,FL,1988,5.0,1.0,no',
  ].join('\n');

  const parsed = parseLeadsCsv(csv, 'dock_door', INITIAL_LEADS, INITIAL_EXCLUSIONS);
  assert.equal(parsed.validLeads.length, 2);
  assert.equal(parsed.rejectedRows.length, 2);
  assert.equal(parsed.validLeads[0].verticalId, 'dock_door');
  assert.equal(parsed.validLeads[1].verticalId, 'cfesa_kitchen');
  assert.equal(calculateRetirementScore(parsed.validLeads[0].signals).score, 5);
});

test('computeVerticalAnalytics aggregates real pipeline conversion rates', () => {
  const rows = computeVerticalAnalytics(INITIAL_LEADS, INITIAL_EXCLUSIONS);
  const dockRow = rows.find((r) => r.verticalId === 'dock_door')!;
  assert.ok(dockRow.totalLeads >= 5);
  assert.ok(dockRow.positiveReplies >= 1);
  assert.equal(dockRow.verdict, 'Scale');
});

test('buildMillionVerifierExportCsv exports researched starter targets cleanly with domains and sources', () => {
  const csv = buildMillionVerifierExportCsv(REAL_RESEARCH_STARTER_TARGETS);
  const lines = csv.split('\r\n');
  assert.equal(lines.length, 16); // header + 15 real companies (Whaley removed as acquired)
  assert.ok(lines[0].includes('company_name,vertical,city,state,domain'));
  assert.ok(csv.includes('davisdoorcompany.com'));
  assert.ok(csv.includes('akmco.com'));
  assert.ok(csv.includes('Unverified'));
});

test('buildBuySideFeeAgreementText renders 48-hour active dialogue carve-out, fee schedule, and buyer details', () => {
  const text = buildBuySideFeeAgreementText({
    buyerName: 'DuraServ Corp',
    sponsorName: 'Leonard Green & Partners',
    signatoryName: 'Christian Foust',
    signatoryTitle: 'Corporate Development Manager',
    targetVerticalsLabel: 'Commercial Overhead Doors & Loading Docks',
    minEbitdaM: 1.0,
    maxEbitdaM: 8.0,
    feePreset: 'LEHMAN_321',
    minimumFeeK: 125,
    tailMonths: 24,
    carveOutBusinessHours: 48,
    governingState: 'Delaware',
    effectiveDate: '2026-11-26',
  });

  assert.ok(text.includes('DuraServ Corp'));
  assert.ok(text.includes('Leonard Green & Partners'));
  assert.ok(text.includes('48-HOUR ACTIVE DIALOGUE CARVE-OUT'));
  assert.ok(text.includes('passive CRM records'));
  assert.ok(text.includes('$125,000'));
  assert.ok(text.includes('Roohan Tariq'));
});

test('generateMultiNicheWebsiteHtml renders all core sections and Netlify confidential inquiry form', () => {
  const html = generateMultiNicheWebsiteHtml();
  assert.ok(html.includes('data-netlify="true"'));
  assert.ok(html.includes('name="confidential-inquiry"'));
  assert.ok(html.includes('Overhead Doors, Loading Docks &amp; Commercial Kitchens'));
  assert.ok(html.includes('How Our 4-Step Confidential Process Works'));
  assert.ok(html.includes('Strict Confidentiality &amp; Zero Seller Commission'));
  assert.ok(html.includes('Frequently Asked Questions'));
  assert.ok(html.includes('roohan@keystonedealpartners.com'));
});

