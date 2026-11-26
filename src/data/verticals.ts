import { VerticalConfig, VerticalId } from '../types/os';

export const VERTICALS: VerticalConfig[] = [
  {
    id: 'dock_door',
    rank: 1,
    name: 'Commercial Overhead Doors & Loading Docks',
    shortName: 'Dock & Door',
    pilotStatus: 'Pilot A',
    targetSubSegments:
      'Commercial sectional/rolling steel doors, hydraulic dock levelers, cold-storage high-speed doors, and recurring warehouse PM contracts.',
    avoidSubSegments:
      'Pure residential garage-door installers and commercial GC new-construction subs (>60% bid work, no service fleet).',
    ebitdaMultipleRange: '5.5x – 7.5x',
    typicalRevenueRange: '$4M – $20M',
    typicalEbitdaRange: '$800K – $4.0M',
    competitionLevel: 'Low',
    credentialLabel: 'IDA Commercial / OEM Dock Dealer',
    buyerDescriptor: 'commercial loading dock and industrial door operator',
    activePlatforms: [
      'US Dock & Door (Soundcore Capital)',
      'North American Door & Dock (Guardian Capital)',
      'MINER Corp (OnPoint Group)',
      'DuraServ (Leonard Green)',
      'DH Pace / Vortex Doors',
    ],
    dataSources: [
      {
        name: 'IDA Member Directory (Commercial/Dock)',
        url: 'https://www.doors.org',
        extractionTip: 'Filter by Commercial/Industrial Rolling Steel & Dock Equipment.',
      },
      {
        name: 'OEM Authorized Dock Dealer Locators',
        url: 'https://www.ritehite.com/en/am/find-a-rep',
        extractionTip: 'Scrape Rite-Hite, Kelley, Serco, Blue Giant, Rytec, CornellCookson dealers.',
      },
      {
        name: 'AAADM Certified Automatic Door Directory',
        url: 'https://www.aaadm.com',
        extractionTip: 'Target commercial sliding/hospital entrance service companies.',
      },
      {
        name: 'CA CSLB D-28 / FL DBPR Specialty Boards',
        url: 'https://www.cslb.ca.gov',
        extractionTip: 'Cross-match licensed D-28 door/gate firms with Secretary of State officer names.',
      },
    ],
    dealKillers: [
      '>60% commercial new-construction GC bid work',
      'Non-assignable OEM territory franchise clause',
      'Single 3PL/warehouse customer >25% revenue',
    ],
    defaultDailyQuota: 30,
  },
  {
    id: 'cfesa_kitchen',
    rank: 2,
    name: 'Commercial Kitchen Equipment & Refrigeration (CFESA)',
    shortName: 'CFESA Kitchen',
    pilotStatus: 'Pilot B',
    targetSubSegments:
      'Independent hot-side cooking equipment (ovens, fryers, combis) & cold-side walk-in refrigeration/ice machine service for chains, hospitals, and grocers.',
    avoidSubSegments:
      'Pure restaurant supply wholesalers (box pushers), residential appliance repair, and hood fabrication without field techs.',
    ebitdaMultipleRange: '5.0x – 7.0x',
    typicalRevenueRange: '$3M – $18M',
    typicalEbitdaRange: '$750K – $3.5M',
    competitionLevel: 'Low',
    credentialLabel: 'CFESA Master Certified / OEM ASA',
    buyerDescriptor: 'commercial foodservice equipment and refrigeration service provider',
    activePlatforms: [
      'Smart Care Equipment Solutions (Wind Point)',
      'Tech24 (HCI Equity & Vestar)',
      'CoolSys (Ares Management)',
      'General Parts Group / EMR',
    ],
    dataSources: [
      {
        name: 'CFESA Member Directory',
        url: 'https://cfesa.com/find-a-member',
        extractionTip: 'Extract company, GM/owner, and Hot/Cold/Steam/Electric certifications.',
      },
      {
        name: 'OEM Authorized Service Agent (ASA) Locators',
        url: 'https://www.middleby.com',
        extractionTip: 'Scrape Hobart, Rational, Middleby, Welbilt, Manitowoc, Hoshizaki ASAs.',
      },
      {
        name: 'State Commercial Refrigeration Boards (TX TDLR / FL CMC)',
        url: 'https://www.tdlr.texas.gov',
        extractionTip: 'Filter Class A Commercial ACR contractors without residential branding.',
      },
    ],
    dealKillers: [
      '>40% low-margin OEM warranty-only dispatch',
      'Single restaurant chain >30% revenue',
      'Heavy ServiceChannel/Corrigo rate compression',
    ],
    defaultDailyQuota: 30,
  },
  {
    id: 'liquid_waste',
    rank: 3,
    name: 'Commercial Liquid Waste, Grease Traps (FOG) & Septic',
    shortName: 'Liquid Waste',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Route-based commercial grease interceptor pumping, lift-station maintenance, non-hazardous industrial wastewater hauling, and hydro-excavation.',
    avoidSubSegments:
      'Residential septic installation (construction cyclicality), event-only porta-potty rentals, and RCRA hazardous waste haulers.',
    ebitdaMultipleRange: '5.5x – 8.0x',
    typicalRevenueRange: '$3M – $20M',
    typicalEbitdaRange: '$800K – $4.0M',
    competitionLevel: 'Very Low',
    credentialLabel: 'State DEQ Permitted Liquid Waste Hauler',
    buyerDescriptor: 'commercial liquid waste and grease interceptor route operator',
    activePlatforms: [
      'Liquid Environmental Solutions (Goldman Sachs)',
      'Wind River Environmental (Gryphon Investors)',
      'P3 Services (Stellex Capital)',
      'Denali Water Solutions (TPG)',
    ],
    dataSources: [
      {
        name: 'Texas TCEQ Sludge Transporter CSV',
        url: 'https://www.tceq.texas.gov',
        extractionTip: 'Download public active transporter list with legal entity & physical yard address.',
      },
      {
        name: 'Florida DOH / NC DHHS / GA EPD Septage Permits',
        url: 'https://www.floridahealth.gov',
        extractionTip: 'Direct state CSV downloads of permitted commercial septage & FOG pumpers.',
      },
      {
        name: 'FMCSA SAFER USDOT Fleet Census',
        url: 'https://safer.fmcsa.dot.gov',
        extractionTip: 'Filter Liquids/Gases cargo, 5–35 power units to verify real commercial fleets.',
      },
    ],
    dealKillers: [
      'Aged vacuum truck fleet (>10 yrs, severe CapEx cliff)',
      'Phase I/II soil contamination at disposal yard',
      'Single municipal POTW dump-site dependency',
    ],
    defaultDailyQuota: 10,
  },
  {
    id: 'compressed_air',
    rank: 4,
    name: 'Industrial Compressed Air, Vacuum & Process Gas',
    shortName: 'Compressed Air',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Independent rotary-screw/centrifugal compressor distributors with recurring aftermarket parts, synthetic oil, and quarterly PM contracts.',
    avoidSubSegments:
      'Online-only parts resellers without field techs and consumer/auto-body piston compressor repair shops.',
    ebitdaMultipleRange: '5.5x – 8.0x',
    typicalRevenueRange: '$4M – $25M',
    typicalEbitdaRange: '$900K – $4.5M',
    competitionLevel: 'Very Low',
    credentialLabel: 'Authorized Industrial Compressed Air Distributor',
    buyerDescriptor: 'industrial compressed air and rotating-equipment service distributor',
    activePlatforms: [
      'Fluid-Aire Dynamics',
      'Atlas Copco (Programmatic Acquirer)',
      'Ingersoll Rand',
      'Applied Industrial Technologies',
    ],
    dataSources: [
      {
        name: 'OEM Industrial Air Dealer Networks',
        url: 'https://www.cagi.org',
        extractionTip: 'Scrape Kaishan, Sullair, Gardner Denver, Quincy, Kaeser, ELGi, Busch dealers.',
      },
      {
        name: 'FPDA & PTDA Distributor Directories',
        url: 'https://www.fpda.org',
        extractionTip: 'Filter members offering on-site 24/7 compressed air field service.',
      },
    ],
    dealKillers: [
      'Non-transferable single-OEM exclusivity conflict',
      '<35% aftermarket parts & PM service revenue mix',
      'Single auto/steel plant >30% revenue',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'water_treatment',
    rank: 5,
    name: 'Commercial & Industrial Water Treatment (AWT)',
    shortName: 'Water Treatment',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Route-based specialty chemical & ASHRAE 188 Legionella compliance programs for boilers, cooling towers, and closed-loop chillers.',
    avoidSubSegments:
      'Residential water softeners (Culligan/Kinetico) and civil municipal construction contractors.',
    ebitdaMultipleRange: '6.5x – 9.5x',
    typicalRevenueRange: '$3M – $15M',
    typicalEbitdaRange: '$800K – $3.5M',
    competitionLevel: 'Very Low',
    credentialLabel: 'AWT Member / Licensed Cooling Tower Biocide Applicator',
    buyerDescriptor: 'industrial boiler and cooling-tower water treatment firm',
    activePlatforms: [
      'Chardon Labs',
      'DuBois Chemicals (Altas Partners)',
      'Solenis (Platinum Equity)',
      'Kurita America / Chem-Aqua',
    ],
    dataSources: [
      {
        name: 'AWT (Association of Water Technologies) Directory',
        url: 'https://www.awt.org',
        extractionTip: 'Highest-signal roster of independent regional US water treaters.',
      },
      {
        name: 'State Commercial Biocide Applicator Lists (Cat 7G)',
        url: 'https://dec.ny.gov',
        extractionTip: 'Pull NY DEC 7G, TX TDA, FL FDACS commercial cooling-tower licensees.',
      },
    ],
    dealKillers: [
      'Founder personally manages >40% accounts with no CRM',
      'Chemical blending yard environmental spill history',
      'Single toll-blender formulation dependency',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'power_neta_egsa',
    rank: 6,
    name: 'Standby Power Generation & NETA Electrical Testing',
    shortName: 'NETA / Power',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Commercial diesel/gas generator PM, NFPA 110 load-bank testing, and independent NETA-accredited medium/high-voltage switchgear testing.',
    avoidSubSegments:
      'Residential Generac home-standby installers and low-margin commercial wiring/new-build electrical contractors.',
    ebitdaMultipleRange: '7.0x – 10.5x',
    typicalRevenueRange: '$4M – $25M',
    typicalEbitdaRange: '$1.0M – $5.0M',
    competitionLevel: 'Low',
    credentialLabel: 'NETA Accredited / EGSA Commercial Service',
    buyerDescriptor: 'critical power generation and electrical testing firm',
    activePlatforms: [
      'Shermco Industries (Gryphon Investors)',
      'RESA Power (Investcorp)',
      'Potomac Testing / TechPro Power Group',
      'Qualus (New Mountain) / GenServe (Aurora)',
    ],
    dataSources: [
      {
        name: 'NETA Accredited Company Directory',
        url: 'https://www.netaworld.org',
        extractionTip: '~250+ high-multiple independent third-party electrical testing companies.',
      },
      {
        name: 'EGSA Commercial Member Directory',
        url: 'https://www.egsa.org',
        extractionTip: 'Filter by Dealer/Distributor and Commercial Generator Service/Rental.',
      },
      {
        name: 'PEARL Switchgear Reconditioning Directory',
        url: 'https://www.pearl1.org',
        extractionTip: 'Target breaker & medium-voltage switchgear reconditioning shops.',
      },
    ],
    dealKillers: [
      'Unmodeled IBEW multi-employer pension withdrawal liability',
      '>70% one-off data center construction commissioning',
      'OEM dealer agreement restricting institutional ownership',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'pump_motor_easa',
    rank: 7,
    name: 'Industrial & Municipal Pump, Valve & Motor Repair (EASA)',
    shortName: 'EASA Pump/Motor',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Electro-mechanical repair shops rebuilding industrial electric motors, VFD drives, and municipal water/wastewater lift-station pumps with field service.',
    avoidSubSegments:
      'Fractional-HP pool/well-pump shops and pure CNC job shops with zero rotating-equipment aftermarket.',
    ebitdaMultipleRange: '5.0x – 7.5x',
    typicalRevenueRange: '$3.5M – $20M',
    typicalEbitdaRange: '$750K – $4.0M',
    competitionLevel: 'Very Low',
    credentialLabel: 'EASA Accredited Electromechanical Repair Shop',
    buyerDescriptor: 'industrial pump, motor, and rotating-equipment service center',
    activePlatforms: [
      'Tencarva Machinery (Bessemer Investors)',
      'PumpMan',
      'Integrated Power Services (Searchlight Capital)',
      'DXP Enterprises / Warren Equity',
    ],
    dataSources: [
      {
        name: 'EASA Member Directory',
        url: 'https://easa.com',
        extractionTip: '1,000+ US independent motor/pump/VFD repair shops with capability tags.',
      },
      {
        name: 'Hydraulic Institute / SWPA / OEM Service Centers',
        url: 'https://www.pumps.org',
        extractionTip: 'Scrape Goulds/Xylem, Flygt, Sulzer, Gorman-Rupp, ABB/Baldor centers.',
      },
    ],
    dealKillers: [
      'Solvent degreasing / varnish dip tank Phase II contamination',
      'Pure in-shop rewinding with zero field-service crew',
      'Declining legacy coal/paper mill customer base',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'overhead_crane',
    rank: 8,
    name: 'Overhead Crane, Hoist & Material Handling Inspection',
    shortName: 'Crane & Hoist',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'OSHA 29 CFR 1910.179 mandatory periodic bridge-crane inspections, load testing, breakdown repair, and radio/hoist modernizations.',
    avoidSubSegments:
      'Mobile hydraulic crane rental fleets (heavy CapEx/union) and pure pallet-rack brokers.',
    ebitdaMultipleRange: '5.5x – 7.5x',
    typicalRevenueRange: '$3M – $18M',
    typicalEbitdaRange: '$750K – $3.5M',
    competitionLevel: 'Very Low',
    credentialLabel: 'OSHA 1910.179 Inspector / MHEDA Member',
    buyerDescriptor: 'overhead bridge crane inspection and hoist service company',
    activePlatforms: [
      'Mazzella Companies',
      'Konecranes',
      'Ace Industries',
      'Wiese / Alta Equipment / Briggs',
    ],
    dataSources: [
      {
        name: 'MHEDA & MHI Member Directories',
        url: 'https://www.mheda.org',
        extractionTip: 'Filter overhead lifting, crane service, and material handling dealers.',
      },
      {
        name: 'AWRF (Associated Wire Rope Fabricators)',
        url: 'https://www.awrf.org',
        extractionTip: 'Rigging, sling inspection, and overhead crane safety providers.',
      },
    ],
    dealKillers: [
      '>60% custom steel-girder fabrication (lumpy project risk)',
      'EMR safety rating >1.15 or serious OSHA citations',
      'Heavy union millwright pension exposure',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'calibration_iso',
    rank: 9,
    name: 'ISO/IEC 17025 Calibration & Metrology Labs',
    shortName: 'ISO Calibration',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Accredited on-site & in-lab calibration of torque, dimensional, pressure, RF, pipettes, and industrial weighing scales for pharma, aero, and manufacturing.',
    avoidSubSegments:
      'Unaccredited handyman scale mechanics and pure test-equipment rental brokers.',
    ebitdaMultipleRange: '6.5x – 9.5x',
    typicalRevenueRange: '$2.5M – $15M',
    typicalEbitdaRange: '$750K – $3.5M',
    competitionLevel: 'Very Low',
    credentialLabel: 'A2LA / ANAB ISO/IEC 17025 Accredited Lab',
    buyerDescriptor: 'accredited ISO 17025 calibration and metrology laboratory',
    activePlatforms: [
      'Trescal (EQT Infrastructure)',
      'Transcat (NASDAQ: TRNS)',
      'JM Test Systems / Cross Company',
      'Michelli Weighing & Measurement',
    ],
    dataSources: [
      {
        name: 'A2LA Public Accredited Lab Directory',
        url: 'https://customer.a2la.org',
        extractionTip: 'Filter Program = Calibration, ISO/IEC 17025, Country = US (1,000+ labs).',
      },
      {
        name: 'ANAB Calibration Lab Search',
        url: 'https://search.anab.org',
        extractionTip: 'Pull lab director/owner name, phone, and exact accredited scope.',
      },
    ],
    dealKillers: [
      'Accreditation scope tied solely to retiring founder with no deputy',
      'Single aerospace/pharma customer >30% revenue',
      'Pending ISO audit corrective-action suspension',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'automation_csia',
    rank: 10,
    name: 'Industrial Automation, PLC/SCADA & Ammonia Controls (CSIA)',
    shortName: 'CSIA Controls',
    pilotStatus: 'Wave 2',
    targetSubSegments:
      'Independent PLC/HMI/SCADA integrators, UL-508A control panel builders, water-utility SCADA, and IIAR natural ammonia refrigeration controls.',
    avoidSubSegments:
      'General IT MSPs, pure wiring electrical contractors, and fixed-price custom robotics R&D shops.',
    ebitdaMultipleRange: '6.0x – 9.0x',
    typicalRevenueRange: '$4M – $25M',
    typicalEbitdaRange: '$1.0M – $5.0M',
    competitionLevel: 'Low',
    credentialLabel: 'CSIA Certified / UL-508A Panel Shop',
    buyerDescriptor: 'industrial automation and PLC/SCADA systems integrator',
    activePlatforms: [
      'E Tech Group (Graham Partners)',
      'Gray Solutions / Grantek',
      'Vertech / Revere Control Systems',
      'Falfurrias / Vance Street PE',
    ],
    dataSources: [
      {
        name: 'CSIA Industrial Automation Exchange',
        url: 'https://www.csiaexchange.com',
        extractionTip: 'Verified US control integrators with vertical & headcount filters.',
      },
      {
        name: 'UL Product iQ (UL-508A) & Rockwell/Ignition Locators',
        url: 'https://productiq.ulprospector.com',
        extractionTip: 'Cross-match UL-508A certified panel shops with Ignition/Rockwell partners.',
      },
    ],
    dealKillers: [
      'Fixed-price turnkey EPC contracts with historical margin fade',
      'Founder writes core PLC code with zero engineering bench',
      'Single OEM plant >35% backlog concentration',
    ],
    defaultDailyQuota: 0,
  },
  {
    id: 'legacy_hvac',
    rank: 11,
    name: 'Legacy Residential HVAC, Plumbing & Electrical',
    shortName: 'Legacy HVAC',
    pilotStatus: 'Legacy',
    targetSubSegments:
      '100% residential service, repair & replacement (SR&R) HVAC-anchored shops ($5M+ rev for SHS 24-state footprint; all 50 states for Redwood).',
    avoidSubSegments:
      'New construction, home warranty, multifamily/government bids, and shops under $3M rev without Tier-3 searcher match.',
    ebitdaMultipleRange: '5.0x – 8.0x',
    typicalRevenueRange: '$5M – $40M',
    typicalEbitdaRange: '$1.0M – $5.0M',
    competitionLevel: 'High (Saturated)',
    credentialLabel: 'Licensed Residential HVAC SR&R Operator',
    buyerDescriptor: 'residential HVAC, plumbing, and electrical service operator',
    activePlatforms: [
      'Southern Home Services (24-state HVAC mandatory)',
      'Redwood Services (All 50 states SR&R)',
      'Regional Funded Searchers ($750K–$1.5M EBITDA)',
    ],
    dataSources: [
      {
        name: 'State Mechanical/HVAC Boards (TX TDLR, FL DBPR, OH OCILB)',
        url: 'https://www.tdlr.texas.gov',
        extractionTip: 'Filter active residential mechanical licenses incorporated <=1996.',
      },
      {
        name: 'OEM Premier Dealer Locators (Trane, Carrier, Mitsubishi Diamond)',
        url: 'https://www.mitsubishicomfort.com',
        extractionTip: 'Target independent Diamond/Factory Authorized shops not yet PE-backed.',
      },
    ],
    dealKillers: [
      'New construction >15% or home warranty mix',
      'Light commercial >25% (fails SHS guardrail)',
      'Listed on BizBuySell / brokered (pays $0 under SHS fee agreement)',
    ],
    defaultDailyQuota: 15,
  },
];

export const VERTICAL_MAP: Record<VerticalId, VerticalConfig> = VERTICALS.reduce(
  (acc, v) => {
    acc[v.id] = v;
    return acc;
  },
  {} as Record<VerticalId, VerticalConfig>
);

export const SHS_ALLOWED_STATES = [
  'TX', 'LA', 'AR', 'MS', 'AL', 'TN', 'KY', 'GA',
  'FL', 'SC', 'NC', 'VA', 'WV', 'MD', 'DE', 'PA',
  'OH', 'IN', 'IL', 'MO', 'MI', 'WI', 'IA', 'KS',
];
