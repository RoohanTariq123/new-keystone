# Keystone Deal Partners — 2026-11-26 execution playbook
Prepared for Roohan Tariq. Seven buyer messages were saved as unsent Outlook Drafts in Roohan@keystonedealpartners.com (DuraServ, Guardian, Smart Care, PremiStar, Trivest, ShoreView, Stahler). No purchase, form submission, email send, credit usage, GitHub edit, domain or mailbox configuration was performed.

## Deliverables and evidence limits
- `keystone_target_research_2026-11-26.csv`: 108 company **candidates** (49 `dock_door`, 59 `cfesa_kitchen`), exact Outreach OS 13-field schema. Every source identifies a researched company/directory entry; public evidence does NOT yet establish all hard filters. Private revenue/EBITDA and unverified direct emails are blank. Do not classify all 108 as acquisition-qualified. A further 92 and verification would be needed to meet 200 fully qualified companies.
- `keystone_buyer_contacts_2026-11-26.csv`: 15 buyer/financial sponsor candidates, public individual and role contacts and qualification gaps. Seven publicly found **personal/direct** emails; others are role accounts or blank, **not** SMTP/mailbox verified.
- `keystone_15_buyer_outreach_drafts_2026-11-26.txt`: 15 buyer-specific messages under 140 words each, **not sent**.
- `keystone_domain_checklist_2026-11-26.csv`: five requested and five alternative .com names. **All ten availability states are UNVERIFIED**—no live registrar stock confirmation was returned.

## TASK 1: Gate every target before outreach
1. Exact priority geographies: OH, TX, PA, NC, FL, GA, IL, IN, MI, TN, VA, SC; exclude other states.
2. Require operating company, not branch/location. Keep a single company record keyed by normalized registrable domain plus legal parent.
3. For `dock_door`: check independent/family ownership and founded no later than 1996; commercial overhead door and loading dock maintenance/repair, at least 50% commercial service/PM (if not documented, mark **unknown**, not qualified); no residential-only shops; no sponsor-backed consolidators. Filter target revenues $4–20M **only if defensibly evidenced**; otherwise leave `revenue` blank.
4. For `cfesa_kitchen`: confirm *company's or relevant technician's actual CFESA certification*, not just appearing in the directory; minimum 10 technicians, founding no later than 1996, independently/family owned, commercial foodservice or refrigeration field service. Mark gaps `unknown`.
5. Ownership / latest acquisition: search exact company name plus `acquired`, `portfolio`, `private equity`, `investment`, `recapitalization`, 2023–2026. Cross-check company announcement, sponsor portfolio and Secretary of State current entity. Exclude acquired/subsidiary entities. Examples of confirmed exclusions: TexDoor (DuraServ acquired Nov 2026), Whaley Foodservice (2016), K&D Factory Service (2021), AIS units operated by Tech24. Preserve source URLs in CSV.
6. Owner name: current full legal name from About, Leadership, state company filings, or first-person verified source, not guessed from the last name of company. Blank when not verified. Owner email: only published personal direct email from company source; blank otherwise. No generic `info@`, `service@`, `office@`, `sales@`, `dispatch@`.
7. For proprietary figures (`revenue`, `ebitda`, `realestate`), use verified financials or explicit owner statement; never substitute made-up ranges. For `founded`, accept documented year, not claims like `30+ years` without date when uncertain. Maintain separate QA notes outside strict 13-field import to record outstanding verification.

Sources: https://cfesa.com/service-locator/ ; https://www.prnewswire.com/news-releases/duraserv-expands-wholesale-distribution-and-commercial-door-presence-with-texdoor-acquisition-302949708.html

## TASK 2: 7-day buyer cadence (do not distribute target identities before terms)
**Today, 26 Nov 2026**: Send *individually*, after reviewing compliance footer, to Christian Foust at DuraServ, Christopher Fugaro at Guardian, Jeff Sandager at Smart Care, Bill Tamul at PremiStar, Robert Crapsey at Trivest, Garrett Davis at ShoreView. The buyer CSV has the cited evidence and contacts. Add Kevin Stahler at Stahler Capital as a lower-EBITDA test, especially TX/FL/NC/SC. He publicly describes a fully funded search targeting roughly $0.8–$2.5M EBITDA (`ks@stahlercapital.com`), but his sector scope could exclude commercial field services; ask first. Do not assume any buyer accepts third-party success fees.

**Day 1**: Ask for current acquisition criteria, geographic gap, minimum EBITDA, independent originator policy, fee payer legal entity and named-signatory authority. Share one-page term sheet, not seller names.
**Days 2–3**: Short individual follow-up, one buyer-specific reason for fit; contact portal-only parties via public channels (DH Pace, MINER, PremiStar if email fails, Pacific Lake, Search Fund Partners). User presses Submit. Prioritize actual operating buyers over fund-of-searchers investors, who might only introduce a searcher.
**Days 3–4**: Confirm buyer referral/fee policy and ask legal teams to review short non-exclusive terms. Store a signed PDF and timestamps before identifying an owner.
**Days 5–7**: Follow up once with decisionmakers who expressed interest; if terms are legally cleared, begin introductions only for appropriately qualified targets.

Suggested commercial term sheet (subject to M&A counsel): $0 retainer; non-exclusive; payment at deal close; **one** selected schedule: (a) 3% first $5M, 2% next $10M, 1% above $15M, OR (b) flat 3%, each subject to a negotiated $100K–$125K minimum. Do not give buyers a fee schedule that ambiguously combines the two. Define transaction value to address cash, debt, seller notes, rollover, earnouts (when paid), and real estate exclusion. Buyer identity/affiliates and documented written introduction notice; detailed seller privacy and contact consent. **Within 48 elapsed hours** of written introduction, buyer may exclude only a target with evidence of prior two-way substantive M&A dialogue with the owner in the past 6 months; passive CRM entries, unanswered email and purchased lead lists don't qualify. Define if the clock is business hours instead (which is not the same thing). 24-month protection/tail for actual properly introduced targets, with survival after termination. Include dispute, governing law, indemnification/registration compliance negotiated by attorney.

DO NOT promise 4–6 executed agreements by Day 7; this is a KPI, dependent on counterparties and attorney approval. All first emails and contact forms need truthful identity, physical postal business address, working opt-out method, and privacy/anti-spam compliance before transmission. Do not invent an address. USA CAN-SPAM applies to commercial B2B campaigns; counsel should evaluate cross-border laws and state laws too. https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business

## TASK 3: Domain purchase and Google Workspace / Microsoft 365 / Smartlead setup
**Live lookup (all currently UNVERIFIED)**: https://porkbun.com/products/domains → click `bulk` → choose `Domain List` → paste one per line:
```
keystonedealgroup.com
keystonedealco.com
keystonedealadvisors.com
getkeystonedeal.com
keystonedealhq.com
```
→ click magnifying glass Search. Porkbun will report actual availability and prices. For available .com names use `+` to add to cart → `Checkout` → check exact spelling + first-year/renewal price/premium tag → `Continue to Billing` → YOU sign in, authenticate and pay. Do not assume current availability from absence in search indexing. Possible replacements to verify similarly: `keystonedealsourcing.com`, `keystoneorigination.com`, `keystonedealteam.com`, `keystonebuyergroup.com`, `keystonedealconnect.com`.

**Choose domain assignments (only after purchase)**:
- Google Workspace (three domains, two distinct licensed mailbox users per domain): `keystonedealgroup.com`, `keystonedealco.com`, `keystonedealadvisors.com`. Google Admin `admin.google.com` → Account → Domains → Manage domains → Add a domain → Add another domain **as secondary**, not an alias → add DNS TXT ownership verification in Porkbun Domain Management → DNS → Add Record → Google Verify. After Google shows Verified, add its exact MX records in registrar DNS, and Admin → Directory → Users → Add new user → select secondary domain; do this twice per domain and assign 6 paid user licenses. Do not create invented employee personas; use true named mailboxes with real identities, e.g. `roohan@domain` and `r.tariq@domain`, both representing Roohan transparently. Do not overwrite primary domain `keystonedealpartners.com` DNS.
- Microsoft 365 (two domains, two distinct licensed users per domain): `getkeystonedeal.com`, `keystonedealhq.com`. At `admin.microsoft.com` → Settings → Domains → Add domain → verify through DNS TXT at Porkbun → follow displayed MX and DNS setup → Users → Active users → Add a user; choose each domain and assign an Exchange Online mailbox license (four total). Use real identities. Exact MX and DKIM targets must be copied from the live tenant and cannot be precomputed.

**DNS template for EACH Google Workspace domain** (use `@` to mean root/apex):
```
TXT @        v=spf1 include:_spf.google.com ~all
MX  @        [copy EXACT MX target/priority from your Google Admin onboarding]
TXT google._domainkey [paste Google-generated 2048-bit DKIM TXT public key, may use another selector]
TXT _dmarc  v=DMARC1; p=quarantine; rua=mailto:dmarc@keystonedealpartners.com; adkim=r; aspf=r; pct=100
```
**DNS template for EACH Microsoft 365 domain**:
```
TXT @        v=spf1 include:spf.protection.outlook.com -all
MX  @        [copy EXACT MX target/priority from Microsoft 365 Admin]
CNAME selector1._domainkey [copy tenant-specific Microsoft 365 target]
CNAME selector2._domainkey [copy tenant-specific Microsoft 365 target]
TXT _dmarc   v=DMARC1; p=quarantine; rua=mailto:dmarc@keystonedealpartners.com; adkim=r; aspf=r; pct=100
```
- Only ONE SPF TXT record per domain; merge records if there are additional sending services, never stack multiple SPF TXT strings. Set DKIM to **enabled** within Google Admin Gmail Authentication and Microsoft Defender Email Authentication for each domain. User's DMARC `p=quarantine` is appropriate only after testing SPF/DKIM alignment. If DNS is not ready, start with `p=none`, test, then switch to the user's requested quarantine value. Confirm the `dmarc@keystonedealpartners.com` reporting inbox exists and can accept aggregate reports.
- For web redirects only: Porkbun Domain Management → Details → URL Forwarding → Add URL Forward → destination `https://keystonedealpartners.com/` → option `Permanent (301)` (not default temporary) → apply for both apex and `www` where available. Do not disturb MX, DKIM, SPF or DMARC. If the forwarding feature is incompatible with existing web A/CNAME, remove conflicting *web* records only after confirming consequences. Test HTTP and HTTPS forwarding. Porkbun help: https://kb.porkbun.com/article/39-how-to-set-up-url-forwarding
- Send one normal test email from each mailbox to Gmail and Outlook; inspect message headers (`Authentication-Results`) for SPF=pass, DKIM=pass, DMARC=pass; verify inbound replies to all ten mailboxes.

**Smartlead** (alternative Instantly): Smartlead → Sender Accounts → Email Accounts → Add Account → Google or Microsoft OAuth → connect each of ten, grant OAuth consent yourself; confirm that each mailbox authenticates and sends/receives. On each sender → Warmup Settings → Enable Warmup → Daily Ramp-up, start conservatively (around five/day), grow to 20–30 total messages/day over 14–21 days if authentication and reply health stay good; use 35% *warmup* reply rate only if available, not a guarantee of real reply rate. When campaign live, allocate maximum **10–15 cold emails/inbox/day**, adjust warmup so provider/Smartlead total remains reasonable. Caution: Smartlead documentation distinguishes warmup vs campaign counts; review totals rather than assuming one shared quota.
- Campaigns → New Campaign → Upload verified, not entire candidate CSV → set all steps **plain-text**; settings `Disable Open Tracking` and `Disable Click Tracking` = ON, or Open and Click Tracking = OFF; no links/attachments in first-touch emails. Random time spacing, real timezone/local business hours, daily cap 10–15 cold/inbox, recipient dedup and account suppression, stop on reply/opt-out. Pause sender/domain when bounce rate reaches **2.0%**, and investigate earlier at **1.5%** or concerning numbers. Control cold volume 5 → 10 → 15 per inbox after genuine health signals; ten inboxes at 10 sends each supports *up to* 100/day **only once warmed and qualified**, not on day one. Avoid trying to force a 35% actual prospect reply rate; it is not a controllable switch.
- Instantly alternative: Email Accounts → Add account → OAuth → enable flame icon for Warmup → warmup settings Reply Rate 35% if desired and supported; Campaign Settings → Open tracking OFF; Click tracking OFF; text-only first touch; adjust campaign account caps similarly. Some platforms have minimum/default warmup limits; obey them rather than mechanically forcing 5/day.

Public docs:
https://kb.porkbun.com/article/212-how-to-register-a-domain-at-porkbun
https://knowledge.workspace.google.com/admin/domains/add-a-user-alias-domain-or-secondary-domain
https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider
https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure
https://helpcenter.smartlead.ai/en/articles/52-how-to-set-up-warmup-settings-for-a-smartlead-mailbox
https://help.instantly.ai/en/articles/7988514-warmup-settings

## TASK 4: Owner email enrichment + MillionVerifier
**No paid search/export or email reveal executed**. Do not run any credit-consuming search, export, enrichment, or personal-contact access without the user's prior explicit approval.
1. Open candidate CSV and manually research/screen first, marking ownership and hard-filter gaps in a QA copy. Keep original 13-column schema for clean import later. A directory listing with no confirmed owner/company commercial mix is not a qualified target.
2. Clay: New table → Import → CSV → upload file → map `company`, `website`, `city`, `state`, `owner`. Find Company/Domain and People Search with `owner`, `president`, `founder`, `CEO`, `managing partner`. Return the source URL for full name/role and verify its current role. Enrich people with `Work Email` on source-matched name + domain, not pattern-guessed addresses. Alternatively in Apollo use People Search → filters location/company/role → match specific company and named owner; in Prospeo use Email Finder with verified full name + business domain. Providers may use credits and need your prior approval.
3. Only owner-linked work emails enter staging. If no verified owner name or no plausible personal email, leave blank, do not generate `info@`/`service@`/`office@`/`dispatch@` as an ersatz substitute. Dedup exact email, website/domain and company before verification; honor objections/opt-outs. Preserve source and full owner name.
4. Export staged table as CSV including `email`, `company`, `owner`, `website`, `source`. MillionVerifier login → `Email Verification` → `File Upload` or direct `https://app.millionverifier.com/email_verify#file-upload` → select CSV → verify; follow displayed billing/credits, which require your click. MillionVerifier retains added custom columns in its result report. 
5. After completion → `Download Reports` → select `Good Emails Only` (`Ok` status) or Full Report and filter `status = ok`; explicitly exclude `Catch-all`, `Unknown`, `Invalid`, `Disposable`, and flagged `Role` email, and any role local-part such as `admin`, `support`, `service`, `office`, `info`, `sales`, `dispatch`, `contact`, `help`. Exclude `Free` emails if your policy is business-domain-only; do not reject genuine founder Gmail without review if you broaden policy.
6. Join resulting Good records to original company via stable email + domain (not fuzzy company only), preserve exact `company,vertical,owner,email,city,state,website,founded,revenue,ebitda,realestate,credential,source` output headers. Keep Mailbox Verified date in an external QA sidecar (or internal Outreach OS metadata), not by breaking schema. Re-verify stale addresses before campaign. A `Good/Ok` result reduces bounce risk but **cannot guarantee <1.5%**; monitor bounces and stop early.

Official docs: https://help.millionverifier.com/bulk-email-verification/upload-emails-for-verification ; https://help.millionverifier.com/bulk-email-verification/managing-your-email-verification-results

## TASK 5: GitHub asset and five legal review points
**Local asset removal** (not run):
```bash
git checkout main
git pull --ff-only
git rm "public/assets/aistudio/Keystone_Southern_BuysideAgreement__1___4__a92c7f32.pdf"
git commit -m "Remove outdated third-party buyside agreement PDF from public assets"
git push origin main
```
**Important** `git rm` removes from current commit/tree, not all Git history. If the PDF contains confidential data or must be irretrievable, ask a maintainer to coordinate full history rewrite using `git filter-repo`, force-push affected refs, invalidate deployed caches/public URLs, check forks/clones, then rotate exposed secrets as necessary. Treat repo `public/assets` as browser-public even if repository itself is private when deployed.

**Send this five-point checklist to a qualified US M&A/broker-dealer attorney together with your non-exclusive draft:**
1. **Lawful compensation**: Confirm federal Exchange Act §15(b)(13) M&A broker exemption eligibility **and each relevant state's separate broker/finder/real estate rules**, considering a Pakistan-based advisor, buyer-side origination, success-contingent fees, negotiating role, securities/assets and acquisition financing. The statutory exemption is conditional; size under $25M EBITDA / $250M revenue is not by itself enough. Confirm entity and tax/payee structure.
2. **Fee mechanics**: Choose 3%-2%-1% across explicit deal-value tiers OR flat 3%, with $100K–$125K minimum; define aggregate transaction value, assumed debt, rollover equity, earnouts, escrow, seller notes, asset vs equity deals, exclusions for separately sold real property, when each fee is earned/paid, and tax withholding.
3. **Prior relationship objection**: Define qualifying documented **two-way owner-specific active M&A dialogue** within last six months, a clear **48 elapsed-hour objection window** following authenticated written introduction notice, supporting evidence requirements, and explicit exclusion of passive CRM entries or one-way outreach. Cure process for false disputes.
4. **Tail and protection**: Precise Introduced Target definition; 24-month protection from introduction and survival beyond termination; treatment of affiliated buyers, successor entities, add-ons, asset deals, control changes, seller affiliates, non-circumvention and confidentiality.
5. **Execution and enforcement**: Buyer signatory authority and fee debtor identity, governing law/dispute forum, limitation of liability/indemnity, conflict and non-exclusivity, privacy/consents/anti-spam, sanctions/tax and cross-border enforceability; confirm the agreement is safe to send for signature.

Statutory source: https://www.govinfo.gov/content/pkg/USCODE-2024-title15/html/USCODE-2024-title15-chap2B-sec78o.htm

## Browser permissions status
Connected Chrome tab list could be read, but this Chat session offers **tab reading only**; it cannot navigate, fill registration forms, click Submit, purchase domains, configure DNS, or create user mailboxes. No login, 2FA, card, submit or send step has been completed. Work mode provides browser-control interaction when supported. A security block also prevented inspecting the open ChatGPT tab, and no workaround was attempted.
