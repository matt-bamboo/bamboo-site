import fs from "node:fs";
import path from "node:path";

const outDir = path.dirname(new URL(import.meta.url).pathname);
const accessed = "2026-07-14";
const title = "Executive Job Engine: Competitive Landscape & Commercial Opportunity Review (July 2026)";

function parseTsv(text, headers) {
  return text.trim().split("\n").filter(Boolean).map((line, index) => {
    const values = line.split("\t");
    if (values.length !== headers.length) {
      throw new Error(`TSV row ${index + 1}: expected ${headers.length} fields, got ${values.length}`);
    }
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, headers) {
  return [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n") + "\n";
}

const competitorHeaders = [
  "product_company", "url", "category", "relationship", "positioning_target", "public_pricing",
  "core_workflow", "ai_model", "privacy_posture", "strengths", "weaknesses", "likely_moat",
  "engine_overlap", "evidence_confidence", "sources"
];

const competitors = parseTsv(String.raw`
Teal / Teal Labs	https://www.tealhq.com/	Integrated career OS and tracker	Direct	Organized job-search power users; master-resume-centered workspace.	Free; Teal+ $13/7 days, $29/30 days, $79/90 days.	Master resume and tailored views, match scoring, browser capture, job/contact/interview tracking, autofill and outreach.	Model not publicly named on reviewed pages.	Privacy policy covers resumes, postings, notes and application data; current policy accessed.	Mature integrated workspace and readable workflow.	Keyword/document centered; no public official-source provenance, compensation or relocation logic.	Brand, mature workflow/data model and accumulated usage patterns (analyst inference).	Very high: tracking, capture, matching, materials, contacts and interviews; Career Canon and decision controls remain gaps.	H	https://www.tealhq.com/pricing; https://help.tealhq.com/en/articles/14435724-how-to-build-your-resume-in-teal; https://www.tealhq.com/privacy-policy
Huntr / Huntr Co.	https://huntr.co/	Integrated career OS and tracker	Direct	Individuals and career-service organizations seeking a job-search CRM.	Free; Pro $40/month, $90/3 months, $160/6 months.	Resume tailoring, application packets, browser capture, job/contact/interview CRM, metrics, autofill, cover letters and match insights.	Model not publicly named.	Says it does not sell personal data and controls employer/organization visibility through consent.	Strong workflow plus an institutional channel.	No public evidence canon, source provenance or executive economics.	B2B distribution, CRM maturity and tracked-job research corpus (analyst inference).	Very high across tracking, documents and application management; weaker on executive decision intelligence.	H	https://huntr.co/pricing; https://huntr.co/product/job-tracker; https://huntr.co/privacy
Simplify / Simplify Jobs	https://simplify.jobs/	Discovery, autofill and tracking	Direct	Broad and often high-volume applicants who want speed.	Free; Simplify+ $19.99/week, $39.99/month, $89.99/3 months.	Personalized jobs, Copilot autofill, automatic tracking, AI tailoring, cover letters, application answers, outreach and job-popularity data.	Model not publicly named; AI drafts remain editable.	Public privacy policy is dated 2021 and does not adequately explain the newer AI suite.	Excellent application-surface compatibility and low-friction capture.	Thin executive judgment and stale privacy disclosure.	Browser integrations, behavioral/application data and distribution (analyst inference).	High on discovery, materials, outreach and tracking; low on evidence canon and deliberate decisions.	M	https://help.simplify.jobs/en/help/articles/5623502-whats-included-in-simplify-features-and-pricing; https://help.simplify.jobs/en/articles/8040103-building-and-tailoring-your-resume-on-simplify; https://simplify.jobs/privacy
Careerflow / Careerflow.ai	https://www.careerflow.ai/	Broad career copilot	Direct	Individuals, universities, bootcamps, coaches and outplacement providers.	Free; Premium $23.99/month; Premium Plus $44.99/month; lower effective quarterly/annual rates.	Large job portal, browser capture, tracker, ATS resumes, LinkedIn, cover letters, networking and mock interview/video analysis.	Model not publicly named.	Privacy policy covers interview media, analytics/session replay and advertising; FAQ claims encryption and no employer sharing without consent.	One of the broadest candidate suites with organizational distribution.	Optimizes content more than provenance, executive economics or claim governance.	Suite breadth and B2B channel (analyst inference).	Very high surface overlap; limited public evidence of source-first canon or decision architecture.	H	https://www.careerflow.ai/premium; https://www.careerflow.ai/faq; https://www.careerflow.ai/privacy
Jobscan / Jobscan	https://www.jobscan.co/	ATS optimization and approval-first assisted applying	Direct	Applicants focused on ATS fit; also coaches.	Premium $49.95/month or $89.95/quarter; Auto Apply credits sold separately.	ATS matching, resume/LinkedIn optimization, cover letters, job tools and 2026 Auto Apply that drafts grounded answers and requires review before submission.	Provider/model not disclosed on reviewed pages.	Public privacy/GDPR material provides access, deletion and portability rights; model-use detail is limited.	ATS credibility and a notably approval-first application flow.	No public Career Canon, claim lineage, executive compensation or relocation logic.	Long-standing ATS brand, benchmark data and coach distribution (analyst inference).	Extremely high in matching, documents and controlled application execution.	H	https://www.jobscan.co/auto-apply; https://www.jobscan.co/blog/jobscan-vs-teal/; https://www.jobscan.co/gdpr
Rezi / Rezi, Inc.	https://www.rezi.ai/	AI resume and ATS specialist	Partial	Applicants who want fast, ATS-oriented document production.	Free; Pro $29/month or $19/month quarterly; Lifetime $149.	Resume Agent, imports, JD targeting, bullets, summaries, cover letters, job search, interview practice and monthly human review on Pro.	Public builder material identifies ChatGPT.	Legal terms cover stored content, vendors, deletion and optional public URLs; users can work without an account with less storage.	Focused ATS production and human review.	Document generator rather than an opportunity evidence and decision system.	ATS specialization, templates and user base (analyst inference).	High on resume production; low on source capture, canon, approvals and tracking.	H	https://www.rezi.ai/rezi-docs/rezi-subscription-plans-explained; https://www.rezi.ai/ai-resume-builder/; https://www.rezi.ai/legal
Resume Worded / Resume Worded	https://resumeworded.com/	Resume and LinkedIn scoring	Partial	Applicants, coaches and resume writers seeking diagnostic feedback.	Free; Pro $49/month, $99/quarter, $229/year; coach plans from $149/month billed yearly.	Line-level review, Targeted Resume, missing keywords, LinkedIn review, AI rewrites and white-label coach exports.	OpenAI, Gemini and Anthropic are named; exact routing is not public.	Privacy says providers are contractually barred from training on user data.	Strong feedback, recruiter-derived checks and unusually transparent multi-model posture.	No discovery, approval workflow, compensation logic or broad application OS.	Scoring corpus, reputation and B2B coach tools (analyst inference).	Meaningful overlap with multi-model critique and resume validation.	H	https://resumeworded.com/get-pro; https://resumeworded.com/business-plans-checkout; https://resumeworded.com/privacy
Kickresume / Kickresume	https://www.kickresume.com/	Resume and cover-letter builder	Partial	Mass-market international job seekers.	Free; Premium $24 monthly, $54 quarterly, $96 yearly.	Templates, AI Writer, ATS checker, Career Map, LinkedIn/PDF import, apps and personal websites.	AI Writer identifies OpenAI GPT-4.1.	EU controller; says it does not share data with third parties absent direction, identifies OpenAI processing and employer sharing by consent.	Strong design, mobile experience and career-map UX.	Little discovery, tracking, evidence capture or executive judgment.	Templates, international brand and distribution (analyst inference).	Documents and planning only.	H	https://www.kickresume.com/en/pricing/; https://www.kickresume.com/en/ai-resume-writer/; https://www.kickresume.com/privacy/?embedded=1
Enhancv / Enhancv	https://enhancv.com/	Resume and cover-letter builder	Partial	Design-conscious applicants who want collaboration and tailoring.	Basic $4.99/month; Pro $19.99 monthly, $44.97 quarterly, $65.94 semiannually; locale varies.	Visual resumes, one-click JD tailoring, ATS checks, cover letters and collaborator feedback.	AI page identifies OpenAI/ChatGPT and says resume data is not used for training.	Privacy policy covers career data and service providers.	Strong document design, feedback and fast variants.	Not a career OS; visual emphasis can distract from evidence discipline.	Brand, design templates and acquisition funnel (analyst inference).	Resume variants and feedback only.	H	https://enhancv.com/pricingb.html; https://enhancv.com/ai-resume-builder/; https://enhancv.com/privacy/
Resume.io / Career.io / Talent Inc.	https://resume.io/	Career platform and document builder	Partial	Mass-market job seekers; broad affiliate human-service ecosystem.	Region-specific; reviewed UK page £2.95 seven-day trial then £19.95/four weeks, or £49.95 quarterly.	Resume/cover-letter builder, AI phrases, tracker with salary/notes/attachments, jobs and interview prep; sits inside Career.io with TopResume and related services.	Model not publicly named.	Privacy policy covers broad affiliates, advertising and data sharing.	Scale, brand, tracker and cross-sell into human services.	Commodity core, complex affiliate/data ecosystem and regional pricing.	SEO distribution, brand portfolio and service cross-sell (analyst inference).	Documents, tracking and interview preparation; weak source and canon controls.	M	https://resume.io/pricing; https://help.resume.io/en/articles/3786112; https://resume.io/privacy
Hiration / Hiration	https://www.hiration.com/	Career suite	Partial	Individuals and career centers.	Free; $24.99 monthly, $49.99 quarterly, $99.99 yearly.	Resume builder/review, JD matcher, interview evaluation, cover letters, LinkedIn and job portal.	Model not publicly named.	April 2026 privacy policy covers resumes, US processing, vendors, advertising, FERPA and user rights; site claims SOC 2 and encryption.	Broad suite, manual review and institutional offering.	No public source provenance, Career Canon or executive decision logic.	Career-center distribution and workflow breadth (analyst inference).	High on documents/interviews and B2B channel; low on evidence and decisions.	H	https://www.hiration.com/app/pricing; https://www.hiration.com/; https://www.hiration.com/privacy/
Zety / Bold Limited	https://zety.com/	Guided resume and cover-letter builder	Partial	Mass-market applicants needing structured completion.	Free TXT; $1.95 14-day trial then $25.95/four weeks; $71.40/year.	Guided content, templates, checks, job matching and digital resumes.	Model not publicly specified.	June 2026 privacy policy covers Bold affiliates, resume/behavior data and job sites; terms describe optional public resume posting.	Brand, SEO and guided completion.	Auto-renew/public-posting complexity; no evidence or decision layer.	Traffic funnel, templates and affiliate ecosystem (analyst inference).	Documents and lightweight matching only.	H	https://zety.com/pricing; https://zety.com/privacy-policy; https://zety.com/terms-of-service
SkillSyncer / SkillSyncer	https://skillsyncer.com/	ATS matching utility	Partial	Price-sensitive applicants who want keyword-gap diagnostics.	Free; Premium $14.95/month or $11.62/month quarterly.	Resume/JD comparison, keyword gaps, match scores, auto-optimization, bullets, history and basic tracking.	Model not publicly named.	Privacy policy permits service-provider, affiliate, partner and advertising disclosures; FAQ promises encryption/deletion.	Focused, inexpensive and easy to understand.	Utility rather than operating system; thin privacy/model specificity.	Matching heuristics and search distribution (analyst inference).	Fit/gap and ATS optimization only.	M	https://skillsyncer.com/pricing; https://skillsyncer.com/privacy
Resume Genius / Sonaga Tech	https://resumegenius.com/	Guided resume builder and job board	Partial	Mass-market applicants.	Free TXT; $2.95 14-day trial then $23.95/four weeks; $95.40/year.	Resumes, cover letters, checks/reviews, digital resumes and job listings.	Feature copy identifies GPT-4 for summaries.	February 2026 privacy policy covers resume, job and usage data; training detail not found.	High traffic, strong guided creation and broad content.	Commodity output and auto-renew model; no workflow depth.	SEO, brand and content funnel (analyst inference).	Documents only.	H	https://resumegenius.com/pricing; https://resumegenius.com/privacy-policy
EarnBetter / EarnBetter (EarnIn)	https://earnbetter.com/	Free end-to-end career tool	Direct	Broad and value-sensitive job seekers.	Free.	Millions of jobs, unlimited tailored resumes and cover letters, matching, alerts, interview prep, external-job import and an AI tracker recommending actions.	Providers unspecified; terms permit third-party AI.	2023 privacy policy covers resumes, target compensation, analytics/advertising and employer sharing with consent.	Free integrated workflow and EarnIn distribution.	Mass-market positioning, older privacy disclosure and unclear standalone economics.	Distribution and marketplace economics (analyst inference).	High surface overlap at a zero-dollar price anchor.	M	https://earnbetter.com/; https://earnbetter.com/custom-docs/; https://earnbetter.com/privacy/; https://earnbetter.com/tos/
WonsultingAI / Wonsulting	https://www.wonsulting.com/wonsultingai	Guided career OS	Direct	Applicants attracted to creator-led job-search guidance.	Free; Premium $19.99/month.	Staged plan, ResumeAI, CoverLetterAI, NetworkAI, large job board, tracker, InterviewAI, contact/cold-email tools and learning.	Providers not publicly named.	Privacy policy says no sale but permits sharing extensive user data with third-party AI tools to train/refine models.	Journey guidance, outreach tooling and a strong community/content brand.	Permissive AI-data language; no source provenance or Career Canon.	Creator audience, community and structured playbook (analyst inference).	Very high surface overlap, with a weaker trust posture.	H	https://www.wonsulting.com/pricing; https://www.wonsulting.com/privacy-policy
Jobright / Jobright AI	https://jobright.ai/	AI job marketplace and copilot	Direct	Broad US job seekers, including visa-sensitive and senior users.	Exact current public price unverified; vendor pages show conflicting $19.99/$29.99 monthly references.	Large job hub, AI matching, autofill, rapid tailoring, Orion coaching, insider/referral paths, H-1B, compensation and executive filters.	June 2026 privacy policy names OpenAI, Anthropic, Google Cloud AI and AWS AI.	Policy limits normal post-account retention to six months and tightly limits Gmail use; marketplace visibility rules are explicit.	Strong discovery/opportunity intelligence and unusually detailed AI-provider disclosure.	No public full-posting evidence, Career Canon or version/approval architecture.	Job graph, distribution and marketplace data (analyst inference).	Extremely high across discovery, fit, resumes, referrals and interviews.	M	https://jobright.ai/; https://jobright.ai/jobs/search; https://jobright.ai/legal/privacy
Sonara / Bold Limited	https://www.sonara.ai/	Autonomous application agent	Substitute	Applicants prioritizing hands-off volume.	Not publicly disclosed on reviewed pages.	Continuously finds matches and applies automatically; current site carries Bold and Monster/CareerBuilder partner branding.	Model not publicly specified.	Public product copy does not clearly explain application-level evidence, review safeguards or current AI-data use.	Cloud convenience and distribution.	Black-box volume, brand ambiguity and employer-action risk.	Automation infrastructure and distribution (analyst inference).	Discovery and applications, but opposite to approval-first trust positioning.	L	https://www.sonara.ai/
LoopCV / LoopCV	https://www.loopcv.pro/	Automated discovery, applying and outreach	Substitute	Applicants seeking inexpensive high-volume automation.	Free; paid from €9.99/month.	Daily scanning across 30+ boards, matching, tailored CVs, auto-apply, recruiter emails, follow-up, ATS checking, mock interviews, tracking and API.	Provider not publicly named.	Privacy permits sharing needed to complete applications and supports export/deletion; detail is relatively sparse.	Inexpensive automation, outreach and API breadth.	Volume/reputation risk and limited control detail.	Integrations and aggregation (analyst inference).	Broad on discovery/tracking/outreach; conflicts with no automatic employer actions.	M	https://www.loopcv.pro/pricing/index.html; https://blog.loopcv.pro/how-loopcv-works/; https://www.loopcv.pro/en/privacy/
LazyApply / LazyApply	https://lazyapply.com/	Browser auto-apply	Substitute	High-volume applicants using common boards and ATSs.	Basic $99/year; Premium $149/year.	Job GPT applies on Greenhouse, Dice, Indeed and ZipRecruiter with autofill and multiple resumes.	Model detail limited.	Privacy permits broad vendor/marketing sharing and international transfers; Google API data is excluded from generalized AI training, but some data may be retained up to six years.	Cheap volume and simple browser execution.	Long retention, platform-terms risk and weak quality controls.	Form automation integrations (analyst inference).	Application execution only; opposite trust posture.	M	https://lazyapply.com/; https://lazyapply.com/privacy
Massive / Massive	https://usemassive.com/	Autonomous application service	Substitute	Applicants wanting vetted opportunities plus hands-off execution.	Exact public price not disclosed.	Hand-vetted jobs, matching, up to 200 applications/month, tailored materials, hiring-team messages, visa filters, preview-before-send, manual mode and Autopilot.	Model not publicly specified.	May 2026 privacy policy covers relocation/work authorization, proxy email, Gmail access/replies, encrypted OAuth tokens, inferences and behavioral-advertising sharing.	Polished automation and submission visibility.	Sensitive mailbox access and automatic employer-action/reputation risk.	Application and communications infrastructure (analyst inference).	Broad overlap but opposite approval philosophy.	H	https://usemassive.com/; https://usemassive.com/privacy
scale.jobs / scale.jobs	https://scale.jobs/	Human application delegation	Substitute	Applicants paying for done-for-you application operations.	One-time $199/250 applications, $299/500, $399/1,000, $1,099 Ultimate; add-ons extra.	Humans complete applications with team chat and custom letters; optional job finding, AI-custom resumes, expert resume and LinkedIn services.	AI is optional; named provider not found.	September 2025 privacy policy describes human+AI assistance, encrypted credentials and platform-term risk; users remain responsible for review.	Human accountability and transparent unit pricing.	Quality-control, labor-economics and credential-sharing risk.	Operations and application playbooks (analyst inference).	Application-operations substitute rather than evidence/decision product.	H	https://scale.jobs/pricing; https://scale.jobs/privacy
Apply Hero / Apply Hero	https://www.applyhero.ai/	AI auto-apply	Substitute	Price-sensitive high-volume applicants.	Free; Pro $29/month for 250 applications; Scale $59/month for 1,000.	AI finds jobs, customizes applications/cover letters and applies automatically using resume, salary and location preferences; includes resume creation/scoring.	Model not publicly specified.	Privacy says no sale and covers content, actions, transactions, vendors and deletion.	Low-cost scale plus tailoring.	No public approval/evidence architecture and high employer-action risk.	Automation throughput (analyst inference).	Application execution and basic documents.	H	https://www.applyhero.ai/; https://www.applyhero.ai/privacy
JobCopilot / JobCopilot	https://jobcopilot.com/	Company-career-page discovery and auto-apply	Direct	Applicants who want broad official-company-page coverage and automation.	Premium from $0.93/day; Elite from $1.05/day; totals vary by term.	Searches 500,000+ company career pages, up to 50 applications/day, filters, resume tailoring with review, learned edited answers, tracking, hiring-manager emails, interview and salary negotiation.	Provider not publicly named.	Privacy covers CV/job and optional demographic data; auto-apply acts on the user's behalf and at user risk.	Official-page sourcing, learned answers and review option.	Autonomous-action risk; no public Career Canon or version lineage.	Career-page coverage and form integrations (analyst inference).	Extremely high across discovery, learning, tailoring, tracking and outreach.	H	https://jobcopilot.com/pricing/; https://jobcopilot.com/privacy-policy
AIApply / AIApply	https://aiapply.co/	End-to-end AI suite and auto-apply	Partial	Applicants seeking documents, interviews and application automation in one tool.	Free limited tier and paid Pro/credits; exact current prices not reliably public without dashboard access.	GPT-4 resumes/letters, job board, AutoApply, scanner, translation, Interview Buddy, multiple versions and Review Mode.	Public product copy identifies GPT-4; provider terms say minimum prompts are sent.	March 2026 privacy policy says providers are instructed not to train; Review Mode prevents automated selection/submission and retention rules cover audio/transcripts/mailbox data.	Broad suite, versions, review mode and more explicit AI privacy than many peers.	Pricing opacity and residual auto-action/privacy risk.	Integrated localized workflow and automation (analyst inference).	High on documents, interviews, versions and applications; low on canon/decision depth.	H	https://aiapply.co/; https://aiapply.co/privacy-policy
LinkedIn Premium Career / LinkedIn	https://premium.linkedin.com/careers/career	Professional network and job marketplace	Partial	Individual job seekers leveraging the dominant professional/recruiter graph.	US pricing starts at $39.99/month or $239.88/year; regional variation applies.	AI profile writing, job-post insights, Top Applicant/Top Choice, advanced filters, InMail drafting, five InMails/month and Learning.	LinkedIn help says AI insights can use Azure OpenAI and sometimes Bing; users must review outputs.	Privacy policy covers profile, resume, application and interaction data; enterprise employers are not shown private searches/messages unless shared. Terms prohibit unauthorized scraping/bots.	Unmatched recruiter graph, identity layer and first-party behavior.	No durable official-posting archive, verified Career Canon or relocation decision workflow.	Network effects, professional identity and recruiter distribution.	Very high on discovery, fit cues, outreach and profile; limited cross-stage evidence controls.	H	https://www.linkedin.com/help/linkedin/answer/a7474394; https://www.linkedin.com/help/linkedin/answer/a1728404; https://www.linkedin.com/legal/privacy-policy; https://www.linkedin.com/legal/user-agreement
Indeed Career Scout and Apply For Me / Indeed	https://www.indeed.com/careerscout	Job marketplace and candidate agent	Partial	Mass-market job seekers using Indeed's inventory and application rails.	Core candidate search and Career Scout are free; no separate public candidate price.	Conversational role suggestions, resume customization, messaging, interview practice, My Jobs tracking and a limited July 2026 Apply For Me test.	Provider/model not publicly named; powered by Indeed job-search and hiring data.	Terms say interactions may be stored/analyzed, outputs can be wrong, users must verify details and are responsible for AI answers; submitted applications can be irreversible.	Enormous job inventory, distribution and application/outcome data.	Aggregated-listing truth, one-profile orientation and weak visible provenance.	Marketplace liquidity and feedback/outcome data.	Very high; it invalidates any generic end-to-end job-search novelty claim.	H	https://www.indeed.com/career-advice/finding-a-job/what-is-indeed-career-scout; https://www.indeed.com/news/releases/indeed-tests-apply-for-me-job-search; https://www.indeed.com/legal?hl=en_US; https://www.indeed.com/legal/privacyfaq
Glassdoor / Glassdoor	https://www.glassdoor.com/about/	Employer reputation, salary intelligence and jobs	Adjacent	Job seekers performing employer and compensation diligence.	No paid candidate subscription surfaced on reviewed official pages.	Reviews, ratings, salary reports, company intelligence, jobs and personalized salary estimates; job activity is synchronized with Indeed.	Model not publicly disclosed.	Trust Center emphasizes anonymous contributions; privacy choices describe sharing with Indeed affiliates/advertising partners and opt-outs.	Large employer-review and salary corpus.	Crowdsourced data can be uneven, stale or hard to validate; little workflow depth.	Accumulated reviews, salary submissions and brand.	Employer diligence, compensation context and decision support.	M	https://www.glassdoor.com/about/onelogin/; https://www.glassdoor.com/about/trust/; https://www.glassdoor.com/about/doNotSell.htm/
Welcome to the Jungle / Otta	https://www.welcometothejungle.com/en/jobs	Curated job marketplace and candidate matching	Partial	Candidates wanting curated roles, employer context and manageable tracking.	Candidate price not publicly stated on reviewed pages.	Curated jobs, salary/location/remote filters, AI Candidate Coach, saved opportunities, application management, recruiter visibility and AI-assisted CV/profile completion with acceptance.	April 2026 privacy policy identifies OpenAI as subprocessor.	Says OpenAI does not train on user data, provides visibility controls and human explanation/intervention rights, and recognizes EU AI Act matching risk.	Integrated candidate workflow and unusually explicit AI governance.	Employer marketplace without a verified canon, multi-model lineage or deep executive economics.	Curated employer marketplace and employer-brand content.	High on discovery, fit, tracking and coach-like assistance.	H	https://us.welcometothejungle.com/terms-and-conditions/candidates; https://www.welcometothejungle.com/en/pages/privacy-policy-candidates; https://press.welcometothejungle.com/news/uk-recruitment-platform-otta-acquired-by-welcome-to-the-jungle
Wellfound / Wellfound	https://wellfound.com/	Startup job marketplace	Partial	Startup candidates and employers.	Free for job seekers; employer Recruit Pro $499/month; promoted jobs from $200; higher tiers custom.	Salary/equity-forward listings, one-click profile applications, filters, founder/recruiter contact and salary tools.	Public DPA identifies Anthropic for LLM/API processing and AI ranking.	Privacy policy covers resumes, work history, salary preferences, applications, interviews and outcomes; profile visibility follows settings.	Startup specialization, salary/equity transparency and founder access.	Vertical-limited and profile-centric; no source evidence OS.	Startup marketplace liquidity and direct-founder network.	Discovery, compensation and outreach for startup executives.	H	https://help.wellfound.com/article/799-does-angellist-cost-anything-for-job-seekers; https://wellfound.com/recruit/pricing; https://wellfound.com/privacy
Levels.fyi / Levels.fyi	https://www.levels.fyi/	Compensation and leveling intelligence	Adjacent	Technology professionals and employers making pay/level decisions.	Negotiation coaching $1,250 flat; startup evaluation $250; employer products quote based.	Normalized salary, equity, level, company and location data; jobs, talent pool, negotiation coaching, resume review and AI summaries.	Model not publicly named.	Says submissions are verified and levels mapped, while terms warn data is submission-based, approximate and not guaranteed.	Materially deeper compensation/equity/leveling data than a general engine can build quickly.	Technology-heavy and not a job-search OS.	Dense normalized compensation and leveling corpus.	Directly pressures compensation, equity and offer-decision logic.	H	https://www.levels.fyi/services/; https://www.levels.fyi/about/; https://www.levels.fyi/about/terms.html; https://www.levels.fyi/about/privacy.html
Final Round AI / Final Round AI	https://www.finalroundai.com/	Interview, resume and application suite	Partial	Candidates seeking interview help and broad AI execution.	Official July 2026 overview: $90 monthly, $180 quarterly or $300 annually; home says plans start at $25/month; Job Hunter add-on $24.99-$74.99. Disclosures conflict.	Live Interview Copilot, mock interviews, resume tailoring, prep and automated job applications.	Provider/model not public.	Privacy covers resumes, postings and interview transcripts and permits data to test/train/improve AI; FAQ says audio is not stored absent opt-in recording.	Immediate interview value and broad feature bundle.	Covert live assistance, auto-application and inconsistent pricing create trust/reputation risk.	Interview-session corpus, distribution and brand.	High on resume/interview/application surfaces; opposite ethical posture on live assistance.	M	https://www.finalroundai.com/blog/what-is-final-round-ai; https://www.finalroundai.com/frequently-asked-questions; https://www.finalroundai.com/privacy-policy
Huru / Huru	https://huru.ai/	AI mock interviews	Adjacent	Individuals seeking low-friction solo practice.	Official articles market unlimited practice for free; current paid tier not found.	Custom questions, practice, instant feedback, tone/pacing/body-language analysis, communication scores and progress tracking.	Provider/model not public.	Public privacy page exists, but current training, retention and subprocessor detail was not clear.	Accessible and focused practice loop.	Narrow scope and thin public privacy/model disclosure.	Practice content and accumulated feedback data (limited inference).	Interview-prep only.	L	https://huru.ai/practice-interviews-alone-solo-improvement/; https://appv2.huru.ai/privacy-policy/
Big Interview / Skillful Communications	https://www.biginterview.com/	Structured interview training and resume review	Adjacent	Consumers, universities, governments, nonprofits and workforce programs.	Personal: $39 monthly, $99/3 months or $299 lifetime; enterprise quote.	Curriculum, question libraries, mock video, AI feedback, ResumeAI and cover-letter generation.	Provider not named on reviewed pages.	June 2026 privacy covers resumes, answers and audio/video; says cover-letter AI uses enterprise API config with no storage or model training.	Mature curriculum and institutional distribution.	No discovery, official-source capture or decision OS.	Training content, institutional contracts and practice corpus.	Interview, resume and cover-letter layers.	H	https://www.biginterview.com/pricing/personal; https://www.biginterview.com/privacy-policy
interviewing.io / interviewing.io	https://interviewing.io/	Technical mock interviews	Adjacent	Software engineers and technical candidates.	AI interviews free; human interviews start at $179 and vary by company/topic.	Anonymous voice-only practice with engineers plus AI coding and systems-design interviewers.	Publicly offers AI interviewers; model not named.	Privacy allows anonymized research; terms grant broad perpetual license over submitted interview content and cannot guarantee interviewer confidentiality.	Unusually realistic technical practice and expert network.	Expensive, technical-role focused and broad content license.	Interviewer network and longitudinal performance corpus.	Specialized interview-prep adjacency.	H	https://interviewing.io/faq; https://interviewing.io/privacy; https://interviewing.io/terms
Exponent / Exponent	https://www.tryexponent.com/	Technology-role interview education and community	Adjacent	Product, engineering, data, design and related candidates.	Free; $79 monthly; annual advertised at equivalent $12/month.	Role courses, verified question libraries, peer mocks, AI mocks/feedback, referrals and community.	Provider/model not public.	September 2025 privacy covers usage, US processing, deletion and Data Privacy Framework; no clear no-training pledge.	Specialized content, peer network and company-specific prep.	Technology/product skew and no application evidence workflow.	Content/question library and community.	Interview-prep, referrals and learning.	H	https://www.tryexponent.com/upgrade; https://www.tryexponent.com/privacy
Yoodli / Yoodli	https://yoodli.ai/	AI speech coach and roleplay	Adjacent	Individuals, coaches and enterprises improving communication.	Starter free; Pro $8/month annually; Advanced $20/month annually; team/enterprise quoted.	Interview, presentation, pitch and sales roleplay, follow-up questions, delivery/content feedback and progress tracking.	Provider/model not public.	Starter/Pro data may improve platform; Advanced/Team/Enterprise excluded from AI training by default; says data is not sold.	Strong communication feedback and coach/enterprise channel.	Generic speech improvement rather than opportunity evidence.	Speech/roleplay corpus and enterprise distribution.	Interview delivery and coach workflows.	H	https://yoodli.ai/pricing; https://support.yoodli.ai/en/articles/9550461-yoodli-overview; https://yoodli.ai/faq
Google Interview Warmup / Google	https://grow.google/certificates/interview-warmup/	Free interview-practice utility	Adjacent	Anyone needing simple private practice.	Free.	Expert-written questions, real-time transcription and AI extraction of job terms, talking points, pacing and clarity; intentionally does not grade.	Google AI, model not named.	Google says audio and transcripts are not saved and remain private to the user.	Free, simple, trusted and privacy-forward.	Shallow feedback and no materials, tracking or decision support.	Google distribution and trust.	Narrow interview-prep substitute.	H	https://grow.google/certificates/interview-warmup/
Notion / Notion Labs	https://www.notion.com/pricing	Workspace, database and agent platform	Substitute	Individuals, coaches and firms willing to assemble a custom system.	Free; Plus $10/member/month; Business $20/member/month annually; Enterprise custom.	Databases, projects, documents, version history, forms, dashboards, automations, Notion Agent and enterprise search.	Uses OpenAI and Anthropic among providers.	Says providers cannot train on customer data and workspace data is not used to train by default; 30-day provider retention on non-enterprise, zero retention on enterprise.	Extreme configurability, low price and familiar collaboration.	DIY setup, no job-specific source semantics or unsupported-claim controls.	Workspace ecosystem, templates and user familiarity.	Can approximate tracking, canon, approvals and versioning manually.	H	https://www.notion.com/help/ai-safety; https://www.notion.com/pricing
Airtable / Airtable	https://airtable.com/pricing	Relational app builder and workflow platform	Substitute	Individuals, coaches and service firms building custom operating systems.	Free; Team $20/user/month; Business $45/user/month annually; Enterprise custom.	Relational records, interfaces, forms, automation, reporting, permissions, AI app building and agents.	Provider/model varies by Airtable AI.	March 2026 AI terms say Airtable/providers do not train generative models on customer input/output and outputs require human fact-checking.	Powerful schema, approval automation and coach/client workspaces.	Setup burden and no career-specific evidence constraints.	Flexible database/app-builder ecosystem.	Can model the entire tracker/canon/version/approval layer, but not specialized judgment.	H	https://www.airtable.com/company/ai-terms; https://support.airtable.com/docs/airtable-ai-billing; https://www.airtable.com/company/trust-and-security
Mesh (formerly Clay) / Clay	https://clay.earth/	Personal relationship intelligence and CRM	Adjacent	Executives and teams managing a private professional network.	Personal free; Pro $10/month annually; Team $40/seat/month; Enterprise quote; support pages also list $20 monthly Pro.	Syncs contact metadata from email, calendar, social and messaging; reminders, updates, search and Nexus AI over the contact graph.	Nexus AI; provider details not emphasized.	Says it does not sell data, reads email headers rather than bodies, does not train Nexus/partner models on user data and deletes backups within 90 days.	Rich private relationship graph and strong privacy posture.	No jobs, evidence, resumes or application pipeline.	Enriched personal network graph and polished UX.	Warm-introduction discovery and outreach context.	H	https://clay.earth/pricing; https://library.clay.earth/hc/en-us/articles/7485741581339-Security-and-Privacy
Dex / Dex	https://getdex.com/	Personal CRM	Adjacent	Network-driven professionals and job seekers.	Approximately $12/month annually or $20 monthly in official comparison material; dynamic pricing text not stable.	LinkedIn/Gmail/Outlook/calendar sync, reminders, job-change alerts, notes, AI organization, briefings, mail merge and MCP.	AI Assist; provider not highlighted.	Says no data sale, encryption, deletion/export and requested-field-only AI/MCP sharing.	Clear individual networking habit loop.	Relationship-only; no role evidence, fit or materials.	Synchronized contact graph and engagement history.	Networking and outreach context.	M	https://getdex.com/security/; https://getdex.com/privacypolicy/; https://getdex.com/integrations/mcp-server/
folk / folk	https://www.folk.app/pricing	Collaborative relationship CRM and outreach	Adjacent	Teams, recruiters, coaches and service firms.	Standard $24/seat/month annually or $30 monthly; Premium $48/$60; Enterprise from $80 annually.	Relationship pipeline, enrichment, LinkedIn extension, email/calendar/WhatsApp sync, campaigns, sequences, dashboards and AI fields.	Subprocessors include OpenAI and Perplexity.	Says no sale or AI training on personal data; security docs say full email bodies are stored and AI controls are available.	Shared network, outreach and coach/client collaboration.	Sales-centric, more email-invasive than Mesh and no career canon.	Integrated relationship/outreach collaboration.	Strong outreach layer and potential coach workspace.	H	https://www.folk.app/privacy-policy; https://help.folk.app/en/articles/5007534-security-privacy
Attio / Attio	https://attio.com/pricing	AI-native flexible CRM	Substitute	Sophisticated individuals and teams building structured workflows.	Free; Plus $36 monthly/$29 annually; Pro $86 monthly/$69 annually; Enterprise quote.	Flexible records, contact sync, enrichment, sequences, call intelligence, workflows, MCP and Ask Attio actions.	February 2026 notes identify Claude Sonnet 4.6 and Gemini 3.1 Pro choices.	AI policy says Attio/providers do not train on customer data and product is not intended for high-risk/significant automated decisions.	Modern AI interaction, flexible schema, workflow action and model choice.	GTM/sales orientation, credit complexity and no candidate provenance.	AI-native CRM architecture and communication graph.	Can approximate tracking, outreach, evidence records and approvals.	H	https://attio.com/help/reference/attio-ai/attio-ai-policy; https://attio.com/legal/privacy
SeekOut / SeekOut	https://www.seekout.com/pricing/	Recruiting intelligence and sourcing	Adjacent	Recruiters and talent teams; reverse-side benchmark.	Recruit Core $149/month annually or $179 monthly; enterprise quote.	Search across a claimed 1B+ profiles, AI search, Smart Match, lookalikes, summaries, outreach, campaigns and explainable ranking.	Security material cites Azure AI.	Candidate database combines licensed/public vocational data and may infer job-change likelihood/demographics; client data not used for AI training; opt-outs available.	Sourcing breadth, explainability and recruiter workflow.	Employer-side agency and significant candidate-data/inference concerns.	Large profile database, recruiter integrations and search behavior.	Reverse-side discovery, matching, outreach and audit benchmark.	H	https://www.seekout.com/privacy/; https://www.seekout.com/security/; https://www.seekout.com/responsible-ai/
Eightfold AI / Eightfold	https://eightfold.ai/products/	Talent intelligence and skills platform	Adjacent	Large employers; reverse-side architectural benchmark.	Custom/quote based.	Talent acquisition, internal mobility, workforce exchange, deep-learning career/skills matching, agents and AI Interviewer.	Proprietary deep-learning platform; public provider detail limited.	May 2026 privacy covers candidates; responsible-AI material says identity signals are stripped before training and fairness evaluations occur; cites SOC/ISO controls.	Sophisticated career graph, matching and enterprise scale.	Employer-controlled scoring; no private candidate material/evidence OS.	Global career corpus, skills ontology and integrations.	Reverse-side fit/gap, interview and career-path benchmark.	H	https://eightfold.ai/privacy-notice/; https://eightfold.ai/blog/responsible-ai-data-underneath-decision/; https://eightfold.ai/products/ai-interviewer/
Phenom / Phenom	https://www.phenom.com/intelligent-talent-experience-platform	End-to-end talent experience platform	Adjacent	Enterprise recruiting and HR teams.	Quote/RFP based.	Candidate recommendations, sourcing, fit scores, screening, scheduling, talent CRM, interview intelligence, internal marketplace and learning/mentoring.	Provider/model not public.	AI ethics page describes matching inputs, fit-score auditing, privacy/fairness controls and PII-sharing limits; advertises GDPR/ISO/SOC controls.	Broad talent lifecycle and installed enterprise integrations.	Heavy implementation and employer-defined objectives.	Enterprise event data, installed stack and integrations.	Reverse-side benchmark across discovery, fit, interviews and career paths.	H	https://www.phenom.com/pricing; https://www.phenom.com/ai-ethics
Beamery / Beamery	https://beamery.com/platform/talent-intelligence/	Talent CRM, skills and workforce intelligence	Adjacent	Enterprise HR and recruiting teams.	Custom pricing.	Talent CRM, sourcing, matching, skills intelligence, role architecture, mobility, workforce planning and Ray agent.	Ray; underlying providers not fully public.	Security cites ISO 27001, SOC 2, encryption and selectable regions; privacy distinguishes customer-directed processing and permits some controller-context improvement/AI training.	Combined talent CRM and workforce/skills planning.	Enterprise implementation, opaque pricing and no candidate-owned boundary.	Skills graph, talent data and integrations.	Reverse-side evidence, matching and planning benchmark.	H	https://beamery.com/security; https://beamery.com/privacy-policy
Gloat / Gloat	https://gloat.com/platform/	Internal talent marketplace and agentic HR	Adjacent	Large employers; closest employer-side architectural analogue.	Sales/demo; exact price not public.	Internal jobs, projects, mentorship, learning, career paths, skill gaps, planning and agentic workflows using a Workforce Graph.	Model-agnostic across Anthropic, Google, IBM watsonx or customer infrastructure; proprietary models and embeddings.	Says third-party GenAI does not store/train on personal data; proprietary models may use anonymized/aggregated data; no automatic employee applications and human review available.	Context graph, career trajectories, matching, audit trails, approvals and model flexibility.	Employer owns access, context and opportunity set.	Workforce graph, enterprise deployments and HR-system context.	Strong architecture benchmark for memory, policy, gap analysis and approvals.	H	https://gloat.com/users-privacy/; https://gloat.com/security-and-compliance/
Fuel50 / Fuel50	https://fuel50.com/	Skills intelligence and internal talent marketplace	Adjacent	Enterprise HR teams.	Quote based by employees/modules and annual or multiyear term.	Human-curated AI-amplified skills ontology, gaps, internal jobs/projects/gigs, learning, mentorship, career paths and AI Career Advisor.	Provider/model not public.	Materials cite SOC 2 Type II, GDPR, privacy-by-design and NYC Local Law 144 bias-audit support.	Governed, curated skills evidence and actionable career-gap logic.	Internal-only enterprise product; no external application/material system.	Curated ontology, people-science expertise and integrations.	Benchmark for fit/gap evidence and career decision support.	H	https://fuel50.com/pricing; https://fuel50.com/products/talent-marketplace; https://fuel50.com/privacy-and-legal
ExecThread / ExecThread	https://execthread.com/faq/	Executive opportunity network	Partial	Director-to-C-suite members seeking confidential and nonpublic opportunities.	Current FAQ says member use is free; older Full Access pages remain, so premium status is inconsistent.	Members share hidden executive roles and connect to recruiters/hiring managers; points unlock access; activity can be anonymous.	No named AI/model found.	Privacy permits LinkedIn, public and third-party career data and profile presentation to relevant hiring firms.	Genuine hidden-role supply and executive network effects.	No public evidence of complete candidate OS, canon, versions or decisions.	Crowdsourced confidential-search graph and executive network.	High on hidden discovery and recruiter access; little document/evidence workflow.	M	https://execthread.com/faq-member/faq-member-getting-started/how-much-does-execthread-cost; https://execthread.com/privacy-policy; https://execthread.com/legal
BlueSteps / AESC	https://www.aesc.org/about-bluesteps/	Executive-search network and career service	Partial	Senior executives seeking visibility to retained-search consultants.	Current public price unavailable; prior membership structure remains referenced in FAQs.	Executive profile/database visibility, search-firm access, career resources, services and compensation tools.	No current named AI/model found.	AESC privacy covers resumes, qualifications, employment, compensation, geographic preferences, diversity and international processing.	Institutional credibility and privileged executive-search channel.	Visibility/resources rather than end-to-end candidate workflow.	AESC affiliation and search-consultant network.	Discovery, recruiter access and evidence inputs; limited source/version controls.	H	https://www.bluesteps.com/member-benefits; https://www.bluesteps.com/faq; https://www.aesc.org/privacy-policy/
Ladders / TheLadders	https://www.theladders.com/upgrade	High-income job marketplace and application service	Partial	Professionals targeting $100k+ roles.	$49.97 monthly; $98.91/3 months; $179.82/6 months; $299.64/year.	Curated senior jobs, Apply4Me and browser extension that turns outside jobs into one-click applications.	Named model not public.	Privacy covers resume, employment, salary and preference data; Apply4Me submits at member direction and profiles may be shared with recruiters by settings.	Senior-job inventory plus application rails.	Quantity/automation rather than executive evidence and deliberation.	High-income job corpus and brand.	Discovery/materials/application execution; conflicts with no automatic employer actions.	H	https://www.theladders.com/corporate/privacy
Experteer / Experteer	https://us.experteer.com/docs/advantages_membership	Executive career and recruiter marketplace	Partial	Senior candidates seeking discreet recruiter visibility and salary context.	Basic free; Premium amount account-gated.	Curated senior jobs, matching, salary estimates, recruiter search and visibility controls.	Recruiter products advertise AI-powered active sourcing; model not named.	Privacy identifies CV-parsing/career-service providers and GDPR rights; salary estimates are explicitly approximate.	Executive role corpus, recruiter network and salary data.	Opaque price and estimated compensation rather than source-backed economics.	Executive corpus, recruiter distribution and salary history.	Discovery, matching and compensation context.	H	https://eu.experteer.com/recruiting/page/products_job_postings_hr; https://us.experteer.com/recruiting/terms/privacy_policy
Ivy Exec / Ivy Exec	https://ivyexec.com/	Executive jobs, community and services	Partial	Director/CXO professionals pursuing jobs, coaching and paid expertise.	Job membership price unavailable; resume services $150 reformat, $425 rewrite, $995 Elite.	Jobs/community, resume and LinkedIn services, coaching, courses and paid expert-research studies.	No named AI/model found.	Current privacy policy applies to candidate and employer use; product-level AI detail not found.	Broad executive community and adjacent paid-expertise channel.	Services are fragmented rather than one evidence-backed workflow.	Executive member panel and market-research demand.	Discovery, coaching, branding, outreach and portfolio-income adjacency.	M	https://resume.ivyexec.com/ivyexec-resumewriting/; https://ivyexec.com/privacy-policy
ExecuNet / ExecuNet	https://www.execunet.com/executive-service-options/	Executive job-search membership	Direct	Senior executives targeting $150k-$200k+ roles.	$39/30 days, $99/90 days, $219/180 days, $399/year.	Researched/matched senior roles, weekly candidate showcases, recruiter directory, 1:1 strategy session, guidance and success-manager access.	No named AI/model found.	Privacy statement emphasizes limited collection, consent, user rights and security.	Closest candidate-paid bundle of executive roles, recruiter access and human strategy.	Little public source provenance, claim control, versioning or longitudinal decisions.	Long-standing brand, curated roles/recruiter network and executive playbook.	High on discovery, networking and human strategy; weak structured evidence lineage.	H	https://www.execunet.com/premium-join/; https://www.execunet.com/privacy-statement-us/
Korn Ferry Advance / Korn Ferry	https://www.kfadvance.com/	Digital career platform and executive transition	Direct	US professionals and executives seeking assessment, coaching and career tools.	Advance $49/month; individual executive transition packages $17,100/6 months and $22,800/12 months.	Assessments, Resume Architect, ATS feedback, real-time AI video-interview feedback, coaching, 3,000+ courses and job board.	Named underlying model not public.	Privacy explicitly covers Advance and broad career/assessment data; security materials cite ISO 27001/27018.	Strong branded integration of assessment, documents, interview practice, learning and coaching.	Broad career advancement rather than source-backed executive opportunity decisions.	Korn Ferry methodology, benchmarks, coach/search network and brand.	Very high on executive assessment, materials, interview and coaching.	H	https://www.kornferry.com/customer-support-faq; https://www.kornferry.com/privacy; https://www.kornferry.com/privacy/security
LHH Career Transition / LHH (Adecco)	https://www.lhh.com/en-us/solutions/outplacement/	Outplacement and career transition	Substitute	Employer-sponsored displaced employees and executives.	Enterprise quote; participant generally employer-funded.	Career Studio, coaching, assessments, reskilling, CV/job recommendations and GenAI-assisted tools.	GenAI; model not named.	Privacy covers transition, recruitment, assessment and coaching data; regional notices describe AI recommendations with human oversight.	Scale, coaches, learning, recruitment adjacency and employer distribution.	Sponsor-controlled, episodic entitlement rather than persistent private OS.	Adecco labor-market/recruiter network, employer contracts and outcomes.	High service substitute across documents, coaching, discovery and tracking.	H	https://www-prd.lhh.com/us/en/privacy-policy/
Right Management / ManpowerGroup	https://www.right.com/solutions/outplacement	Outplacement and executive transition	Substitute	Employer-sponsored executive, individual and group transitions.	Enterprise quote.	Coaching, PowerSuite Next, assessments, curated jobs, resume/LinkedIn/interview/network support and labor-market intelligence.	AI/ML acknowledged; model not named.	Global and North America notices cover recipients, PowerSuite, AI/ML, sharing, retention and cross-border processing.	Executive service, credentialed coaches, digital platform and employer scale.	Candidate ownership, provenance and persistent version history unclear.	ManpowerGroup distribution, enterprise relationships and transition data.	High human-service substitute.	H	https://www.right.com/privacy-policy; https://www.right.com/north-america-privacy-policy
Randstad RiseSmart / Randstad Enterprise	https://www.randstadenterprise.com/solutions/talent-transition/outplacement/	Outplacement and career transition	Substitute	Employer-funded transition participants.	Enterprise quote; no cost to participant.	Certified coach, resume/brand specialist, personal job sourcer, handpicked leads, ranked jobs, networking, alumni access and AI technology.	AI-powered; model not named.	Publishes SOC 2 Type II, GDPR, CCPA and vulnerability-testing claims.	Unusual human job-sourcing layer plus global recruiter infrastructure.	Employer-scoped with opaque evidence/sourcing logic and no candidate-owned canon.	Randstad recruiter graph, employer distribution and transition data.	High substitute across sourcing, materials, coaching and tracking.	H	https://www.randstadenterprise.com/compliance-security-and-privacy/
Careerminds / Career.io	https://careerminds.com/outplacement	Outplacement and career-development platform	Substitute	Employer-sponsored participants and HR buyers.	Quote based.	Coach plus digital platform, documents, networking, job search and employer analytics; 2026 acquisitions include Keystone, Renovo and Job Copilot.	AI-powered ecosystem; model not named.	Says it does not sell personal information; service providers and sponsor-provisioned accounts process data.	Consolidating global delivery plus consumer career technology.	Acquisition integration risk and unclear executive evidence rigor.	Career.io technology/data, acquired operations and employer contracts.	Broad B2B2C substitute and consolidation threat.	H	https://careerminds.com/news/careerminds-acquires-keystone-partners-renovo-job-copilot-and-outplacement-australia-to-create-a-global-leader-in-end-to-end-workforce-solutions; https://careerminds.com/privacy-policy
INTOO Executive Outplacement / INTOO	https://www.intoo.com/us/solutions/outplacement/executive-outplacement/	Executive outplacement	Substitute	Employer-sponsored senior leaders and executives.	$600 Solo+, $850 Flex, $1,300 Premium, $3,750 six-month Select executive.	Executive coaching, research, branding, multiple resume versions, LinkedIn, board/consulting/portfolio paths, negotiation and post-landing support.	Broader platform advertises AI-integrated tools; model not named.	No sufficiently product-specific public AI training/retention disclosure located.	Closest high-touch executive substitute; already covers versions, research, board paths and compensation negotiation.	Temporary service rather than longitudinal private evidence system.	Coach model, global Career Star/Gi Group network and enterprise distribution.	Extremely high functional substitute.	H	https://www.intoo.com/us/solutions/outplacement/outplacement-pricing/
Challenger CareerSuite / Challenger, Gray & Christmas	https://www.challengergray.com/outplacement-services/	Outplacement and executive coaching	Substitute	Employer and individual transition clients.	Flexible quote based.	Full-time coach, ATS resume/LinkedIn, branding, interview and salary prep; proprietary CareerSuite aggregates jobs and supports letters, assessments and mock interviews.	Proprietary AI suite; model not named.	Product-specific public AI data-use detail not located.	Executive narrative, market research, negotiation, full-time coaches and digital suite.	Episodic service with limited public provenance and AI-governance detail.	Legacy brand, coach model, labor-market research and employer relationships.	High service substitute.	M	https://www.challengergray.com/outplacement-services/
BetterUp / BetterUp	https://www.betterup.com/products/betterup-ai-coaching	Enterprise leadership and AI/human coaching	Adjacent	Employer-sponsored leaders; individual product is winding down.	Enterprise quote; closed to new/returning individual members.	BetterUp Grow/AI Coach, human coaches, roleplay, workshops and workplace integrations.	BetterUp AI Coach; foundation model/provider not named in reviewed page.	Says sessions are confidential, employers receive aggregated/anonymized data, and member data is not used to train foundation models; cites SOC 2/ISO 27001.	Mature hybrid coaching, behavioral science, enterprise trust and integrations.	Not an opportunity-search or application system.	Coaching corpus, methodology, coach network and enterprise distribution.	Leadership development and interview/behavioral coaching adjacency.	H	https://support.betterup.com/hc/en-us/articles/5023276679835-Plan-Subscription-Management; https://support.betterup.com/hc/en-us/articles/36688702739611-BetterUp-AI-Coach; https://www.betterup.com/trust-and-security
CoachHub AIMY / CoachHub	https://www.coachhub.com/aimy	Enterprise AI and human coaching	Adjacent	Employer-sponsored professionals and leaders.	Enterprise quote.	AIMY 24/7 AI coaching, 3,500 human coaches and between-session Companion.	AIMY; production provider detail not fully public.	Materials cite ISO 27001/27701, SOC 2 Type II and GDPR and say individual conversations are not given to HR; privacy covers inputs, outputs and voice transcripts.	Scalable multilingual AI/human coaching and mature controls.	No role discovery, job evidence or application workflow.	Coach network, methodology and enterprise distribution.	Coaching and reflection adjacency.	H	https://www.coachhub.com/ja/platform-privacy-policy
The Muse Coach Connect / The Muse	https://www.themuse.com/coaching/leadership-coaching	Coaching marketplace and job content	Adjacent	Individuals and enterprises buying one-off coaching.	Leadership session $365 with Coach or $605 with Master Coach.	Leadership, job-search strategy, resume and interview services paired with jobs/content.	No named AI/model found.	Terms define coaches as independent consultants and disclaim verification/endorsement, creating a quality-governance tension.	Accessible human marketplace connected to job content.	One-off engagements, variable practitioner quality and no persistent OS.	Marketplace brand, content traffic and coach supply.	Human coaching, resume and interview adjacency.	H	https://www.themuse.com/user/terms
Pathrise / Pathrise	https://www.pathrise.com/swe	Coached job-search accelerator	Substitute	Primarily technology candidates seeking execution and negotiation help.	Exact current upfront/income-based terms not public; two-week trial and post-placement repayment options described.	Application strategy, interviews, negotiation; Pro can apply for participant; Career Connect uses AI outreach.	Model not named.	Product-specific AI training detail not located; financing help describes loan/repayment structures.	Execution depth, mentors, negotiation and outcome-linked economics.	Tech/earlier-career tilt, financing complexity and apply-for-you conflict.	Mentor network, placement playbook and outcome data.	High on coaching, application operations and negotiation.	M	https://www.pathrise.com/help-v2
Spencer Stuart / Spencer Stuart	https://www.spencerstuart.com/what-we-do/our-capabilities/executive-search	Retained executive search	Substitute	Boards and employers hiring CEOs/C-suite; candidates are not buyers.	Employer quote; no candidate fee.	Global board/C-suite search, assessment and onboarding; Qlu.ai partnership adds AI-supported candidate discovery.	Qlu.ai plus proprietary platform; model not named.	Privacy covers public/third-party sourcing, interview notes, recordings/transcripts, compensation and client disclosure.	Elite mandates, assessment credibility and onboarding.	Opaque and client-controlled for candidates.	Relationships, brand, assessment IP and proprietary search platform.	Hidden discovery, fit, compensation and interview support from employer side.	H	https://www.spencerstuart.com/who-we-are/newsroom/spencer-stuart-enters-strategic-partnership-with-ai-powered-firm-qlu; https://www.spencerstuart.com/privacy-policy
Heidrick & Struggles / Heidrick	https://www.heidrick.com/en/services/executive-search	Retained executive search	Substitute	Employers hiring C-suite and boards.	Employer quote; no candidate fee.	Active/passive sourcing, culture and leadership assessment, post-placement advice and Navigator intelligence.	AI-powered Heidrick Navigator; Eightfold partnership; model not fully disclosed.	May 2026 notice says candidate data may maintain, improve and train Navigator.	Search, digital leadership intelligence and consulting in one firm.	Rich candidate processing serves client searches, not candidate control.	Search/assessment data, Navigator, relationships and global brand.	Employer-side hidden discovery, fit and assessment.	H	https://www.heidrick.com/en/privacy/privacy-notice-english
Russell Reynolds Associates / RRA	https://www.russellreynolds.com/en/capabilities/how-do-i-find-the-best-leaders	Retained executive search	Substitute	Boards and employers seeking CEO/C-suite leadership.	Employer quote; no candidate fee.	Executive/board discovery, succession, assessment and integration.	No named public candidate-matching model found.	June 2026 notice covers public/third-party sourcing, psychometrics, verification, client sharing and de-identified analytics/research.	Strategic advisory and structured leadership assessment.	Long opaque employer-controlled process.	Relationships, proprietary research/assessment and institutional history.	Employer-side discovery, assessment and integration support.	H	https://www.russellreynolds.com/en/privacy-notice
Egon Zehnder / Egon Zehnder	https://www.egonzehnder.com/what-we-do/executive-search	Retained executive search	Substitute	Boards and employers hiring senior leaders.	Employer quote; no candidate fee.	Bespoke search, internal/external benchmarking, succession, potential and culture assessment.	No named AI model found.	Privacy covers direct, public, social and BoardEx-sourced data, compensation, suitability assessments and client disclosure.	Partner-led trust and assessment depth.	Candidate visibility and opportunity choice remain limited.	Global partnership, trusted networks, assessment IP and off-limits relationships.	Employer-side hidden market and fit assessment.	H	https://www.egonzehnder.com/privacy-policy
True Search / True Platform	https://trueplatform.com/true-search/	Technology-forward retained executive search	Substitute	Technology, private-equity and growth employers.	Employer quote; no candidate fee.	Search, assessment, interim talent, talent labs and introductions; publishes AI Capability Index and vendor-reported placement metrics.	Proprietary data/AI; model detail not public.	Privacy covers candidates considered for client opportunities.	Most visibly technology-forward search substitute with startup/PE relevance.	Predictive claims need independent validation and workflow is buyer-controlled.	Technology-company/talent graph, specialist data and client relationships.	Employer-side executive opportunity and assessment intelligence.	H	https://trueplatform.com/; https://trueplatform.com/contact/opt-out-guide/privacy-policy/
N2Growth / N2Growth	https://www.n2growth.com/services/executive-search/	Executive search and leadership advisory	Substitute	Boards, private-equity firms and employers hiring C-suite.	Employer quote; no candidate fee.	Vue client dashboards, evaluations, compensation, geography/mobility and AI-driven data streams with psychometrics.	Proprietary Vue/AI; model not named.	Privacy covers resumes/contact data, analytics providers, rights and automated-decision disclosures.	Visible combination of search, coaching, dashboards and mobility/compensation intelligence.	Employer-side and proprietary performance claims.	Vue, board/PE specialization, relationships and assessment data.	Important employer-side benchmark for comp/relocation and executive fit.	H	https://www.n2growth.com/privacy-policy/
BoardProspects / BoardProspects	https://www.boardprospects.com/membership	Board-career network and marketplace	Partial	Executives pursuing board roles.	Free; $499/year Core; $999/year Coached.	Board profile/search visibility, opportunity applications, community, networking, office hours, interview/comp guidance, coaching and AI Board Bio Generator.	AI bio generator; model not named.	Current portal privacy policy; explicitly disclaims placement guarantees.	Focused board opportunities and honest expectations.	Board-only, not a complete executive-career system.	Board community, marketplace liquidity and specialization.	Board discovery, networking, materials and coaching.	H	https://portal.boardprospects.com/privacy
Athena Alliance / Athena Alliance	https://athenaalliance.com/	Premium board and portfolio-career community	Partial	Experienced executives, especially senior women, pursuing board/C-suite/investor/founder paths.	Membership from $3,000; Modern Boardroom $8,000 including membership or $4,500 existing members.	Community, member advisor, coaching, content, curated introductions and opportunity access.	No named job-search AI/model found.	Detailed product data disclosure was not retrievable in this review.	High-caliber community, warm introductions and portfolio-career framing.	Expensive and relationship-led rather than evidence/workflow-led.	Curated senior-women network and trusted introductions.	Executive networking, board paths and human guidance.	M	https://athenaalliance.com/athena-academy/modern-boardroom/
ChatGPT / OpenAI	https://openai.com/chatgpt/pricing/	General-purpose AI workspace	Substitute	Individuals and teams able to assemble a bespoke career workflow through prompts, projects, files, memory and research.	Free; Go $8/month; Plus $20/month; Pro tiers $100 and $200/month; business plans separate.	General research, source review, structured analysis, writing, revision, file handling, projects, memory and custom workflows; no native executive job system.	OpenAI model suite; exact models and limits vary by plan and change frequently.	Consumer content may be used to improve models unless the user opts out; business/API data is not used for training by default.	Extremely flexible, low-cost, fast and capable of reproducing most generation/analysis components manually.	DIY setup, no native Career Canon semantics, source-to-action audit, job pipeline or domain-specific approval policy.	Frontier models, product ecosystem, user habit and distribution.	Very high as a DIY substitute when paired with Notion/Airtable; low native workflow control.	H	https://openai.com/chatgpt/pricing/; https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro/; https://openai.com/policies/how-your-data-is-used-to-improve-model-performance/
Claude / Anthropic	https://claude.com/pricing	General-purpose AI workspace	Substitute	Individuals and teams building bespoke research, writing and analysis workflows.	Free; Pro $20/month or $17/month annually; Max from $100/month; team/enterprise plans separate.	Research, projects, memory, file creation/analysis, connectors and long-form reasoning; no native executive job pipeline.	Anthropic Claude model family; model availability varies by plan.	Consumer chats are used for model improvement only when users allow it, for safety review or other explicit opt-in; commercial products do not train on content by default.	Strong long-form analysis, document work and configurable project context at low cost.	DIY workflow, no native job-source capture, evidence-state system, application tracking or approval ledger.	Model capabilities, safety reputation, context handling and ecosystem.	High as a DIY substitute paired with workflow/database software.	H	https://claude.com/pricing; https://privacy.anthropic.com/en/articles/10023580-is-my-data-used-for-model-training
`, competitorHeaders);

const matrixHeaders = [
  "product", "discovery", "official_source_capture", "full_posting_evidence", "fit_gap_scoring",
  "comp_relocation_logic", "evidence_canon", "ats_resume", "executive_resume", "outreach",
  "feedback_learning", "versioning", "approval_gates", "application_tracking", "interview_support",
  "decision_support"
];

const featureMatrix = parseTsv(String.raw`
Indeed Career Scout / Apply For Me	✓	—	◐	✓	◐	—	✓	◐	✓	◐	◐	◐	✓	✓	◐
LinkedIn Premium Career	✓	—	◐	✓	◐	—	◐	◐	✓	◐	—	✓	◐	—	◐
Jobscan	◐	◐	✓	✓	—	—	✓	◐	—	✓	◐	✓	◐	◐	—
JobCopilot	✓	✓	◐	✓	◐	—	✓	◐	✓	✓	◐	◐	✓	✓	◐
Teal	◐	✓	✓	✓	◐	◐	✓	◐	✓	◐	✓	✓	✓	◐	◐
Huntr	◐	✓	✓	✓	◐	◐	✓	◐	✓	◐	✓	✓	✓	✓	◐
Jobright	✓	—	✓	✓	◐	—	✓	◐	✓	◐	◐	✓	✓	✓	◐
Simplify	✓	◐	✓	✓	◐	—	✓	◐	✓	◐	✓	✓	✓	◐	◐
Careerflow	✓	✓	✓	✓	◐	—	✓	◐	✓	✓	✓	✓	✓	✓	◐
Korn Ferry Advance	✓	—	◐	✓	◐	—	✓	✓	◐	✓	◐	✓	◐	✓	✓
ExecuNet	✓	—	◐	✓	◐	—	◐	◐	✓	✓	—	✓	◐	✓	✓
ExecThread	✓	—	◐	◐	◐	—	—	—	✓	◐	—	✓	—	—	◐
INTOO Executive Outplacement	✓	◐	◐	✓	✓	◐	✓	✓	✓	✓	✓	✓	◐	✓	✓
Final Round AI	✓	—	✓	✓	—	—	✓	◐	◐	✓	◐	◐	✓	✓	—
Welcome to the Jungle / Otta	✓	—	✓	✓	◐	—	✓	◐	✓	◐	◐	✓	✓	◐	◐
`, matrixHeaders);

const taxonomySets = [
  ["Integrated career OS and job discovery", new Set(["Teal / Teal Labs", "Huntr / Huntr Co.", "Simplify / Simplify Jobs", "Careerflow / Careerflow.ai", "EarnBetter / EarnBetter (EarnIn)", "WonsultingAI / Wonsulting", "Jobright / Jobright AI", "LinkedIn Premium Career / LinkedIn", "Indeed Career Scout and Apply For Me / Indeed", "Welcome to the Jungle / Otta", "Wellfound / Wellfound"])],
  ["Resume, ATS and application materials", new Set(["Jobscan / Jobscan", "Rezi / Rezi, Inc.", "Resume Worded / Resume Worded", "Kickresume / Kickresume", "Enhancv / Enhancv", "Resume.io / Career.io / Talent Inc.", "Hiration / Hiration", "Zety / Bold Limited", "SkillSyncer / SkillSyncer", "Resume Genius / Sonaga Tech"])],
  ["Application automation and delegation", new Set(["Sonara / Bold Limited", "LoopCV / LoopCV", "LazyApply / LazyApply", "Massive / Massive", "scale.jobs / scale.jobs", "Apply Hero / Apply Hero", "JobCopilot / JobCopilot", "AIApply / AIApply"])],
  ["Interview and communication preparation", new Set(["Final Round AI / Final Round AI", "Huru / Huru", "Big Interview / Skillful Communications", "interviewing.io / interviewing.io", "Exponent / Exponent", "Yoodli / Yoodli", "Google Interview Warmup / Google"])],
  ["Executive networks and opportunity intelligence", new Set(["Glassdoor / Glassdoor", "Levels.fyi / Levels.fyi", "ExecThread / ExecThread", "BlueSteps / AESC", "Ladders / TheLadders", "Experteer / Experteer", "Ivy Exec / Ivy Exec", "ExecuNet / ExecuNet", "BoardProspects / BoardProspects", "Athena Alliance / Athena Alliance"])],
  ["Outplacement, coaching and transition", new Set(["Korn Ferry Advance / Korn Ferry", "LHH Career Transition / LHH (Adecco)", "Right Management / ManpowerGroup", "Randstad RiseSmart / Randstad Enterprise", "Careerminds / Career.io", "INTOO Executive Outplacement / INTOO", "Challenger CareerSuite / Challenger, Gray & Christmas", "BetterUp / BetterUp", "CoachHub AIMY / CoachHub", "The Muse Coach Connect / The Muse", "Pathrise / Pathrise"])],
  ["Retained executive search", new Set(["Spencer Stuart / Spencer Stuart", "Heidrick & Struggles / Heidrick", "Russell Reynolds Associates / RRA", "Egon Zehnder / Egon Zehnder", "True Search / True Platform", "N2Growth / N2Growth"])],
  ["Workflow, relationship CRM and general AI", new Set(["Notion / Notion Labs", "Airtable / Airtable", "Mesh (formerly Clay) / Clay", "Dex / Dex", "folk / folk", "Attio / Attio", "ChatGPT / OpenAI", "Claude / Anthropic"])],
  ["Enterprise talent intelligence", new Set(["SeekOut / SeekOut", "Eightfold AI / Eightfold", "Phenom / Phenom", "Beamery / Beamery", "Gloat / Gloat", "Fuel50 / Fuel50"])]
];

function taxonomyFor(product) {
  const match = taxonomySets.find(([, products]) => products.has(product));
  if (!match) throw new Error(`No taxonomy mapping for ${product}`);
  return match[0];
}

const categoryCounts = Object.values(competitors.reduce((acc, row) => {
  const taxonomy = taxonomyFor(row.product_company);
  acc[taxonomy] ??= {
    category: taxonomy,
    reviewed_count: 0,
    direct_count: 0,
    partial_count: 0,
    adjacent_count: 0,
    substitute_count: 0
  };
  acc[taxonomy].reviewed_count += 1;
  const key = `${row.relationship.toLowerCase()}_count`;
  if (key in acc[taxonomy]) acc[taxonomy][key] += 1;
  return acc;
}, {})).sort((a, b) => b.reviewed_count - a.reviewed_count || a.category.localeCompare(b.category));

const uniqueSourceUrls = [...new Set(competitors.flatMap((row) => [row.url, ...row.sources.split("; ")]))];
const headlineMetrics = [{
  products_reviewed: competitors.length,
  deep_dives: featureMatrix.length,
  categories_reviewed: categoryCounts.length,
  primary_urls_indexed: uniqueSourceUrls.length,
  public_full_stack_matches: 0
}];

const sourceAppendix = competitors.map((row) => ({
  product_company: row.product_company,
  primary_url: row.url,
  supporting_urls: row.sources,
  accessed,
  evidence_confidence: row.evidence_confidence
}));

const sourceDefs = [
  {
    id: "competitive_inventory",
    label: "July 2026 primary-source competitive inventory",
    path: "competitors.csv",
    query: {
      description: "Analyst-coded inventory of 77 products and services, with row-level official URLs and public evidence limitations.",
      sql: "SELECT * FROM read_csv_auto('competitors.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["docs/research/.../competitors.csv"],
      filters: ["Active public products or services reviewed without creating accounts", "Sources accessed 2026-07-14"],
      metric_definitions: [
        "Products reviewed = unique product/service rows in competitors.csv.",
        "Public full-stack matches = products whose public materials evidence every proposed Engine capability; no row met that threshold.",
        "Relationship and moat fields are analyst classifications, not vendor claims or measured market share."
      ]
    }
  },
  {
    id: "feature_matrix_source",
    label: "Closest-threat public feature evidence",
    path: "feature-matrix.csv",
    query: {
      description: "Publicly evidenced capability coverage for the 15 closest product and service threats.",
      sql: "SELECT * FROM read_csv_auto('feature-matrix.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["docs/research/.../feature-matrix.csv"],
      filters: ["15 closest threats selected by workflow overlap, executive relevance, distribution, and substitution strength"],
      metric_definitions: ["✓ = publicly evidenced native capability; ◐ = partial, manual, indirect, or plan-dependent; — = no public evidence found in this review, not proof of absence."]
    }
  },
  {
    id: "legal_primary_sources",
    label: "Primary legal, regulatory, and platform-policy sources",
    href: "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32024R1689"
  },
  {
    id: "product_baseline",
    label: "Sponsor-supplied Executive Job Engine product context",
    path: "research task brief and private product documentation inspected read-only"
  },
  {
    id: "headline_metrics_source",
    label: "Research coverage headline metrics",
    path: "headline-metrics.csv",
    query: {
      description: "Counts derived from the reviewed competitor inventory and closest-threat selection.",
      sql: "SELECT * FROM read_csv_auto('headline-metrics.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["headline-metrics.csv"],
      metric_definitions: ["Public full-stack matches means reviewed products whose public materials evidenced every proposed Engine capability; it does not prove none exists outside the sample."]
    }
  },
  {
    id: "category_coverage_source",
    label: "Reviewed product taxonomy counts",
    path: "category-coverage.csv",
    query: {
      description: "Counts of reviewed products by the nine analyst-defined landscape categories.",
      sql: "SELECT * FROM read_csv_auto('category-coverage.csv', header = true) ORDER BY reviewed_count DESC, category ASC;",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["category-coverage.csv"],
      metric_definitions: ["Reviewed count is research-sample coverage, not market share or total vendor count."]
    }
  },
  {
    id: "source_appendix_source",
    label: "Product-level official URL appendix",
    path: "sources.csv",
    query: {
      description: "Official product and supporting URLs with access date and evidence confidence.",
      sql: "SELECT * FROM read_csv_auto('sources.csv', header = true);",
      engine: "DuckDB",
      language: "sql",
      tables_used: ["sources.csv"]
    }
  }
];

const pricingHypotheses = [
  {
    segment: "Active executive search (software-led)",
    hypothesis: "$149-$249/month, 3-month minimum; or $995 for a 12-week Search Pass",
    value_exchange: "Private source-backed briefs, Career Canon, executive materials, approvals and decision support",
    test: "Require payment in two founder-led cohorts; compare $149/month with $995/pass and measure activation, use and refund requests",
    decision_rule: "Keep only if at least 30% of qualified demos convert and support/model cost supports 70%+ gross margin"
  },
  {
    segment: "Concierge executive transition",
    hypothesis: "$2,500-$5,000 for 12 weeks",
    value_exchange: "Software plus human evidence review, narrative calibration and weekly decision session",
    test: "Sell five packages before building a large coach marketplace",
    decision_rule: "Continue only if delivery can be standardized below eight staff hours per client"
  },
  {
    segment: "Passive career continuity",
    hypothesis: "$39-$69/month or $399-$699/year",
    value_exchange: "Keep Career Canon, network context, market watch and executive materials current between searches",
    test: "Offer only after a completed active-search cohort; measure renewal without discounting",
    decision_rule: "Require at least 30% of completers to renew or refer a qualified peer"
  },
  {
    segment: "Executive coaches and boutique firms",
    hypothesis: "$299-$999/workspace/month plus $99-$199 per active client/month",
    value_exchange: "Shared evidence workflow, client approvals, version comparison and reusable advisor playbooks",
    test: "Three paid coach pilots with 5-10 active clients each",
    decision_rule: "Require at least 30% more active-client capacity or 40% less review/rework time"
  },
  {
    segment: "Outplacement executive tier",
    hypothesis: "$2,500-$5,000 per participant; lower software-only tier $800-$2,000",
    value_exchange: "Candidate-private workspace, executive decisioning, sponsor-safe aggregate reporting and audit controls",
    test: "One boutique outplacement design partner before enterprise security expansion",
    decision_rule: "Proceed only with explicit separation of sponsor analytics from confidential candidate content"
  },
  {
    segment: "Retained-search candidate care (defer)",
    hypothesis: "$2,000-$5,000 per user/year or custom engagement pricing",
    value_exchange: "Candidate preparation and evidence handoff, never candidate ranking or automated selection",
    test: "Discovery interviews only in year one",
    decision_rule: "Do not sell employer-side scoring without specialist employment/AI counsel and conflict analysis"
  }
];

const roadmap = [
  {
    period: "Months 0-2",
    objective: "Prove the trust wedge",
    build: "Official-source capture, full-post snapshot, Career Canon fact states, prohibited-claim checks, consent/deletion/export, audit events",
    validation: "12-20 design partners; audited comparison against their current ChatGPT, tracker and coach workflow",
    gate: "At least 90% of qualified roles have source, timestamp and readable brief; zero knowingly unsupported claims in audited finals"
  },
  {
    period: "Months 3-4",
    objective: "Prove executive decision value",
    build: "Opportunity, compensation and relocation model; explainable fit/gaps; executive resume and outreach packet; human approval inbox",
    validation: "First paid Search Pass cohort and blinded document/brief review by 3-5 credible executive advisors",
    gate: "30%+ qualified-demo conversion; median time to first useful brief under 30 minutes after onboarding"
  },
  {
    period: "Months 5-6",
    objective: "Prove learning without overclaiming",
    build: "Version lineage, feedback capture, interview prep grounded in canon, outcome annotations and comparison views",
    validation: "Second paid cohort; measure factual corrections, major revisions, approval time and interview progression",
    gate: "50% less material rework than baseline and at least 60% weekly active use during an active search"
  },
  {
    period: "Months 7-9",
    objective: "Prove the advisor channel",
    build: "Coach workspace, client-controlled sharing, relationship context, reusable playbooks and sponsor-safe reporting boundaries",
    validation: "Three paid coach/boutique pilots with 5-10 active clients each",
    gate: "30% more coach capacity or 40% less review time, with no confidential-data boundary failures"
  },
  {
    period: "Months 10-12",
    objective: "Earn repeatability and security readiness",
    build: "Admin, roles, security controls, retention policies, model/vendor registry, import/export, integration hardening and sales/onboarding playbook",
    validation: "One outplacement design partner, renewal/referral test and cohort economics review",
    gate: "70%+ gross margin, 30%+ completion-to-renewal/referral, and no unresolved high-severity privacy or authorization defect"
  }
];

const executiveSummary = `## Executive Summary

**Blunt verdict: proceed with a bounded paid validation; do not launch as another all-in-one AI job-search assistant.** The broad category is crowded and price-compressed. Indeed now combines conversational discovery, resume help, interview practice, tracking and a July 2026 Apply For Me test; Jobscan offers approval-first assisted applications; JobCopilot searches company career pages, learns from edited answers and can automate submission. Those products already match or exceed meaningful slices of the proposed Engine ([Indeed](https://www.indeed.com/news/releases/indeed-tests-apply-for-me-job-search), [Jobscan](https://www.jobscan.co/auto-apply), [JobCopilot](https://jobcopilot.com/)).

**The commercial opportunity is narrower and more valuable:** a private, candidate-side executive evidence and decision system. The strongest observed gap is the combination of official-source capture, durable full-posting evidence, a verified Career Canon that constrains claims, executive-specific compensation and relocation reasoning, version/feedback lineage, and explicit approval before any external action. No reviewed public product demonstrated that full combination. That is a bounded observation from 77 public-source reviews—not proof that no private or unreviewed product does it.

**The market already pays at both ends.** Consumer suites and senior-career memberships commonly anchor from free to roughly $20-$50/month, while executive transition and board-career offers span hundreds to tens of thousands of dollars: ExecuNet is $39 per 30 days, Korn Ferry Advance is $49/month, INTOO publicly lists $600-$3,750 participant tiers, Athena starts around $3,000, and Korn Ferry lists $17,100-$22,800 individual executive-transition packages ([ExecuNet](https://www.execunet.com/premium-join/), [INTOO](https://www.intoo.com/us/solutions/outplacement/outplacement-pricing/), [Korn Ferry](https://www.kornferry.com/customer-support-faq)). The Engine must prove it creates premium decision confidence, not merely more documents.

**The recommended wedge is trust plus judgment, not automation.** Preserve the no-automatic-employer-action boundary; do not build covert live-interview assistance; make source, fact state, model use, edits and approvals inspectable. The moat must become accumulated candidate-owned evidence, outcome-linked learning with consent, advisor distribution and a reputation for discretion. Multi-model routing, resume generation, trackers and approval screens are features, not durable moats.

**Go-to-market recommendation:** start with actively searching VP/C-suite leaders and founder-operators who have complex narratives, compensation, equity or relocation decisions. Sell a concierge-onboarded 12-week product, then add executive coaches and boutique outplacement firms as a B2B2C channel. Defer mass-market auto-apply and employer-side candidate ranking.

**Scale gate:** do not fund a broad build until paid cohorts show that the evidence-and-decision workflow commands at least a 3-5x price premium over $20-$50 tools, reduces material rework materially, and creates repeatable renewal/referral or advisor-channel economics.`;

const commercialContext = `## Market Context and Commercial Verdict

This opportunity sits inside several large but poorly aligned markets. The U.S. Bureau of Labor Statistics projects about 1.1 million management openings per year from 2024 to 2034 and reports a May 2024 median annual wage of $122,090 for management occupations; chief executives had a $206,420 median. Those figures are broad labor context, **not** a serviceable-market estimate for a private executive platform ([BLS management occupations](https://www.bls.gov/ooh/management/home.htm), [BLS top executives](https://www.bls.gov/ooh/management/top-executives.htm)).

The International Coaching Federation's 2025 study reports $5.34 billion in annual coaching revenue and 122,974 coach practitioners, confirming willingness to pay for human guidance, but it likewise does not isolate executive job search ([ICF executive summary](https://coachingfederation.org/resource/2025-icf-global-coaching-study-executive-summary/)). BlueSteps/AESC advertises access to 16,000+ search consultants and 135,000+ executives, showing the scale and relationship density of the incumbent executive-search network ([AESC/BlueSteps](https://www.aesc.org/about-bluesteps/)).

**Commercial verdict:** the need is real; the category claim is not. There is a plausible premium software and B2B2C opportunity if the Engine is demonstrably better at high-stakes truth, narrative quality and decision control. There is a weak opportunity as a generic resume/tracker/auto-apply product because free and low-cost alternatives, incumbent distribution and DIY AI stacks compress willingness to pay.

### What the evidence does and does not show

- It shows many current substitutes, public pricing anchors, current feature overlap, and credible distribution moats.
- It does not establish market share, conversion, retention, unit economics, price elasticity or a reliable TAM.
- Vendor usage counts and performance claims are treated as marketing claims unless independently validated.
- Moat, weakness, overlap, threat level and roadmap fields are analyst judgments based on public evidence.`;

const marketMap = `## Market Map and Category Taxonomy

The landscape is best understood as nine overlapping systems rather than one clean category:

1. **Integrated career OS and job discovery** — candidate-facing suites that combine search, matching, materials and tracking.
2. **Resume, ATS and application materials** — document generators, scanners and feedback systems.
3. **Application automation and delegation** — browser bots, autonomous agents and human apply-for-you services.
4. **Interview and communication preparation** — mock interviews, speech coaching and live copilot tools.
5. **Executive networks and opportunity intelligence** — hidden roles, recruiter visibility, compensation and board-career access.
6. **Outplacement, coaching and transition** — employer-funded and individual human/software substitutes.
7. **Retained executive search** — employer-side gatekeepers with proprietary mandates and candidate graphs.
8. **Workflow, relationship CRM and general-purpose AI** — configurable substitutes for the tracker, canon, approvals, research, writing and outreach layer.
9. **Enterprise talent intelligence** — reverse-side benchmarks for skills graphs, gap analysis, explainability and governed automation.

Relationship labels in the inventory are explicit: **Direct** products pursue a substantially similar candidate workflow; **Partial** products cover meaningful stages; **Adjacent** products solve a neighboring job or expose an architectural benchmark; **Substitute** products or services can replace the Engine's outcome without matching its form. The chart below describes this review sample, not vendor count in the market or market share.`;

const comparisonIntro = `## 77-Product Competitive Comparison

The table captures the requested fields for every reviewed product or service: company/product, URL, category and relationship, positioning/target, public pricing, core workflow, public AI/model detail, privacy posture, strengths, weaknesses, likely moat and Engine overlap. **H/M/L evidence confidence refers to the completeness of current public feature, pricing and privacy evidence—not product quality.** Pricing is public list pricing observed on July 14, 2026, can vary by geography or promotion, excludes taxes, and was not account-verified.`;

const deepDive1 = `## Deep Dives: Closest Threats 1-5

### 1. Indeed Career Scout and Apply For Me — very high threat

Indeed is the clearest warning against an “end-to-end job search” positioning. Career Scout already combines conversational job discovery, resume customization, salary/company questions, messaging and mock interviews, while My Jobs handles tracking. On July 7, 2026, Indeed announced a limited U.S. Apply For Me test that can submit applications from a candidate profile and preferences ([Career Scout](https://www.indeed.com/careerscout), [Apply For Me](https://www.indeed.com/news/releases/indeed-tests-apply-for-me-job-search)). Its strength is not merely features; it owns marketplace liquidity and application/outcome feedback. Its weakness is aggregated-listing truth, limited visible provenance and a mass-market profile orientation. The Engine should not compete on inventory or application volume. It can compete on official employer-source verification, executive-quality briefs, admissible claims, nuanced compensation/relocation decisions and a deliberately reversible approval model. Indeed's own terms warn that AI output can be inaccurate and that submitted applications can be irreversible, reinforcing that control wedge ([Indeed terms](https://www.indeed.com/legal?hl=en_US)).

### 2. LinkedIn Premium Career — very high threat

LinkedIn owns the professional identity, recruiter graph and primary outreach surface. Premium Career offers Top Applicant/Top Choice signals, advanced job filters, InMail, AI profile writing, AI job insights and message drafting ([Premium Career features](https://www.linkedin.com/help/linkedin/answer/a7474394)). Public help material says some AI insights use Azure OpenAI and may use Bing, and users must review outputs ([AI job insights](https://www.linkedin.com/help/linkedin/answer/a1728404)). The likely moat is network effects and first-party recruiter/candidate behavior—far stronger than a new product's generation stack. LinkedIn is weaker as a private evidence archive: public materials do not show full official-post preservation, claim-level career evidence, relocation decisioning or cross-stage version lineage. Integration must respect LinkedIn's explicit prohibition on unauthorized scraping, bots and extensions; the safe product should use user-authorized capture, durable links and export/import rather than build its core on prohibited automation ([User Agreement](https://www.linkedin.com/legal/user-agreement)).

### 3. Jobscan — very high threat

Jobscan has spent years owning ATS optimization, and its June 2026 Auto Apply closes an important control gap: it sources roles from Lever, Workable and other ATSs, drafts answers grounded in the resume and requires candidate review before submission ([Auto Apply](https://www.jobscan.co/auto-apply)). Public comparison material lists Premium at $49.95/month or $89.95/quarter, with application credits sold separately ([pricing reference](https://www.jobscan.co/blog/jobscan-vs-teal/)). That makes it the closest observed threat to the Engine's approval-first application philosophy. Jobscan still appears document/ATS-centered; public materials do not demonstrate a verified career canon, executive decision briefs, relocation logic or full source-to-outcome lineage. The Engine must materially outperform Jobscan on senior narrative, factual governance and opportunity judgment. “We require approval” is no longer differentiating by itself.

### 4. JobCopilot — very high threat

JobCopilot is strategically important because it claims to search more than 500,000 company career pages rather than rely only on conventional boards; it also tailors resumes with review, learns from edited application answers, tracks applications, drafts hiring-manager email and supports interview and salary-negotiation workflows ([product and pricing](https://jobcopilot.com/pricing/)). Premium is advertised from $0.93/day and Elite from $1.05/day, creating a low price anchor. This is the closest public overlap with official-source discovery and feedback learning. Its major weakness is the autonomous application posture: its privacy terms say auto-apply acts on the user's behalf and at the user's risk ([privacy](https://jobcopilot.com/privacy-policy)). The Engine's defensible response is not broader automation; it is a durable, inspectable boundary between source evidence, user facts, generated language, edited answers and approved employer-facing artifacts.

### 5. Teal — high threat

Teal is the mature candidate-workspace benchmark: a master resume, tailored views, job and contact tracking, browser capture, matching, autofill and outreach in one coherent product. Current Teal+ pricing is $13 for seven days, $29 for 30 days and $79 for 90 days ([pricing](https://www.tealhq.com/pricing)). The master resume already approximates part of a Career Canon, and the workflow is likely easier to understand than a complex executive operating system. Teal's public weakness is the absence of a fact-state/provenance model and little visible compensation, relocation or executive-decision depth. Its moat is workflow maturity, brand and accumulated user behavior, not a proprietary frontier model. The Engine must make the Career Canon feel automatic and materially safer—not like extra data entry—and must show why an executive brief is more valuable than a match score plus tailored resume.`;

const deepDive2 = `## Deep Dives: Closest Threats 6-10

### 6. Huntr — high threat

Huntr combines browser capture, job/contact/interview CRM, resume tailoring, cover letters, autofill, match insights and metrics, with an institutional offer for career-service organizations. Public pricing runs from free to $40 monthly, with discounted three- and six-month terms ([pricing](https://huntr.co/pricing)). Its privacy page says it does not sell personal data and does not share with employers or organizations without consent, a useful trust benchmark ([privacy](https://huntr.co/privacy)). Huntr's likely moat is the mature tracker plus B2B distribution and a large corpus of tracked applications. Its public gap is the same one Teal leaves open: official-source provenance, admissible career evidence and executive economics. The Engine should assume Huntr can add generic scoring and AI quickly; differentiation has to live in the data model, quality bar and advisor-grade decisions.

### 7. Jobright — high threat

Jobright is a discovery and opportunity-intelligence threat: a large job hub, matching, rapid resume tailoring, autofill, Orion coaching, referral paths, H-1B data, executive filters and compensation context. Its June 2026 privacy policy is more explicit than most peers, naming OpenAI, Anthropic, Google Cloud AI and AWS AI and describing candidate visibility and post-account retention ([privacy](https://jobright.ai/legal/privacy)). Current public pricing is not reliably disclosed; vendor pages contain conflicting amounts, so the report does not treat a specific price as verified. Jobright's likely moat is its job graph and marketplace behavior. The Engine cannot plausibly out-inventory it early. The opportunity is to take a smaller number of roles from official source through a more rigorous executive brief, claim-safe materials and an explainable go/no-go decision.

### 8. Simplify — high threat

Simplify wins on friction: personalized job discovery, broad-form autofill, automatic tracking, resume tailoring, cover letters, application answers and networking/referral drafts. The base product is free; Simplify+ is publicly listed at $19.99/week, $39.99/month or $89.99 for three months ([features and pricing](https://help.simplify.jobs/en/help/articles/5623502-whats-included-in-simplify-features-and-pricing)). Its weakness is trust disclosure: the reviewed privacy policy is dated 2021 and does not adequately describe the expanded AI suite ([privacy](https://simplify.jobs/privacy)). Application-surface integrations and behavioral data are the likely moat. The Engine should not chase autofill coverage. It should make selective executive pursuit faster by reducing false-positive roles, clarifying gaps and producing defensible materials with a stronger privacy contract.

### 9. Careerflow — high threat

Careerflow is the breadth and channel benchmark: job portal, extension capture, tracker, ATS resumes, LinkedIn optimization, cover letters, networking tools and mock interview/video analysis, sold to both consumers and organizations. Premium is $23.99/month and Premium Plus $44.99/month, with lower effective long-term rates ([product and pricing](https://www.careerflow.ai/premium)). Its privacy policy covers stored interview media, analytics/session replay and advertising, while the FAQ says employers do not receive data without consent ([privacy](https://www.careerflow.ai/privacy), [FAQ](https://www.careerflow.ai/faq)). The likely moat is suite breadth and B2B distribution. The Engine's edge must be executive-specific decision quality and evidence constraints; a larger checklist of AI tools will not beat Careerflow.

### 10. Welcome to the Jungle / Otta — high threat

Welcome to the Jungle, which acquired Otta, combines curated roles, salary/location filters, AI Candidate Coach, saved opportunities, tracking, recruiter visibility and AI-assisted CV/profile completion with candidate acceptance. Its April 2026 candidate privacy policy identifies OpenAI, says providers do not train on user data, provides visibility controls and human explanation/intervention rights, and explicitly acknowledges EU AI Act risk in candidate matching ([privacy](https://www.welcometothejungle.com/en/pages/privacy-policy-candidates)). That is a strong governance benchmark. Its moat is curated employer supply and employer-brand content. Its weakness is a marketplace/profile orientation rather than a persistent candidate-owned evidence system. The Engine can differentiate through cross-employer canon, full-post history, executive materials and private long-term learning—but not by claiming better basic matching or tracking.`;

const deepDive3 = `## Deep Dives: Closest Threats 11-15

### 11. Korn Ferry Advance — high executive-specific threat

Korn Ferry Advance is the most recognizable candidate-facing executive suite reviewed. At $49/month it bundles assessments, Resume Architect, ATS-style feedback, real-time AI video-interview feedback, coaching, a large learning library and a job board; Korn Ferry separately lists individual executive-transition packages at $17,100 for six months and $22,800 for twelve months ([Advance](https://www.kfadvance.com/), [executive pricing](https://www.kornferry.com/customer-support-faq)). Its moat is formidable: brand, leadership methodology, benchmark data, coach network and retained-search adjacency. Public materials show less emphasis on official-source evidence, claim provenance and detailed opportunity economics. The Engine must deliver advisor-grade insight at software speed and a privacy/control model that feels more candidate-owned. A generic assessment or AI interview feature will not distinguish it.

### 12. ExecuNet — high executive-distribution threat

ExecuNet is the closest candidate-paid bundle of senior roles, recruiter access and human job-search strategy. Current plans are $39 for 30 days, $99 for 90 days, $219 for 180 days and $399 for a year; services include researched roles, matching, recruiter directory, candidate showcases, a 1:1 strategy session and success-manager access ([plans](https://www.execunet.com/premium-join/)). The moat is a long-standing executive brand and curated recruiter/role network. Public evidence does not show a source-provenance layer, claim controls or longitudinal document lineage. ExecuNet demonstrates that executives pay for access and guidance, but it also exposes the Engine's supply problem: better workflow cannot manufacture hidden opportunities. Partnership or complementary positioning may be smarter than head-on inventory competition.

### 13. ExecThread — high hidden-market threat

ExecThread focuses on confidential, nonpublic director-to-C-suite opportunities shared through a selective member network. Current FAQs describe member use as free, though older paid-access pages remain, so pricing status is not fully consistent ([FAQ](https://execthread.com/faq/)). Its privacy policy permits career data from LinkedIn, public and third-party sources and profile presentation to relevant hiring firms ([privacy](https://execthread.com/privacy-policy)). ExecThread's product breadth is limited relative to the Engine, but its supply moat may be more defensible than any resume or scoring feature: a network that surfaces hidden mandates. Treat it as a discovery complement and strategic benchmark. The Engine should provide superior qualification, evidence and pursuit once an executive acquires a role, while building advisor/referral channels rather than promising to recreate ExecThread's graph quickly.

### 14. INTOO Executive Outplacement — high service substitute

INTOO publicly lists unusually transparent tiers from $600 to $3,750 per participant. Its executive offer already includes dedicated coaching and research, personal branding, multiple resume versions, LinkedIn, board/consulting/portfolio paths, negotiation and post-placement support ([executive service](https://www.intoo.com/us/solutions/outplacement/executive-outplacement/), [pricing](https://www.intoo.com/us/solutions/outplacement/outplacement-pricing/)). That directly challenges any claim that versioned executive documents, compensation negotiation or portfolio-career planning are unique. INTOO's weakness is structural: it is typically a temporary employer-funded program, not a persistent private system controlled by the candidate. The Engine's opportunity is continuity before, during and after transition and an explicit evidence layer that human services rarely expose. A hybrid coach channel may be more credible than pure self-service.

### 15. Final Round AI — high feature threat, useful trust foil

Final Round AI spans mock interviews, live Interview Copilot, resume tailoring, job automation and an add-on Job Hunter. An official July 2026 article lists $90 monthly, $180 quarterly or $300 annually, while other public copy says plans start at $25/month, so pricing is inconsistent ([overview](https://www.finalroundai.com/blog/what-is-final-round-ai)). Its privacy policy permits using resumes, job data and interview transcripts to test, train and improve AI models ([privacy](https://www.finalroundai.com/privacy-policy)). The product's strength is immediate perceived value during high-anxiety interviews; the likely moat is session data and distribution. Its covert live-assistance and auto-application posture creates a reputational and employer-policy risk that the Engine should reject. Build preparation grounded in verified evidence, not hidden live answer generation.`;

const matrixIntro = `## Feature Matrix for the 15 Closest Threats

Legend: **✓** = publicly evidenced native capability; **◐** = partial, manual, indirect, plan-dependent or human-service capability; **—** = no public evidence found in this review. A dash is not proof the vendor cannot perform the function. “Official-source capture” requires visible capture from an employer/ATS source; a normal marketplace listing alone does not qualify. “Evidence Canon” requires a durable fact-state system, not merely a master resume.`;

const commoditization = `## What Is Commoditized—and What May Still Be Distinctive

### Already commoditized or rapidly commoditizing

- **Resume and cover-letter generation.** Rezi, Resume Worded, Kickresume, Enhancv, Hiration, Jobscan, Careerflow, WonsultingAI and others produce, score or rewrite materials. Executive services add human writers.
- **Job-description matching and gap scores.** Candidate tools and enterprise talent platforms already expose match, skills and fit logic.
- **Trackers, stages and dashboards.** Teal, Huntr, Simplify, Careerflow, Notion, Airtable and Attio all make the workflow easy to reproduce.
- **Mock interviews and generic feedback.** Final Round AI, Big Interview, Huru, Exponent, Yoodli and Google cover practice at price points from free upward.
- **Outreach drafting and contact reminders.** LinkedIn, Simplify, WonsultingAI, JobCopilot, Mesh, Dex and folk cover much of this layer.
- **Multi-model orchestration.** Resume Worded names OpenAI, Gemini and Anthropic; enterprise platforms are increasingly model-agnostic. Routing models is an implementation choice, not a category moat.
- **Application automation.** Indeed, Jobscan, JobCopilot, LoopCV, Massive, Ladders and others already span assisted through autonomous submission.

### Potentially distinctive—but only if exceptional

- **A verified Career Canon with admissibility rules.** The system must visibly distinguish verified fact, user assertion, inference, generated suggestion, prohibited claim and superseded evidence. A master resume is not enough.
- **Source-to-decision provenance.** Official URL, timestamp, complete readable posting, changes, qualifications, source confidence and every downstream brief/material must remain traceable.
- **Executive decision intelligence.** Role scope, governance, compensation mix, equity risk, relocation/household impact, reputation and career optionality must be reasoned together—not reduced to a match score.
- **Outcome-linked version lineage.** The product should show what changed, why, who approved it and what happened next, without pretending one anecdotal response proves causality.
- **Candidate-owned trust architecture.** Private by default, no silent employer visibility, disclosed model/provider use, reversible approvals and no automatic employer action.

**Important skepticism:** the integrated bundle is not itself defensible. A capable user can approximate much of it with ChatGPT or Claude plus Notion/Airtable and a browser. Defensibility emerges only if the specialized evidence model, executive judgment, advisor distribution and longitudinal outcome data create a substantially better result with less work.`;

const wedgesAndRisks = `## Unmet Needs, Defensible Wedges and Strategic Risks

| Wedge | Why it is still underserved | What could make it defensible | Failure mode |
|---|---|---|---|
| Candidate-owned evidence graph | Most products start from a resume/profile, not durable fact states and source lineage | Multi-year verified career corpus; claim policy; low-friction import and correction; advisor collaboration | Becomes a tedious form executives will not maintain |
| Official-source opportunity archive | Aggregators optimize freshness and volume, not private evidence preservation | Reliable employer/ATS capture, change history and readable Job Briefs | Scraping/terms breakage, stale posts, copyright/redisplay exposure |
| Executive opportunity decisions | Trackers rarely unify equity, scope, governance, relocation, household and reputation | Explainable executive rubric plus trusted external data and advisor calibration | False precision; poor data creates confident but wrong advice |
| Claim-safe materials | Generators optimize persuasiveness; few show claim admissibility and lineage | Zero-tolerance unsupported-claim checks and visible evidence links | Output feels generic or overconstrained; human writers remain better |
| Advisor operating layer | Coaches use fragmented docs, spreadsheets and calls | Better capacity, fewer corrections, reusable playbooks and candidate-controlled approvals | Enterprise features consume the roadmap before individual value is proven |
| Discretion as product | Employer-funded and marketplace tools can create dual-principal ambiguity | Private identity, minimal data, explicit sharing boundaries and audit logs | One security incident destroys executive trust |

### The three most defensible routes

1. **Evidence-and-claim governance:** make every employer-facing statement traceable to verified candidate evidence and every role decision traceable to a source snapshot.
2. **Advisor-distributed workflow:** help high-quality executive coaches and boutique outplacement providers serve more clients without reducing judgment or confidentiality.
3. **Longitudinal career continuity:** remain useful before and after an active search by keeping evidence, network context and market intelligence current.

### Risks that can erase the opportunity

- Incumbents own role supply, recruiter graphs, compensation data and employer relationships.
- Active job search is episodic, producing high churn and lumpy acquisition economics.
- Senior users may want a trusted confidant, not another self-service dashboard.
- Source capture can be brittle, terms-restricted and expensive to maintain.
- The Career Canon can feel like clerical work unless onboarding is near-automatic.
- Multi-model generation can add cost, latency and inconsistency without perceptible quality gain.
- Feedback learning can overfit tiny, biased samples; an interview or rejection is not a causal label.
- Premium pricing invites premium support expectations and makes quality failures more damaging.
- No automatic employer action protects trust but gives up a convenience feature with demonstrated demand.`;

const privacyLegal = `## Privacy, Trust, Legal and Automatic-Application Concerns

This section is product-risk analysis, not legal advice. Specialist privacy, employment, AI and platform-terms counsel should review any launch and every employer-side expansion.

### Product boundary

**Keep the Engine candidate-side and assistive.** The EU AI Act treats certain employer recruitment, selection and candidate-evaluation systems as high-risk; New York City's Local Law 144 regulates automated employment decision tools; California's employment automated-decision regulations became effective April 1, 2026; and Colorado's reenacted requirements are scheduled for January 1, 2027 ([EU AI Act](https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32024R1689), [NYC DCWP](https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page), [California CRD](https://calcivilrights.ca.gov/civilrightscouncil/rulemaking-actions/), [Colorado AG](https://coag.gov/ai/)). A private tool that helps a candidate prepare is a different risk posture from software sold to a search firm to rank or exclude candidates. Crossing that line should trigger a new legal and governance review.

**Do not imply accuracy the evidence cannot support.** The FTC has acted against unsubstantiated AI-detection and performance claims, and the EEOC continues to emphasize algorithmic fairness in employment ([FTC Workado action](https://search.ftc.gov/news-events/news/press-releases/2025/04/ftc-order-requires-workado-back-artificial-intelligence-detection-claims), [EEOC initiative](https://www.eeoc.gov/newsroom/eeoc-launches-initiative-artificial-intelligence-and-algorithmic-fairness)). Fit, gap, compensation and relocation scores should be explainable, contestable and labeled as decision aids—not objective truth or hiring probability.

### Automatic applications and platform terms

- Preserve an explicit approval step before every application, message, upload, login or employer-facing action. Approval should show the exact destination, fields, document version and generated answers.
- Do not use unauthorized bots or scraping against LinkedIn; its User Agreement and help material prohibit automated extraction and prohibited browser extensions ([LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement), [prohibited extensions](https://www.linkedin.com/help/linkedin/answer/a1341387)). Indeed likewise warns against third-party bots and may impose application limits, even while operating its own Apply For Me path ([Indeed guidelines](https://www.indeed.com/help/job-seekers/articles/360028540531-indeed-job-seeker-guidelines)).
- Use employer/ATS pages, licensed feeds, approved APIs, user-authorized browser capture and manual paste/import. Store source URL, access time and evidence needed for the user's private decision; obtain counsel before redistributing posting text or building a public archive.
- Do not build covert live interview assistance. Practice and preparation are defensible; hidden real-time answers can breach employer policies, undermine authenticity and damage the brand.

### Minimum privacy and trust standard

1. Candidate data private by default; no recruiter, employer, coach or sponsor visibility without granular consent.
2. Separate candidate-confidential content from sponsor-level utilization reporting in B2B2C deployments.
3. Publish the model/vendor registry, data fields sent, retention, training setting, region and subprocessor changes.
4. No training on candidate data by default; separate, revocable opt-in for any improvement program.
5. Encryption in transit and at rest; least-privilege access; audit logs for model calls, edits, exports and approvals.
6. Clear deletion, export, retention and incident-notification controls; avoid employer-owned email/workspace identities for private searches.
7. Store external credentials or OAuth tokens only when indispensable, scoped and revocable; prefer metadata minimization over full mailbox ingestion.
8. Keep compensation, relocation, health/family constraints and protected attributes out of employer-facing artifacts unless the candidate explicitly directs otherwise.`;

const icp = `## ICP and Buying-Trigger Analysis

| Segment | Best initial profile | Trigger | Job to be done | Likely objections | Priority |
|---|---|---|---|---|---|
| Executives and founder-operators | VP/C-suite or high-income operator with a complex narrative, $200k+ target compensation, equity/relocation or confidential search | Layoff, founder exit, stalled search, unsolicited opportunity, geographic move, board/portfolio pivot | Decide which roles deserve attention and pursue them with defensible evidence and materials | “I can do this with ChatGPT”; privacy; setup burden; desire for human counsel | **Primary** |
| Executive coaches | Independent/boutique coach serving 10-50 active clients with fragmented docs and repeated review | Capacity ceiling, inconsistent client evidence, document rework, desire for differentiated product | Scale judgment without losing quality; see client decisions and revisions in one place | Fear of software replacing coach; client confidentiality; workflow rigidity | **Primary channel after individual proof** |
| Outplacement firms | Boutique or executive-tier provider that needs a differentiated, auditable participant experience | RFP pressure, margin pressure, acquired technology fragmentation, demand for AI governance | Improve participant experience and coach leverage while separating sponsor reporting from private content | Security review, integration, procurement cycle, sponsor/candidate data conflict | **Secondary** |
| Retained-search firms | Candidate-care, assessment-prep or leadership-onboarding teams—not sourcing/ranking buyers | Need for consistent candidate preparation and evidence handoff | Prepare candidates and preserve consented evidence without automating selection | Conflict of interest, AI-employment regulation, candidate trust | **Defer / narrow pilot only** |

### Highest-intent triggers

- The executive has three or more plausible opportunities and cannot compare scope, equity, relocation or career option value cleanly.
- A search has generated applications but poor interview conversion, creating an evidence/narrative problem.
- A layoff/outplacement benefit expires soon and the candidate wants a private system that persists.
- The executive has a long or nonlinear history and fears AI-generated materials will introduce unsupported claims.
- A coach spends excessive time reconciling resumes, LinkedIn, job descriptions, notes and client edits.

Avoid a mass-market ICP initially. Entry-level and volume applicants are served by free or cheap tools, have lower willingness to pay and often value automation over discretion.`;

const pricingIntro = `## Pricing and Business-Model Hypotheses

**Everything in the table below is a hypothesis to test, not a pricing recommendation validated by willingness-to-pay research.** Public anchors suggest a wide value ladder: free to roughly $50/month for candidate software and senior subscriptions; $600-$3,750 for published outplacement tiers; $3,000-$8,000 for premium board/community programs; and $17,100-$22,800 for high-touch individual executive transition. The Engine should not price like a resume builder, but it has not yet earned service-level pricing.

Recommended first test: **$149/month with a three-month minimum versus a $995 twelve-week Search Pass**, both with concierge onboarding. This is high enough to test premium value and low enough to sit far below executive transition services. Run real paid cohorts; do not use stated willingness alone.

Business-model design principles:

- Separate active-search economics from a lower-cost continuity product to reduce churn without pretending active intensity persists forever.
- Price coach/outplacement offers on active clients and measurable capacity, not model tokens or feature seats alone.
- Include model cost, source-capture operations and support time in cohort margins; target 70%+ gross margin before scaling acquisition.
- Avoid success fees tied to compensation without legal and incentive review; they can create placement-service ambiguity and encourage overclaiming.
- Never monetize candidate data, employer visibility or automatic submission as a hidden subsidy.`;

const positioning = `## Recommended Positioning, Category Language and One-Liners

### Recommended category

**Executive career intelligence and decision system**

“Private executive career operating system” is an effective explanatory phrase, but “career intelligence and decision system” emphasizes the valuable outcome—judgment grounded in evidence—without sounding like another tracker. Avoid “executive search platform,” which implies the employer-side retained-search business, and avoid leading with “AI,” “resume builder,” “copilot” or “auto-apply.”

### Recommended positioning statement

For senior executives and founder-operators making high-stakes career moves, the Executive Job Engine is a private, candidate-side career intelligence system that turns verified opportunities and verified career evidence into defensible decisions, materials and next actions. Unlike mass-market job agents and fragmented coaching documents, it preserves source truth, prevents unsupported claims and keeps the executive in control of every external step.

### Concise one-liner options

1. **Turn verified executive opportunities and verified career evidence into defensible decisions, materials and next actions.**
2. **The candidate-side system of record for high-stakes executive moves.**
3. **A private executive career operating system grounded in evidence—not application volume.**
4. **Executive opportunity intelligence, from source truth to approved action.**
5. **Your career evidence, every serious opportunity and every external action—under your control.**

### Messaging hierarchy

1. Lead with **better decisions and factual confidence**.
2. Prove **source lineage and unsupported-claim prevention**.
3. Show **executive-quality briefs and materials**.
4. Explain **privacy and approval controls**.
5. Mention AI/model orchestration last, as implementation—not the promise.`;

const critique = `## Ruthless Product Critique

### Why this could fail

1. **It does not own opportunity supply.** Hidden executive roles flow through trusted networks, retained-search mandates, investors, boards and advisors. A beautiful system cannot compensate for weak access.
2. **Executives may reject self-service.** At senior levels, users often buy judgment, accountability and emotional confidence from a person. The product may need a hybrid service to feel credible.
3. **The feature bundle is easy to imitate.** Seventy-five reviewed competitors and a DIY ChatGPT/Claude plus Notion/Airtable stack cover most visible components.
4. **The Career Canon can become homework.** If ingest, verification and correction are not effortless, users will maintain a resume and abandon the richer data model.
5. **Decision scores invite false precision.** Compensation, equity, scope, culture and relocation data will often be incomplete. A polished score can be more dangerous than a candid unknown.
6. **Premium users punish mediocre writing.** Executive materials must equal excellent human counsel, not merely pass an ATS. One fabricated metric or generic summary can destroy trust.
7. **Feedback data is sparse and biased.** Rejections rarely reveal the true cause; interview progress cannot be naively attributed to one resume version.
8. **The business is episodic.** A successful user may churn precisely because the product worked; a failed user may churn because it did not.
9. **Privacy failure is existential.** Career plans, compensation, relocation constraints and confidential searches are unusually sensitive.
10. **The trust boundary costs convenience.** Refusing auto-apply and covert live assistance is the right brand choice, but some users will choose faster competitors.

### What must be exceptional

- **Time to first value:** a verified, useful Job Brief from a source URL and existing resume/CV in under 30 minutes after onboarding.
- **Factual integrity:** audited final materials contain no unsupported career claims; every statement has a visible evidence state.
- **Executive judgment:** recommendations capture role mandate, governance, P&L/scope, equity, reputation, location and option value—not keyword similarity.
- **Writing quality:** blinded executive advisors prefer or match the Engine's materials to credible human alternatives.
- **Low-friction canon:** importing and correcting evidence feels easier than maintaining a master resume.
- **Privacy clarity:** candidates can explain exactly who sees what, what each model receives and what has been approved externally.
- **Advisor leverage:** coaches measurably serve more clients or spend less time on reconciliation and rework.
- **Honest uncertainty:** the product says “unknown” and asks for evidence rather than manufacturing confidence.

If those qualities are not achievable, the rational product is a private custom tool or a coach-enabled service—not a scalable standalone SaaS category.`;

const roadmapIntro = `## Prioritized 12-Month Roadmap and Validation Plan

The roadmap is deliberately wedge-first. It excludes automatic applications, covert live interview assistance, employer-side candidate ranking, large job-board aggregation and broad enterprise integrations until the core evidence-and-decision value is paid for and trusted.`;

const validationPlan = `## Validation Scorecard and Kill Criteria

Use paid behavior and audited work products—not praise—as the primary evidence.

### Product-value checks

- **Activation:** median time from onboarding to first useful, source-backed Job Brief under 30 minutes.
- **Evidence coverage:** at least 90% of qualified roles retain official/ATS source, timestamp and complete readable evidence or an explicit limitation.
- **Claim integrity:** zero known unsupported claims in an audited sample of final approved resumes, letters and outreach; track near-misses separately.
- **Decision usefulness:** at least 70% of reviewed Job Briefs lead to a clear pursue/hold/pass decision without outside spreadsheet reconciliation.
- **Rework:** at least 50% reduction in major factual/narrative corrections versus the user's baseline workflow.
- **Engagement:** at least 60% weekly active use during an active paid search cohort.

### Commercial checks

- **Paid conversion:** at least 30% of qualified founder-led demos buy one of the two price tests.
- **Margin:** 70%+ gross margin after model, source operations, human review and support.
- **Continuity:** at least 30% of completed customers renew into continuity or refer a qualified peer.
- **Coach value:** 30% more active-client capacity or 40% less review/reconciliation time in paid pilots.

### Kill or pivot conditions

- Fewer than 15 paid executive customers after two tightly targeted cohorts and 60 qualified demos.
- Audited writing remains materially below credible human executive advisors after two revision cycles.
- Source capture or Career Canon upkeep consumes more time than users save.
- Privacy/security requirements make the tested price structurally unprofitable.
- Most paid value comes from human coaching rather than the software; in that case, reposition as a tech-enabled service instead of forcing SaaS economics.
- Users repeatedly demand hidden auto-apply or live interview assistance as the primary value; do not cross the trust boundary—change the ICP or stop.`;

const methodology = `## Methodology, Confidence and Limitations

Research was conducted on July 14, 2026 without accounts, purchases, vendor contact or access to nonpublic product areas. The review used current first-party product, pricing, help, privacy, terms, security and regulatory pages wherever possible. Public prices were not checkout-verified and may vary by country, taxes, promotions or account state.

The 77-product sample was selected for meaningful workflow overlap or substitution across candidate career systems, executive networks, outplacement, retained search, interview tools, automation, relationship CRM, general-purpose AI, compensation intelligence and enterprise talent systems. It is broad but not a census. A current Hired.com redirect was treated as an absorbed/sunset standalone product rather than counted.

Evidence confidence:

- **H:** current official product evidence plus reasonably current pricing and/or privacy material.
- **M:** official product evidence, but pricing, model, privacy or product status is incomplete or inconsistent.
- **L:** thin public disclosure or material ambiguity; use only directionally.

Analyst inferences are labeled in the dataset. Vendor-reported user counts, database sizes, outcome claims and security certifications were not independently audited. “No public evidence found” is not a claim that a feature does not exist. The feature matrix is a public-evidence matrix, not a hands-on product benchmark.

This report does not provide legal advice, a valuation, a forecast, market share or TAM/SAM/SOM. A true commercial model requires paid-pilot conversion, retention, service cost, acquisition cost and cohort outcome data.`;

const sourceAppendixIntro = `## Source Appendix

Every competitor row below includes the primary product URL, the supporting official URLs used for features/pricing/privacy, evidence confidence and the access date. Legal and market-context sources are cited inline in the relevant sections. All links were accessed July 14, 2026.`;

sourceDefs.push({
  id: "analyst_hypotheses",
  label: "Analyst pricing hypotheses",
  path: "pricing-hypotheses.csv",
  query: {
    description: "Recommendations derived from the public-source competitor inventory and sponsor-supplied product context; not observed market performance.",
    sql: "SELECT * FROM read_csv_auto('pricing-hypotheses.csv', header = true);",
    engine: "DuckDB",
    language: "sql",
    tables_used: ["pricing-hypotheses.csv"],
    filters: ["As-of 2026-07-14", "Hypotheses explicitly labeled"],
    metric_definitions: ["All price ranges, conversion gates, margin gates and roadmap thresholds in analyst tables are proposed experiments, not historical actuals."]
  }
});

sourceDefs.push({
  id: "roadmap_hypotheses",
  label: "Analyst roadmap and validation gates",
  path: "roadmap.csv",
  query: {
    description: "Proposed twelve-month sequence and kill criteria derived from the competitive synthesis.",
    sql: "SELECT * FROM read_csv_auto('roadmap.csv', header = true);",
    engine: "DuckDB",
    language: "sql",
    tables_used: ["roadmap.csv"],
    metric_definitions: ["All thresholds are proposed validation gates, not historical actuals or forecasts."]
  }
});

function tableColumns(fields, labels = {}) {
  return fields.map((field) => ({ field, label: labels[field] ?? field.replaceAll("_", " "), type: "text" }));
}

const manifest = {
  version: 1,
  surface: "report",
  title,
  description: "A source-cited review of 77 competitors and adjacencies, 15 closest threats, commercial wedges, risks, pricing hypotheses and a 12-month validation roadmap.",
  generatedAt: "2026-07-14T12:00:00-04:00",
  sources: sourceDefs,
  cards: [
    {
      id: "products_reviewed",
      description: "Unique active products and services in the reviewed inventory.",
      dataset: "headline_metrics",
      sourceId: "headline_metrics_source",
      metrics: [{ label: "Products reviewed", field: "products_reviewed", format: "number" }]
    },
    {
      id: "closest_threats",
      description: "Products selected for deeper overlap and feature analysis.",
      dataset: "headline_metrics",
      sourceId: "headline_metrics_source",
      metrics: [{ label: "Closest threats", field: "deep_dives", format: "number" }]
    },
    {
      id: "primary_sources",
      description: "Unique public first-party URLs indexed in the source appendix.",
      dataset: "headline_metrics",
      sourceId: "headline_metrics_source",
      metrics: [{ label: "Primary URLs indexed", field: "primary_urls_indexed", format: "number" }]
    },
    {
      id: "full_stack_matches",
      description: "Reviewed products whose public materials evidenced every proposed Engine capability. This is not proof none exists elsewhere.",
      dataset: "headline_metrics",
      sourceId: "headline_metrics_source",
      metrics: [{ label: "Public full-stack matches", field: "public_full_stack_matches", format: "number" }]
    }
  ],
  charts: [
    {
      id: "category_coverage_chart",
      title: "Reviewed products by category",
      subtitle: "Counts describe this research sample, not market share.",
      type: "bar",
      dataset: "category_counts",
      sourceId: "category_coverage_source",
      valueFormat: "number",
      options: { orientation: "horizontal", grouping: "grouped" },
      encodings: {
        x: { field: "category", type: "nominal", label: "Category" },
        y: { field: "reviewed_count", type: "quantitative", label: "Reviewed products", format: "number" },
        tooltip: [
          { field: "direct_count", type: "quantitative", label: "Direct", format: "number" },
          { field: "partial_count", type: "quantitative", label: "Partial", format: "number" },
          { field: "adjacent_count", type: "quantitative", label: "Adjacent", format: "number" },
          { field: "substitute_count", type: "quantitative", label: "Substitute", format: "number" }
        ]
      }
    }
  ],
  tables: [
    {
      id: "competitor_inventory_table",
      title: "Competitive inventory",
      subtitle: "77 current products and services; public list pricing and evidence as of July 14, 2026.",
      dataset: "competitors",
      sourceId: "competitive_inventory",
      density: "dense",
      defaultSort: { field: "product_company", direction: "asc" },
      columns: tableColumns(competitorHeaders, {
        product_company: "Product / company", url: "Primary URL", category: "Category", relationship: "Relationship",
        positioning_target: "Positioning and target", public_pricing: "Public pricing", core_workflow: "Core workflow",
        ai_model: "AI / model disclosure", privacy_posture: "Privacy posture", strengths: "Strengths",
        weaknesses: "Weaknesses", likely_moat: "Likely moat (inference)", engine_overlap: "Overlap with Engine",
        evidence_confidence: "Evidence confidence", sources: "Supporting official URLs"
      })
    },
    {
      id: "closest_threat_feature_matrix",
      title: "Closest-threat feature matrix",
      subtitle: "Publicly evidenced native, partial or not-found capability coverage.",
      dataset: "feature_matrix",
      sourceId: "feature_matrix_source",
      density: "dense",
      defaultSort: { field: "product", direction: "asc" },
      columns: tableColumns(matrixHeaders, {
        product: "Product", discovery: "Discovery", official_source_capture: "Official-source capture",
        full_posting_evidence: "Full-post evidence", fit_gap_scoring: "Fit/gap scoring",
        comp_relocation_logic: "Comp/relocation", evidence_canon: "Evidence Canon", ats_resume: "ATS resumes",
        executive_resume: "Executive resumes", outreach: "Outreach", feedback_learning: "Feedback learning",
        versioning: "Versioning", approval_gates: "Approval gates", application_tracking: "Application tracking",
        interview_support: "Interview support", decision_support: "Decision support"
      })
    },
    {
      id: "pricing_hypotheses_table",
      title: "Pricing hypotheses",
      subtitle: "Proposed tests, not validated willingness-to-pay findings.",
      dataset: "pricing_hypotheses",
      sourceId: "analyst_hypotheses",
      defaultSort: { field: "segment", direction: "asc" },
      columns: tableColumns(["segment", "hypothesis", "value_exchange", "test", "decision_rule"], {
        segment: "Segment", hypothesis: "Price hypothesis", value_exchange: "Value exchange", test: "Test", decision_rule: "Decision rule"
      })
    },
    {
      id: "roadmap_table",
      title: "Twelve-month roadmap",
      subtitle: "Wedge-first sequence with explicit validation gates.",
      dataset: "roadmap",
      sourceId: "roadmap_hypotheses",
      defaultSort: { field: "period", direction: "asc" },
      columns: tableColumns(["period", "objective", "build", "validation", "gate"], {
        period: "Period", objective: "Objective", build: "Build", validation: "Validation", gate: "Gate"
      })
    },
    {
      id: "source_appendix_table",
      title: "Competitor source appendix",
      subtitle: "Official public URLs and access date for every reviewed product or service.",
      dataset: "source_appendix",
      sourceId: "source_appendix_source",
      density: "dense",
      defaultSort: { field: "product_company", direction: "asc" },
      columns: tableColumns(["product_company", "primary_url", "supporting_urls", "accessed", "evidence_confidence"], {
        product_company: "Product / company", primary_url: "Primary URL", supporting_urls: "Supporting official URLs",
        accessed: "Accessed", evidence_confidence: "Evidence confidence"
      })
    }
  ],
  blocks: [
    { id: "report_title", type: "markdown", body: `# ${title}` },
    { id: "executive_summary", type: "markdown", body: executiveSummary },
    { id: "headline_metrics", type: "metric-strip", cardIds: ["products_reviewed", "closest_threats", "primary_sources", "full_stack_matches"] },
    { id: "commercial_context", type: "markdown", body: commercialContext },
    { id: "market_map", type: "markdown", body: marketMap },
    { id: "category_chart", type: "chart", chartId: "category_coverage_chart", layout: "full" },
    { id: "comparison_intro", type: "markdown", body: comparisonIntro },
    { id: "comparison_table", type: "table", tableId: "competitor_inventory_table", layout: "full" },
    { id: "deep_dive_1", type: "markdown", body: deepDive1 },
    { id: "deep_dive_2", type: "markdown", body: deepDive2 },
    { id: "deep_dive_3", type: "markdown", body: deepDive3 },
    { id: "matrix_intro", type: "markdown", body: matrixIntro },
    { id: "feature_matrix", type: "table", tableId: "closest_threat_feature_matrix", layout: "full" },
    { id: "commoditization", type: "markdown", body: commoditization },
    { id: "wedges_risks", type: "markdown", body: wedgesAndRisks },
    { id: "privacy_legal", type: "markdown", body: privacyLegal },
    { id: "icp", type: "markdown", body: icp },
    { id: "pricing_intro", type: "markdown", body: pricingIntro },
    { id: "pricing_table", type: "table", tableId: "pricing_hypotheses_table", layout: "full" },
    { id: "positioning", type: "markdown", body: positioning },
    { id: "critique", type: "markdown", body: critique },
    { id: "roadmap_intro", type: "markdown", body: roadmapIntro },
    { id: "roadmap", type: "table", tableId: "roadmap_table", layout: "full" },
    { id: "validation", type: "markdown", body: validationPlan },
    { id: "methodology", type: "markdown", body: methodology },
    { id: "sources_intro", type: "markdown", body: sourceAppendixIntro },
    { id: "sources_table", type: "table", tableId: "source_appendix_table", layout: "full" }
  ]
};

const snapshot = {
  version: 1,
  generatedAt: "2026-07-14T12:00:00-04:00",
  status: "ready",
  datasets: {
    headline_metrics: headlineMetrics,
    category_counts: categoryCounts,
    competitors,
    feature_matrix: featureMatrix,
    pricing_hypotheses: pricingHypotheses,
    roadmap,
    source_appendix: sourceAppendix
  }
};

function markdownTable(rows, fields, labels = {}) {
  const sanitize = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
  const header = `| ${fields.map((f) => labels[f] ?? f.replaceAll("_", " ")).join(" | ")} |`;
  const divider = `|${fields.map(() => "---").join("|")}|`;
  const body = rows.map((row) => `| ${fields.map((f) => sanitize(row[f])).join(" | ")} |`).join("\n");
  return `${header}\n${divider}\n${body}`;
}

const reportMarkdown = [
  `# ${title}`,
  executiveSummary,
  commercialContext,
  marketMap,
  `### Reviewed products by category\n\n${markdownTable(categoryCounts, ["category", "reviewed_count", "direct_count", "partial_count", "adjacent_count", "substitute_count"], { category: "Category", reviewed_count: "Reviewed", direct_count: "Direct", partial_count: "Partial", adjacent_count: "Adjacent", substitute_count: "Substitute" })}\n\n*Research coverage, not market share.*`,
  comparisonIntro,
  markdownTable(competitors, competitorHeaders, {
    product_company: "Product / company", url: "Primary URL", category: "Category", relationship: "Relationship",
    positioning_target: "Positioning / target", public_pricing: "Public pricing", core_workflow: "Core workflow",
    ai_model: "AI / model", privacy_posture: "Privacy", strengths: "Strengths", weaknesses: "Weaknesses",
    likely_moat: "Likely moat", engine_overlap: "Engine overlap", evidence_confidence: "Confidence", sources: "Official sources"
  }),
  deepDive1,
  deepDive2,
  deepDive3,
  matrixIntro,
  markdownTable(featureMatrix, matrixHeaders),
  commoditization,
  wedgesAndRisks,
  privacyLegal,
  icp,
  pricingIntro,
  markdownTable(pricingHypotheses, ["segment", "hypothesis", "value_exchange", "test", "decision_rule"]),
  positioning,
  critique,
  roadmapIntro,
  markdownTable(roadmap, ["period", "objective", "build", "validation", "gate"]),
  validationPlan,
  methodology,
  sourceAppendixIntro,
  markdownTable(sourceAppendix, ["product_company", "primary_url", "supporting_urls", "accessed", "evidence_confidence"])
].join("\n\n");

const readme = `# Executive Job Engine competitive landscape research\n\nGenerated July 14, 2026. This folder contains a production-neutral, read-only competitive research artifact. It does not modify or configure product code, Supabase, DNS, employers or vendor accounts.\n\n- report.md — full source-cited report\n- competitors.csv — 77-product comparison dataset\n- feature-matrix.csv — 15 closest threats across 15 capabilities\n- category-coverage.csv — research-sample taxonomy counts (not market share)\n- headline-metrics.csv — report coverage counts\n- pricing-hypotheses.csv — explicitly hypothetical price tests\n- roadmap.csv — 12-month wedge-first validation plan\n- sources.csv — product-level official URL appendix\n- artifact.json — validated Data Analytics report manifest and bounded snapshot\n- build-report.mjs — deterministic source for the files above\n- VALIDATION.md — share-readiness checks and required caveats\n`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "competitors.csv"), toCsv(competitors, competitorHeaders));
fs.writeFileSync(path.join(outDir, "feature-matrix.csv"), toCsv(featureMatrix, matrixHeaders));
fs.writeFileSync(path.join(outDir, "category-coverage.csv"), toCsv(categoryCounts, ["category", "reviewed_count", "direct_count", "partial_count", "adjacent_count", "substitute_count"]));
fs.writeFileSync(path.join(outDir, "headline-metrics.csv"), toCsv(headlineMetrics, ["products_reviewed", "deep_dives", "categories_reviewed", "primary_urls_indexed", "public_full_stack_matches"]));
fs.writeFileSync(path.join(outDir, "pricing-hypotheses.csv"), toCsv(pricingHypotheses, ["segment", "hypothesis", "value_exchange", "test", "decision_rule"]));
fs.writeFileSync(path.join(outDir, "roadmap.csv"), toCsv(roadmap, ["period", "objective", "build", "validation", "gate"]));
fs.writeFileSync(path.join(outDir, "sources.csv"), toCsv(sourceAppendix, ["product_company", "primary_url", "supporting_urls", "accessed", "evidence_confidence"]));
fs.writeFileSync(path.join(outDir, "report.md"), reportMarkdown + "\n");
fs.writeFileSync(path.join(outDir, "README.md"), readme);
fs.writeFileSync(path.join(outDir, "artifact.json"), JSON.stringify({ surface: "report", manifest, snapshot, sources: sourceDefs }, null, 2) + "\n");

console.log(JSON.stringify({ competitors: competitors.length, categories: categoryCounts.length, sources: uniqueSourceUrls.length, deep_dives: featureMatrix.length, output: outDir }, null, 2));
