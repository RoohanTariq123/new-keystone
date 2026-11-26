export type VerticalId =
  | 'dock_door'
  | 'cfesa_kitchen'
  | 'liquid_waste'
  | 'compressed_air'
  | 'water_treatment'
  | 'power_neta_egsa'
  | 'pump_motor_easa'
  | 'overhead_crane'
  | 'calibration_iso'
  | 'automation_csia'
  | 'legacy_hvac';

export type BuyerTier =
  | 'TIER_1_PLATFORM'
  | 'TIER_2_LMM_PE_FO'
  | 'TIER_3_FUNDED_SEARCHER'
  | 'TIER_4_STRATEGIC';

export type FeeAgreementStatus = 'Signed' | 'In Redline' | 'Pitched' | 'Target';

export type EmailVerificationStatus =
  | 'Verified'
  | 'Catch-All Verified'
  | 'Unverified'
  | 'Invalid';

export type LeadStage =
  | 'Ready'
  | 'Queued'
  | 'Sent T1'
  | 'Sent T2'
  | 'Sent T3'
  | 'Replied — Positive'
  | 'Call Booked'
  | 'NDA / Buyer Intro'
  | 'LOI'
  | 'Not Now'
  | 'Excluded';

export type EmailAngle = 'REAL_ESTATE_LEGACY' | 'TECHNICAL_VALUATION';

export interface ScoreSignals {
  founded1996OrEarlier: boolean;
  livingFounderStillOwner: boolean;
  thirtyPlusYearTrackRecord: boolean;
  familyOwnedNoSuccessorNamed: boolean;
  smallFounderRunTeam: boolean;
  founderNameInCompany: boolean;
  nextGenAlreadyInCharge: boolean;
}

export interface DataSourceRegistry {
  name: string;
  url: string;
  extractionTip: string;
}

export interface VerticalConfig {
  id: VerticalId;
  rank: number;
  name: string;
  shortName: string;
  pilotStatus: 'Pilot A' | 'Pilot B' | 'Wave 2' | 'Legacy';
  targetSubSegments: string;
  avoidSubSegments: string;
  ebitdaMultipleRange: string;
  typicalRevenueRange: string;
  typicalEbitdaRange: string;
  competitionLevel: 'Very Low' | 'Low' | 'Moderate' | 'High (Saturated)';
  credentialLabel: string;
  buyerDescriptor: string;
  activePlatforms: string[];
  dataSources: DataSourceRegistry[];
  dealKillers: string[];
  defaultDailyQuota: number;
}

export interface BuyerMandate {
  id: string;
  firmName: string;
  sponsorOrBacker: string;
  contactName: string;
  contactTitle: string;
  email: string;
  websiteUrl?: string;
  phone: string;
  tier: BuyerTier;
  verticals: VerticalId[];
  states: string[]; // ['ALL'] or 2-letter US state codes
  minRevenueM: number;
  minEbitdaM: number;
  maxEbitdaM: number;
  feeStructure: string;
  minimumFeeK: number;
  agreementStatus: FeeAgreementStatus;
  hasActiveDialogueCarveout: boolean;
  allowsListedDeals: boolean;
  recentAddonExample: string;
  guardrails: string;
}

export type FeeSchedulePreset = 'LEHMAN_321' | 'DOUBLE_LEHMAN' | 'FLAT_3_PCT';

export interface FeeAgreementParams {
  buyerName: string;
  sponsorName: string;
  signatoryName: string;
  signatoryTitle: string;
  targetVerticalsLabel: string;
  minEbitdaM: number;
  maxEbitdaM: number;
  feePreset: FeeSchedulePreset;
  minimumFeeK: number;
  tailMonths: number;
  carveOutBusinessHours: number;
  governingState: string;
  effectiveDate: string;
}

export interface SellerLead {
  id: string;
  company: string;
  verticalId: VerticalId;
  city: string;
  state: string;
  website: string;
  domain: string;
  ownerName: string;
  ownerTitle: string;
  email: string;
  phone?: string;
  emailVerification: EmailVerificationStatus;
  recipientEsp: 'Google' | 'Microsoft365' | 'Other';
  foundedYear: number;
  estRevenueM: number;
  estEbitdaM: number;
  teamSize: string;
  ownsRealEstate: boolean;
  credentialTag: string;
  dataSource: string;
  isOnMarket?: boolean;
  dealKillerFlags: string[];
  signals: ScoreSignals;
  stage: LeadStage;
  sentAt?: string;
  daysSinceLastTouch?: number;
  replySnippet?: string;
  askingPriceM?: number;
  notes: string;
}

export interface SendingInbox {
  id: string;
  email: string;
  domain: string;
  provider: 'Google Workspace' | 'Microsoft 365';
  warmupDay: number; // >= 14 required before full send
  warmupHealthPct: number;
  dailyColdCap: number;
  sentToday: number;
  bounceRatePct: number;
  spfOk: boolean;
  dkimOk: boolean;
  dmarcOk: boolean;
  redirectOk: boolean;
  trackingDisabled: boolean;
  status: 'Active' | 'Warming' | 'Paused (Bounce)';
}

export interface ExclusionRules {
  domains: string[];
  companies: string[];
  emails: string[];
}

export interface DailySplitAllocation {
  verticalId: VerticalId;
  targetCount: number;
}

export interface RankedBuyerMatch {
  buyer: BuyerMandate;
  priorityLabel: 'Primary Mandate' | 'Tier-2 Backup' | 'Tier-3 Monetization' | 'Alternate Fit';
  matchReason: string;
  warningNote?: string;
}

export interface LeadEligibilityResult {
  eligible: boolean;
  blockers: string[];
}

export interface DispatchAssignment {
  lead: SellerLead;
  inbox: SendingInbox;
  sendWindowEt: string;
  subject: string;
  email1PlainText: string;
  followupDay4PlainText: string;
  followupDay10PlainText: string;
  primaryBuyer: string;
  retirementScore: number;
}

export interface VerticalAnalyticsRow {
  verticalId: VerticalId;
  name: string;
  shortName: string;
  totalLeads: number;
  eligibleReady: number;
  sentCount: number;
  positiveReplies: number;
  callsOrIntros: number;
  positiveReplyRatePct: number;
  introConversionPct: number;
  verdict: 'Scale' | 'Optimize' | 'Pivot' | 'Pending Sample';
}
