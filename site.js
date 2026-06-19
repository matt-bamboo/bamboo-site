const CONTACT_EMAIL = "matt@bamboo.holdings";
const APP_CONTACT_EMAIL = "info@bamboo.holdings";
const TODAY = "June 8, 2026";

const apps = [
  {
    id: "runway",
    name: "Runway",
    slug: "/apps/runway/",
    icon: "/assets/apps/runway-icon.png",
    status: "Prelaunch",
    tagline: "Retirement income planning in plain English",
    hero: "Understand how long your money can last.",
    intro: "Runway helps retirees and near-retirees model income, savings, spending, and drawdown assumptions in a calmer, more understandable way.",
    long: "Runway is a retirement decumulation planning app built around simple planning inputs, plain-English explanations, and Clara, an AI assistant that can help users understand their retirement runway and planning assumptions.",
    users: ["Retirees planning monthly income and spending", "Near-retirees comparing savings and income assumptions", "People who want a plain-English view of their retirement runway", "Users who prefer guided planning over spreadsheets"],
    features: [["Runway estimate", "See a simple estimate of how long savings may last based on entered income, spending, and account assumptions."], ["Income and account inputs", "Enter Social Security, pension, savings, and other planning details manually."], ["Clara assistant", "Ask Clara questions about the numbers and get plain-English explanations."], ["Voice options", "Use voice input or spoken Clara responses when supported and configured."], ["Local-first planning", "Core planning inputs are primarily stored on the device."], ["No bank connection", "Runway does not connect to banks, brokerages, or account aggregators."]],
    works: ["Enter income, account balances, spending targets, and planning assumptions.", "Review the runway estimate and monthly planning view.", "Ask Clara to explain assumptions or help with updates.", "Adjust numbers as life changes.", "Use voice features when available and enabled."],
    availability: "Currently in prelaunch/TestFlight unless App Store availability is confirmed.",
    disclaimer: "Runway is an educational planning tool and does not provide financial, investment, tax, legal, or human advisor services. Users should review important financial decisions with qualified professionals.",
    support: {
      overview: "Runway is a retirement income and decumulation planning app. It helps users enter planning assumptions, review a runway estimate, and ask Clara for plain-English explanations.",
      include: ["Your iPhone model", "Your iOS version", "Runway app version if visible", "Whether the issue happened during onboarding, planning, Clara, account/settings, or voice use", "A short description of what happened and what you expected"],
      faq: [["What can support help with?", "Support can help with onboarding, planning assumptions, Clara, account/settings questions, and technical issues."], ["Does Runway provide financial advice?", "No. Runway is an educational planning tool. Clara can explain entered assumptions, but Runway does not provide financial, investment, tax, legal, or human advisor services."], ["Does Runway connect to my bank?", "No. Runway does not connect to banks, brokerages, or account aggregation services. Planning values are entered manually."], ["Does Clara require internet access?", "Yes. Clara uses an external AI provider to generate responses, so Clara requires internet access."], ["Can I use Runway without Clara?", "Core planning views are designed around entered app data. Clara and voice features may require network access and configured services."]],
      limitations: ["Prelaunch/TestFlight unless App Store availability is confirmed", "No bank or brokerage connection", "No human advisor support", "No guarantee that planning estimates will match future results", "Clara and voice features require network access and configured third-party services"]
    },
    privacy: {
      stored: ["Optional name and age", "Income amounts such as Social Security, pension, and other sources", "Account balances and account categories", "Monthly bills, spending targets, and planning assumptions", "App preferences such as voice settings and appearance", "Clara-related saved context or memory entries when the user chooses to save them"],
      local: "Runway is local-first. User planning inputs and financial assumptions are primarily stored on the user's device. Runway does not connect to banks, brokerages, or account aggregation services.",
      thirdParty: "When a user uses Clara, Runway may send chat messages and relevant retirement planning context to Google Gemini so Clara can generate a response. When voice output is enabled and configured, Runway may send the text to be spoken to ElevenLabs to generate audio. Speech-to-text may use Apple speech recognition services depending on device and platform behavior.",
      accounts: "Runway currently does not require a user account or sign-in for the local planning experience.",
      ai: "Clara uses Google Gemini for AI responses. Relevant context can include manually entered income, savings, spending target, account balances, runway estimate, app preferences, Clara messages, and saved Clara memory. Clara is a planning assistant, not a licensed financial advisor.",
      children: "Runway is not directed at children.",
      payments: "This page does not make separate claims about pricing, subscriptions, or in-app purchases.",
      tracking: "No advertising, analytics, or tracking claims are made unless confirmed against the current codebase before publication.",
      deletion: "Users can remove local Runway data through in-app reset/delete controls when available, or by deleting the app, subject to normal device backup behavior. Any data processed by third-party providers is governed by those providers' policies."
    }
  },
  {
    id: "chalk",
    name: "Chalk",
    slug: "/apps/chalk/",
    icon: "/assets/apps/chalk-icon.png",
    status: "TestFlight",
    tagline: "The gymnastics coaching companion",
    hero: "Every session. Every skill. Every athlete.",
    intro: "Chalk helps gymnastics coaches log sessions, rate skills, and send personalized drill plans to athletes and parents.",
    long: "Chalk brings the daily coaching workflow into one place. Coaches can log individual or class sessions, rate athlete skills on a simple 1-4 scale, and review personalized homework plans generated from those session ratings.",
    users: ["Gymnastics coaches", "Youth gymnasts and athletes", "Parents who want safe visibility into homework and progress", "Gym owners, program directors, and facility admins"],
    features: [["Rate, plan, send", "Log a session, rate skills, and turn practice notes into a focused homework plan."], ["Built for class flow", "Move through activity areas, collect ratings for the whole class, and review everything before closing the session."], ["Homework that fits", "Plans are generated from the day's ratings, with flexibility built in and a focused cap."], ["Four views, one workflow", "Coaches, athletes, parents, and admins each see the information they need."], ["Track the journey", "Skill trees, milestones, session history, and progress comparisons help make improvement visible."], ["Private by design", "No accounts, no ads, and no server sync in the current preview. Data is stored on the device."]],
    works: ["Choose a role: Coach, Athlete, Parent, or Admin.", "Log an individual athlete session or start a class session.", "Rate skills and add notes.", "Review the homework draft.", "Send homework to the athlete and parent views.", "Track progress over time."],
    availability: "Currently in TestFlight for iOS.",
    disclaimer: "Chalk is a preview product for youth sports workflows. Public privacy and compliance details should receive owner and legal review before launch.",
    support: {
      overview: "Chalk is a gymnastics coaching companion for session logging, skill tracking, and homework follow-through. The current preview uses local on-device data and does not include accounts or cloud sync.",
      include: ["Your iPhone model", "Your iOS version", "Chalk app version if visible", "Whether you are using demo data or custom data", "A short description of the issue"],
      faq: [["How do I log a training session?", "Open the Coach view, choose an athlete or class, rate the relevant skills, add notes if needed, and save the session."], ["What do the 1-4 ratings mean?", "1 means Needs Work, 2 means Developing, 3 means Almost There, and 4 means Nailed It."], ["How does homework get created?", "After a session, Chalk creates a homework draft from the ratings. Coaches can review and adjust the plan before sending it."], ["Does Chalk require a login?", "No. The current preview has no account system. It opens to a role picker."], ["Will data sync to another device?", "No. Current data is stored on the device only and does not sync across devices."]],
      limitations: ["iOS TestFlight only currently", "No account system", "No cloud backup or multi-device sync", "No Android build currently", "No push notifications currently", "No AI processing or machine learning in the homework engine", "Data can be lost if the app is deleted or the device is replaced without backup"]
    },
    privacy: {
      stored: ["Athlete names and ages", "Coach names and roster information", "Parent display information in demo or facility data", "Session ratings and notes", "Homework plans and completion records", "Practice logs", "Skill progress and milestone records", "Custom skills and drills", "Facility name, tagline, and location text", "Class, program, roster, and curriculum configuration", "Optional skill video URLs"],
      local: "Current Chalk preview data is stored locally on the user's device. Chalk does not currently operate a user account system, backend database, or server sync for product data.",
      thirdParty: "No third-party AI, analytics, advertising, tracking, or crash-reporting services are used in the current preview. Optional video links may be entered as skill references, but Chalk does not upload user training data to those services.",
      accounts: "Chalk currently has no account system, login flow, Apple Sign In, Google Sign In, or remote profile.",
      ai: "Chalk does not use AI or external model providers for homework generation. Homework is generated by local rule-based logic.",
      children: "Chalk may be used to store information about youth athletes, including names, ages, skill notes, and training records. This section should receive legal review before public launch.",
      payments: "Chalk currently has no subscriptions, in-app purchases, or payment processing.",
      tracking: "Chalk currently does not use analytics SDKs, advertising identifiers, behavioral tracking, or third-party crash reporting.",
      deletion: "Users can reset demo data from Admin settings. App deletion also removes locally stored app data, subject to device backup behavior. There is currently no cloud account to delete."
    }
  },
  {
    id: "allotment-optimizer",
    name: "Allotment Optimizer",
    slug: "/apps/allotment-optimizer/",
    icon: "/assets/apps/allotment-optimizer-icon.png",
    status: "Preparing for iOS release",
    supportEmail: "matt@bamboo.holdings",
    tagline: "Cannabis allotment planning, on device",
    hero: "A clearer way to estimate and track personal allotment usage.",
    intro: "Allotment Optimizer is an informational planning tool for Arizona adults who want a clearer way to estimate and track cannabis allotment usage.",
    long: "Allotment Optimizer is designed for personal planning, education, and recordkeeping. It helps users estimate allotment usage, organize product details, and compare planning scenarios without selling cannabis, processing orders, connecting users to dispensaries for transactions, or replacing official state, medical, or dispensary records.",
    users: ["Arizona adults who want a personal planning record", "Patients or adult-use consumers tracking their own estimated allotment usage", "People comparing product weights, prices, and deals for informational planning", "Users who prefer local-only tools with no account or analytics"],
    features: [["Estimate allotment usage", "Track gram amounts and personal planning scenarios against an estimated allotment."], ["Compare planning scenarios", "Review combinations of product weights, prices, and deals as informational estimates only."], ["Keep local records", "Store products, purchase history, favorites, quick links, and settings on device."], ["Manual backup and restore", "Export or restore a JSON backup using the device file picker or share sheet."], ["No account required", "The app is designed without accounts, analytics, ads, tracking, or backend collection."], ["Adult-focused disclaimers", "The app includes a first-launch 21+ gate and makes clear it is not legal, medical, tax, or purchasing advice."]],
    works: ["Set an estimated allotment mode and planning preferences.", "Add product weights, prices, and optional deal details.", "Review informational combinations and planning estimates.", "Record purchases for personal tracking.", "Use reset or manual backup/export tools when managing local data.", "Verify all legal limits, pricing, tax, and availability with official sources and licensed dispensaries."],
    availability: "Prepared for iOS App Store release. The app is free.",
    disclaimer: "Allotment Optimizer is an informational planning and recordkeeping tool only. It does not sell cannabis, process orders, facilitate checkout or delivery, provide legal, medical, or tax advice, or replace official state, medical, or dispensary records.",
    support: {
      overview: "Allotment Optimizer is an on-device informational planning tool for Arizona adults. Support can help with local app behavior, settings, backup and restore, and general troubleshooting.",
      include: ["Device type", "iOS version", "Allotment Optimizer app version if available", "Whether the issue involves planning, history, quick links, backup, restore, or reset", "A short description of the issue"],
      faq: [["Does Allotment Optimizer sell cannabis or process orders?", "No. The app does not sell cannabis, process orders, facilitate checkout, delivery, or cannabis transactions, or connect users to dispensaries for transactions."], ["Is this an official allotment record?", "No. The app is for personal planning and education. It does not replace official state, medical, dispensary, or registry records."], ["Does the app require an account?", "No. Allotment Optimizer does not require an account or sign-in."], ["Does data sync across devices?", "No. Data is stored on device. Manual JSON backup and restore are the current user-directed way to move data."], ["Can support recover my app data?", "No. Bamboo Holdings does not receive app data or backup files through the app, so support cannot recover deleted local data."]],
      limitations: ["Arizona-focused informational planning", "Adults 21+ only", "No official government, medical, legal, tax, or dispensary-record authority", "No account recovery", "No cloud sync or automatic backup", "Manual backup/export is user-directed", "Local data can be lost if the app is deleted before backup"]
    },
    privacy: {
      stored: ["Allotment settings and planning preferences", "Product names, weights, prices, deal details, and planning inputs", "Purchase history and local records entered by the user", "Saved product library items", "Quick links and favorites", "Manual JSON backup files only when the user chooses to export them"],
      local: "Allotment Optimizer stores app information locally on the user's device. Bamboo Holdings does not receive personal app data through a backend service, account system, analytics pipeline, or cloud sync feature.",
      thirdParty: "The app does not use analytics, advertising, tracking SDKs, backend sync, or third-party AI processing. If a user opens a saved quick link or website in the in-app browser, that user is interacting directly with the third-party website under that site's own terms and privacy practices.",
      accounts: "Allotment Optimizer does not require an account, sign-in, profile, or remote identity.",
      ai: "Allotment Optimizer does not use AI or external model providers.",
      children: "Allotment Optimizer is intended for adults 21 and older where cannabis is legal. It is not directed to children.",
      payments: "The app is free and does not process payments, cannabis orders, checkout, delivery, or transactions.",
      tracking: "Data Not Collected. The app does not use analytics, ads, advertising identifiers, third-party tracking, or behavioral profiling.",
      deletion: "Users can clear local app data with in-app reset controls or by deleting the app. Manual backup and restore are user-directed actions using the device file picker or share sheet, and Bamboo Holdings does not receive uploaded backup files through the app."
    }
  },
  {
    id: "drip",
    name: "DRIP",
    slug: "/apps/drip/",
    status: "Static web MVP",
    tagline: "Fast browser arcade play",
    hero: "A lightweight arcade game you can play right in the browser.",
    intro: "DRIP is a fast, lightweight browser arcade game from Bamboo Holdings. It is built to play directly on the web with no account, payment, or app download required today.",
    long: "DRIP is currently a static web MVP. Gameplay runs in the browser, native TestFlight packaging is planned separately, and these pages avoid public App Store or TestFlight availability claims until those records exist.",
    users: ["Players who want quick arcade-style sessions", "People who prefer instant web play", "Users who do not want to create an account", "Players who want a lightweight game with simple local preferences"],
    features: [["Play on the web", "Open DRIP in a modern browser and start playing without an app download today."], ["No account required", "DRIP does not require sign-in, account creation, or a user profile."], ["No payments or ads", "The current MVP does not process payments, run ads, or require subscriptions."], ["No AI or voice features", "DRIP does not use AI providers, microphone input, speech recognition, text-to-speech, or voice commands."], ["Browser-based gameplay", "Core game logic runs in the browser without a gameplay backend or database."], ["Small local preference", "The game may save a small local browser preference for tutorial or coach-mark dismissal."]],
    works: ["Open DRIP on the web.", "Use a modern browser for the best game performance.", "Adjust browser audio or mute settings if sound is not playing.", "Refresh the page if the game appears stuck.", "Clear site data only if normal refresh troubleshooting does not resolve the issue."],
    availability: "Available as a static web MVP. Native/TestFlight packaging is planned but not public yet.",
    disclaimer: "DRIP is an early static web game MVP. Native packaging, TestFlight availability, App Store records, and final release details should be confirmed before public release claims are expanded.",
    support: {
      overview: "DRIP is a browser-based arcade game. It does not require an account, payment, or app download to play the current web MVP.",
      include: ["Device type", "Browser name and version", "Whether the issue involves loading, controls, audio, or progress through the tutorial", "A short description of what happened", "Screenshots if helpful"],
      faq: [["Do I need an account to play?", "No. DRIP does not require an account, sign-in, or profile."], ["What should I try if the game does not load?", "Refresh the browser, then try a modern browser if the issue continues."], ["What should I try if audio does not play?", "Check browser mute settings, device volume, and whether the page needs a tap or click before audio starts."], ["Should I clear site data?", "Only if normal troubleshooting does not help. Clearing site data may reset local browser preferences such as tutorial or coach-mark dismissal."], ["Is DRIP already in TestFlight or the App Store?", "No public TestFlight or App Store availability claim is made on this page. Native packaging is planned separately."]],
      limitations: ["Static web MVP", "No account recovery because there is no account system", "No cloud save or cross-device sync", "No gameplay backend or database required", "Native/TestFlight packaging is planned but not public yet"]
    },
    privacy: {
      stored: ["A small local browser preference for tutorial or coach-mark dismissal", "Browser-level cache or storage created by normal static site loading"],
      local: "DRIP gameplay runs in the browser and does not require a backend account or gameplay database. The current MVP may store a small local browser preference for tutorial or coach-mark dismissal.",
      thirdParty: "DRIP does not use AI providers, Replit AI, payment processors, advertising SDKs, voice providers, microphone services, speech recognition, text-to-speech, or a gameplay backend. The public Bamboo site is served by web hosting infrastructure, so standard hosting logs may exist outside the game itself.",
      accounts: "DRIP does not require an account, sign-in, profile, Apple Sign In, Google Sign In, or remote user identity.",
      ai: "DRIP does not use OpenAI, Anthropic, Gemini, ElevenLabs, Replicate, Hugging Face, LangChain, Vercel AI SDK, Replit AI, or similar AI/model SDKs in the current MVP.",
      children: "DRIP is a general arcade-style browser game and is not designed to collect personal information from children.",
      payments: "DRIP does not process payments, subscriptions, in-app purchases, checkout, or financial transactions in the current MVP.",
      tracking: "DRIP itself does not intentionally collect gameplay personal information. No global analytics script was found in the current Bamboo site source during this update; standard hosting logs may still be created by the hosting provider.",
      deletion: "Users can clear local browser site data if they want to remove locally stored DRIP preferences. Because DRIP has no account system or gameplay backend database, there is no DRIP account to delete."
    }
  },
  {
    id: "triptracker-pro",
    name: "TripTracker Pro",
    slug: "/apps/triptracker-pro/",
    icon: "/assets/apps/triptracker-pro-icon.png",
    status: "Available on iOS",
    appStoreUrl: "https://apps.apple.com/us/app/triptracker-pro/id6762306487",
    tagline: "AI-powered resort receipt tracking",
    hero: "Every charge, every tip, every receipt - accounted for.",
    intro: "TripTracker Pro helps resort travelers scan receipts, track expenses, reconcile hotel bills, split costs, and keep a clean record of their trip.",
    long: "TripTracker Pro turns the financial chaos of a resort vacation into a clear, organized record. Travelers can photograph receipts, review AI-extracted line items, compare saved receipts against a hotel folio, track shared expenses, and keep notes about resorts and staff.",
    users: ["Frequent resort and timeshare travelers", "Travelers managing multi-person trips", "People who want to reconcile hotel folios before checkout", "Travelers who track cash tips, card charges, and shared expenses", "Resort guests who want notes and records to carry forward to future stays"],
    features: [["Scan receipts as you go", "Capture receipts during the trip and review extracted details before saving."], ["Reconcile your hotel bill", "Compare your final folio against saved receipts and spot charges that need review."], ["Split costs without a spreadsheet", "Track shared expenses and see a clean settlement summary at the end of the trip."], ["Remember staff and tips", "Keep a record of staff names, roles, and tip history across resort visits."], ["Keep resort notes", "Save details about a property so they are available next time you return."], ["Export your trip record", "Create a portable trip file for personal records or device migration."]],
    works: ["Create a trip with resort, dates, currencies, and optional budget.", "Scan receipts throughout the stay.", "Upload the hotel folio near checkout.", "Review matched and disputed charges.", "Settle shared expenses.", "Export a clean trip summary."],
    availability: "Available now on the iOS App Store. Android coming soon.",
    disclaimer: "TripTracker Pro is a personal record-keeping tool. AI extraction may be incomplete or incorrect, and users should review receipts, folios, and exports carefully.",
    support: {
      overview: "TripTracker Pro is a personal travel expense tracker for resort trips. Most issues can be fixed directly in the app by editing receipts, updating trip settings, or exporting/importing trip data.",
      include: ["Device model", "iOS or Android version", "TripTracker Pro version if visible in Settings", "A short description of the issue", "Screenshots if helpful"],
      faq: [["How do I scan a receipt?", "Open the receipt scanning flow, take a clear photo, review the extracted fields, correct anything that looks wrong, and save."], ["Can I fix an AI extraction mistake?", "Yes. Open the receipt and edit the incorrect fields manually."], ["How does folio reconciliation work?", "Upload a hotel folio or final bill. TripTracker Pro compares the folio line items against saved receipts and expenses."], ["Does TripTracker Pro sync across devices?", "No. Current trip data is stored locally on the device. Export/import is the current way to move data."], ["Does the app work offline?", "Many tracking features can work without internet. AI-powered scanning, folio extraction, assistant features, and weather-related features require internet access."]],
      limitations: ["No cross-device sync currently", "No account recovery because there is no account system", "AI extraction depends on image quality and receipt format", "Exchange rates are user-configured and may not match actual transaction rates", "Manual export/import is required to move records between devices"]
    },
    privacy: {
      stored: ["Trip names, dates, resort details, room details, and traveler names", "Receipt amounts, item names, tips, totals, and currencies", "Receipt photos and hotel folio photos", "Cash expenses and shared ledger entries", "Staff names, staff roles, and tip history", "Flight details and confirmation information", "Resort notes and saved places", "App preferences", "AI assistant messages and uploaded context"],
      local: "Trip records, receipts, expenses, ledger entries, notes, people records, and preferences are stored on the user's device. Receipt and folio images may be stored in the device file system.",
      thirdParty: "AI-powered features may transmit relevant content to a third-party AI provider for processing. This can include receipt images, folio images, flight confirmation images, extracted text, or assistant messages. Weather-related features may use a weather or geocoding service based on resort location information.",
      accounts: "TripTracker Pro currently does not require a user account or sign-in.",
      ai: "Receipt, folio, flight, and assistant features may use external AI processing. AI results should be reviewed and corrected when needed.",
      children: "TripTracker Pro is not intended for children under 13.",
      payments: "TripTracker Pro is available through the iOS App Store. This page does not make separate claims about pricing, subscriptions, or in-app purchases.",
      tracking: "No analytics, advertising, or tracking claims are made unless confirmed against the current codebase before publication.",
      deletion: "Users can delete app records from within the app. Exact full-data-reset behavior should be confirmed before publishing detailed instructions."
    }
  },
  {
    id: "match-card",
    name: "Match Card",
    slug: "/apps/match-card/",
    icon: "/assets/apps/match-card-icon.png",
    status: "Available on iOS",
    appStoreUrl: "https://apps.apple.com/us/app/match-card-pro/id6762983683",
    tagline: "Golf scorecard and round analytics",
    hero: "Your courses. Your rivalry. One scorecard.",
    intro: "Match Card is a local-first golf scorecard and round tracker for iPhone. It helps regular playing partners score rounds, track players and courses, review stats, and keep a head-to-head golf rivalry organized.",
    long: "Match Card is built for golfers who play familiar courses with a regular partner and want a fast scorecard without a required account. Core round data is stored on device, live scoring is designed to stay simple, optional backup can be enabled separately, and tap-initiated voice scoring is available for players who want to keep the round moving.",
    users: ["Recreational golfers who play regularly with the same partner", "Two-player golf rivalries", "Golfers who care about course-specific history and head-to-head records", "Players who want a cleaner alternative to bloated golf apps", "Golfers who want side-game math handled for them"],
    features: [["Live scoring, one-handed", "Fast hole-by-hole scoring with auto-saving drafts."], ["Score with your voice", "Tap the mic, say the scores, and keep the round moving."], ["Built for rivalries", "Track the head-to-head between you and your regular playing partner."], ["Course and player tracking", "Keep useful course, player, and round history in one place."], ["Side games organized", "Track friendly side games without spreadsheet math."], ["Share the round", "Generate clean post-round share cards for scores, stats, and highlights."]],
    works: ["Set your two player names.", "Choose or add a course.", "Score each hole by tap or voice.", "Save the round.", "Review side games and the season trophy.", "Share the result if you want."],
    availability: "Available now on the iOS App Store.",
    disclaimer: "Match Card can tally friendly side games, but it does not process payments, transfer money, or settle wagers.",
    support: {
      overview: "Match Card is a two-player golf scorecard for iPhone. It does not require an account and is designed to work offline for round scoring.",
      include: ["iPhone model", "iOS version", "Match Card app version if visible", "What happened", "What you expected to happen", "What screen you were on", "Screenshots if helpful"],
      caution: "Owner review: confirm the canonical support email before using this page in App Store metadata. The App Store listing currently uses Match Card Pro, while the installed app display name is Match Card.",
      faq: [["Do I need an account?", "No. Match Card does not require sign-in or account creation."], ["How does voice scoring work?", "Tap the microphone on the live scoring screen and say the scores. Recording starts only when the user taps the microphone."], ["Why does the app ask for location?", "Location may be used to capture a weather stamp for the round or bias course search. If location is denied, the app should still support scoring."], ["Is my data backed up?", "Only if the user enables optional backup. Backup is off by default."], ["Does Match Card handle money or betting payments?", "No. Match Card can tally friendly side games, but it does not process payments, transfer money, or settle wagers."]],
      limitations: ["iOS only currently", "No live multi-device sync", "Optional backup is not an account system"]
    },
    privacy: {
      stored: ["Round scores and scoring details", "Player names", "Course and venue records", "Hole notes and course history", "Bag and club data", "Side-game results", "App settings", "Attached local photo references", "Derived stats, records, and handicap calculations"],
      local: "Match Card is local-first and account-free. Core scoring, stats, course, player, side-game, and settings data is stored on the user's device.",
      thirdParty: "Depending on which features the user chooses, Match Card may send limited data to service providers. Tap-initiated voice scoring may send audio to the Match Card backend and OpenAI for transcription and parsing. Course search may use OpenStreetMap/Nominatim and an OpenAI fallback. Weather may use Open-Meteo based on approximate course or location coordinates.",
      accounts: "Match Card currently does not require user accounts, login, email, Apple Sign In, or Google Sign In.",
      ai: "Voice scoring and course-search fallback may use OpenAI only for the feature the user requested. These AI features are used only for requested scoring or search features and are not used for advertising or third-party tracking.",
      children: "Match Card is not directed at children.",
      payments: "Match Card is available through the iOS App Store. Match Card does not process payments, transfer money, or settle wagers.",
      tracking: "Match Card does not use ads or third-party tracking.",
      deletion: "Users can erase local data in the app. Optional backup, if enabled, should be deleted separately through the backup feature."
    }
  }
];

const nav = [
  ["Home", "/#top"],
  ["Bio", "/#bio"],
  ["Apps", "/#apps"]
];

const featuredAppIds = new Set(["chalk", "triptracker-pro", "match-card"]);
const featuredApps = apps.filter(app => featuredAppIds.has(app.id));

const footerLinks = [
  ["Maya's Work", "/maya/"],
  ["Chalk", "/apps/chalk/"],
  ["TripTracker Pro", "/apps/triptracker-pro/"],
  ["Match Card", "/apps/match-card/"]
];

const siteRootUrl = new URL(".", document.currentScript ? document.currentScript.src : window.location.href);
const isFilePreview = window.location.protocol === "file:";

function assetUrl(path) {
  if (/^(mailto:|https?:|file:|#)/.test(path)) return path;
  if (!isFilePreview) return path;
  return new URL(path.replace(/^\//, ""), siteRootUrl).href;
}

function pageUrl(path) {
  if (/^(mailto:|https?:|file:|#)/.test(path)) return path;
  if (!isFilePreview) return path;
  const clean = path.replace(/^\//, "");
  if (!clean) return new URL("index.html", siteRootUrl).href;
  if (clean.endsWith("/")) return new URL(`${clean}index.html`, siteRootUrl).href;
  return new URL(clean, siteRootUrl).href;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function list(items) {
  return `<ul class="list">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function cards(items) {
  return `<div class="grid">${items.map(([title, body]) => `<article class="card"><h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join("")}</div>`;
}

function appIcon(app) {
  const initials = esc(app.name.split(" ").map(word => word[0]).join("").slice(0, 2));
  if (app.icon) {
    return `<div class="app-icon has-image"><img src="${esc(assetUrl(app.icon))}" alt="${esc(app.name)} icon" onerror="this.parentElement.classList.remove('has-image'); this.replaceWith(document.createTextNode('${initials}'))"></div>`;
  }
  return `<div class="app-icon" aria-hidden="true">${initials}</div>`;
}

function appStoreBadge(url) {
  return `<a class="app-store-badge" href="${esc(url)}" aria-label="Download on the App Store">
    <img src="${assetUrl("/assets/brand/download-on-app-store.svg")}" alt="Download on the App Store">
  </a>`;
}

function shell(title, active, content) {
  const footerEmail = currentRoutePath().startsWith("/apps/") ? APP_CONTACT_EMAIL : CONTACT_EMAIL;
  const brandMedia = `<img src="${assetUrl("/assets/brand/bamboo-holdings-logo-hq.png")}" alt="" onerror="this.src='${assetUrl("/assets/brand/bamboo-logo.png")}'; this.onerror=()=>this.replaceWith(Object.assign(document.createElement('span'), {className: 'brand-mark', textContent: 'B'}))">`;
  const footerLinksHtml = [
    `<a href="mailto:${footerEmail}">${footerEmail}</a>`,
    ...footerLinks.map(([label, href]) => `<a href="${pageUrl(href)}">${label}</a>`)
  ].join("");
  document.title = title;
  document.body.className = active === "Home" ? "home-page" : "";
  document.body.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="ambient-frame" aria-hidden="true"><span></span><span></span><span></span></div>
    <header class="site-header">
      <div class="inner">
        <nav class="nav" aria-label="Primary">
          <a class="brand" href="${pageUrl("/")}">
            ${brandMedia}
            <span>Bamboo Holdings</span>
          </a>
          <div class="nav-links">${nav.map(([label, href]) => `<a href="${pageUrl(href)}"${label === active ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</div>
        </nav>
      </div>
    </header>
    <main id="main">${content}</main>
    <footer class="site-footer">
      <div class="inner footer-grid">
        <div class="footer-meta">
          <span>&copy; ${new Date().getFullYear()} Bamboo Holdings. All rights reserved.</span>
        </div>
        <nav class="footer-links" aria-label="Footer links">
          ${footerLinksHtml}
        </nav>
      </div>
    </footer>`;
  document.addEventListener("pointermove", event => {
    const x = Math.round((event.clientX / Math.max(window.innerWidth, 1)) * 100);
    const y = Math.round((event.clientY / Math.max(window.innerHeight, 1)) * 100);
    document.documentElement.style.setProperty("--cursor-x", `${x}%`);
    document.documentElement.style.setProperty("--cursor-y", `${y}%`);
  }, { passive: true });
  const revealItems = document.querySelectorAll(".card:not(.portfolio-card), .split, .app-hero-layout, .scroll-reveal");
  revealItems.forEach((item, index) => {
    item.classList.add("reveal");
    item.style.setProperty("--delay", `${Math.min(index * 45, 360)}ms`);
  });
  const stagedItems = document.querySelectorAll(".story-stage, .app-stage, .hero-title, .bio-card, .apps-heading");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    stagedItems.forEach(item => observer.observe(item));
  } else {
    stagedItems.forEach(item => item.classList.add("is-visible"));
  }
  const heroVideo = document.querySelector(".hero-media");
  if (heroVideo) {
    const startVideo = () => heroVideo.play().catch(() => {});
    if (heroVideo.readyState > 0) startVideo();
    heroVideo.addEventListener("canplay", startVideo, { once: true });
    window.addEventListener("pointerdown", startVideo, { once: true, passive: true });
    window.addEventListener("scroll", startVideo, { once: true, passive: true });
  }
  const sceneVideos = document.querySelectorAll(".forest-media");
  sceneVideos.forEach(video => {
    const startVideo = () => video.play().catch(() => {});
    if (video.readyState > 0) startVideo();
    video.addEventListener("canplay", startVideo, { once: true });
  });
  const introVideo = document.querySelector(".forest-intro .forest-media");
  const bioSection = document.querySelector("#bio");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (introVideo && bioSection && window.location.hash !== "#bio" && !prefersReducedMotion) {
    let autoScrollUsed = false;
    let visitorMoved = false;
    const cancelAutoScroll = () => { visitorMoved = true; };
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(eventName => {
      window.addEventListener(eventName, cancelAutoScroll, { once: true, passive: true });
    });
    const ease = progress => progress * progress * progress * (progress * (progress * 6 - 15) + 10);
    const glideToBio = () => {
      const startY = window.scrollY;
      const endY = bioSection.getBoundingClientRect().top + window.scrollY;
      const distance = endY - startY;
      const duration = 3200;
      const started = performance.now();
      const rootStyle = document.documentElement.style;
      const previousScrollBehavior = rootStyle.scrollBehavior;
      rootStyle.scrollBehavior = "auto";
      const step = now => {
        if (visitorMoved) {
          rootStyle.scrollBehavior = previousScrollBehavior;
          return;
        }
        const progress = Math.min((now - started) / duration, 1);
        window.scrollTo(0, startY + (distance * ease(progress)));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          window.scrollTo(0, endY);
          rootStyle.scrollBehavior = previousScrollBehavior;
        }
      };
      requestAnimationFrame(step);
    };
    introVideo.addEventListener("timeupdate", () => {
      if (autoScrollUsed || visitorMoved || window.scrollY > 18 || !introVideo.duration) return;
      if (introVideo.currentTime >= introVideo.duration * 0.5) {
        autoScrollUsed = true;
        glideToBio();
      }
    });
  }
  const updateScrollScenes = () => {
    document.body.classList.toggle("is-scrolled", window.scrollY > 32);
    document.querySelectorAll(".forest-scene").forEach(section => {
      const rect = section.getBoundingClientRect();
      const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
      section.style.setProperty("--forest-progress", progress.toFixed(4));
    });
  };
  updateScrollScenes();
  window.addEventListener("scroll", updateScrollScenes, { passive: true });
  window.addEventListener("resize", updateScrollScenes, { passive: true });
}

function home() {
  const featured = featuredApps;
  shell("Bamboo Holdings", "Home", `
    <section id="top" class="forest-scene forest-intro">
      <video class="forest-media" autoplay muted loop playsinline poster="${assetUrl("/assets/brand/bamboo-forest-poster.jpg")}" aria-hidden="true">
        <source src="${assetUrl("/assets/brand/bamboo-forest-hero.mp4")}" type="video/mp4">
      </video>
      <div class="forest-shade" aria-hidden="true"></div>
      <a class="scroll-cue" href="${pageUrl("#bio")}" aria-label="Scroll to bio"><span></span></a>
    </section>
    <section id="bio" class="bio-reveal">
      <div class="inner bio-card">
        <div class="bio-copy">
          <div class="bio-photo">
            <img src="${assetUrl("/assets/brand/matthew-grossman-headshot.jpg")}" alt="Matthew Grossman" onerror="this.parentElement.classList.add('missing-photo'); this.remove();">
          </div>
          <p class="bio-lede">I’m Matthew Grossman, and I build systems that scale.</p>
          <p>I’m a founder, operator, and advisor working at the intersection of logistics, technology, people, and execution, usually in places where things are messy, moving fast, and need to work anyway.</p>
          <p>After graduating from Arizona State University in 2007, I co-founded <strong>Dorm Room Movers</strong> and spent <strong>16 years</strong> scaling it into a nationwide, asset-light logistics platform serving <strong>300+ universities and boarding schools</strong> across <strong>42 states</strong>, including Yale, Carnegie Mellon, UMass Amherst, Choate Rosemary Hall, Berkshire School, and IMG Academy. To make it work, we built custom technology to coordinate a distributed network of over <strong>200 local partners and national van line agents</strong>.</p>
          <p>The business was built for pressure. Roughly <strong>90% of annual revenue</strong> happened inside a <strong>six-week window</strong>, which meant forecasting had to be right, vendors had to show up, schools had to trust us, customers had to be supported, and the systems had to hold. Every year was a live stress test.</p>
          <p>Before Dorm Room Movers, I worked with <strong>iEnergizer</strong>, helping build and operate a <strong>250-seat corporate operations and customer service center</strong> in Austin supporting <strong>Electronic Arts</strong>. That experience gave me an early foundation in enterprise operations, team leadership, and high-volume execution.</p>
          <p>Since exiting Dorm Room Movers in 2023, I’ve spent more time with my wife and three daughters, stayed active in <strong>Entrepreneurs’ Organization (EO) Arizona</strong>, mentored founders through <strong>EO Accelerator</strong>, and started building what comes next through <strong>Bamboo Holdings</strong>. Today, I advise scaling companies, build software products, and explore new ideas across AI, automation, logistics, financial technology, and real-world operations.</p>
          <p>It all comes back to one core belief: pressure is useful. It shows you where the weak points are, who is aligned, what needs to change, and what kind of system is strong enough to keep going.</p>
          <blockquote class="bio-quote">
            <p>“Good timber does not grow with ease. The stronger wind, the stronger trees.”</p>
            <cite>Douglas Malloch</cite>
          </blockquote>
        </div>
      </div>
    </section>
    <section id="apps" class="apps-reveal">
      <div class="apps-wrap">
        <div class="inner app-stage">
          <div class="apps-heading">
            <h2>Current apps</h2>
          </div>
          <div class="app-grid">
            ${featured.map((app, index) => portfolioCard(app, index)).join("")}
          </div>
        </div>
      </div>
    </section>
    `);
}

function portfolioCard(app, index = 0) {
  return `<article class="card portfolio-card app-card-${esc(app.id)}">
    <div class="app-card-top">
      ${appIcon(app)}
      ${app.appStoreUrl ? appStoreBadge(app.appStoreUrl) : `<span class="status">${esc(app.status)}</span>`}
    </div>
    <h3>${esc(app.name)}</h3>
    <p class="app-tagline">${esc(app.tagline)}</p>
    <p>${esc(app.intro)}</p>
    <div class="mini-links">
      <a href="${pageUrl(app.slug)}">Overview</a>
      <a href="${pageUrl(`${app.slug}support/`)}">Support</a>
      <a href="${pageUrl(`${app.slug}privacy/`)}">Privacy</a>
    </div>
  </article>`;
}


function appPage(app) {
  shell(`${app.name} - Bamboo Holdings`, "Apps", `
    <section class="app-hero">
      <div class="inner app-hero-layout">
        <div>
          <p class="eyebrow">${esc(app.name)}</p>
          <span class="status">${esc(app.status)}</span>
          <h1>${esc(app.hero)}</h1>
          <p class="lede">${esc(app.intro)}</p>
          <p class="copy">${esc(app.long)}</p>
          <div class="actions">${app.appStoreUrl ? appStoreBadge(app.appStoreUrl) : ""}<a class="button${app.appStoreUrl ? " secondary" : ""}" href="${pageUrl(`${app.slug}support/`)}">Support</a><a class="button secondary" href="${pageUrl(`${app.slug}privacy/`)}">Privacy</a></div>
        </div>
        <div class="product-panel">
          ${appIcon(app)}
          <div class="product-screen">
            ${app.features.slice(0, 4).map(([title, body]) => `<div class="screen-row"><strong>${esc(title)}</strong><span>${esc(body).slice(0, 72)}${body.length > 72 ? "..." : ""}</span></div>`).join("")}
          </div>
          <p class="copy">${esc(app.availability)}</p>
        </div>
      </div>
    </section>
    <section class="inner section">
      <div class="split"><div><p class="eyebrow">Who it is for</p><h2>${esc(app.tagline)}</h2></div><div>${list(app.users)}</div></div>
    </section>
    <section class="band section"><div class="inner"><p class="eyebrow">Key features</p>${cards(app.features)}</div></section>
    <section class="inner section">
      <div class="split"><div><p class="eyebrow">How it works</p><h2>A simple flow from setup to useful output.</h2></div><div>${list(app.works)}</div></div>
    </section>
    <section class="inner section tight"><div class="notice"><strong>Status:</strong> ${esc(app.availability)}<br><strong>Responsible note:</strong> ${esc(app.disclaimer)}</div></section>`);
}

function supportPage(app) {
  const supportEmail = app.supportEmail || APP_CONTACT_EMAIL;
  shell(`${app.name} Support - Bamboo Holdings`, "Apps", `
    <section class="inner hero narrow">
      <p class="eyebrow">${esc(app.name)} support</p>
      <h1>Support for ${esc(app.name)}</h1>
      <p class="lede">${esc(app.support.overview)}</p>
      <p class="copy">For help, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      <div class="actions"><a class="button secondary" href="${pageUrl(app.slug)}">Back to ${esc(app.name)}</a><a class="button secondary" href="${pageUrl(`${app.slug}privacy/`)}">Privacy</a></div>
    </section>
    <section class="inner section tight prose">
      <h2>When contacting support</h2>
      ${list(app.support.include)}
      ${app.support.caution ? `<p class="notice">${esc(app.support.caution)}</p>` : ""}
      <h2>FAQ</h2>
      ${app.support.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}
      <h2>Known limitations</h2>
      ${list(app.support.limitations)}
    </section>`);
}

function privacyPage(app) {
  shell(`${app.name} Privacy - Bamboo Holdings`, "Apps", `
    <section class="inner hero narrow">
      <p class="eyebrow">${esc(app.name)} privacy</p>
      <h1>Privacy overview for ${esc(app.name)}</h1>
      <p class="lede">Effective date: ${TODAY}. This page uses cautious public-safe language from the current reference packet and should be reviewed before public launch.</p>
      <div class="actions"><a class="button secondary" href="${pageUrl(app.slug)}">Back to ${esc(app.name)}</a><a class="button secondary" href="${pageUrl(`${app.slug}support/`)}">Support</a></div>
    </section>
    <section class="inner section tight prose">
      <h2>Data stored</h2>
      ${list(app.privacy.stored)}
      <h2>Data processed locally</h2>
      <p>${esc(app.privacy.local)}</p>
      <h2>Data processed by third parties</h2>
      <p>${esc(app.privacy.thirdParty)}</p>
      <h2>Account/auth status</h2>
      <p>${esc(app.privacy.accounts)}</p>
      <h2>AI processing status</h2>
      <p>${esc(app.privacy.ai)}</p>
      <h2>Children/minors note</h2>
      <p>${esc(app.privacy.children)}</p>
      <h2>Payments note</h2>
      <p>${esc(app.privacy.payments)}</p>
      <h2>Analytics/tracking note</h2>
      <p>${esc(app.privacy.tracking)}</p>
      <h2>Data deletion note</h2>
      <p>${esc(app.privacy.deletion)}</p>
      <h2>Contact</h2>
      <p>Questions can be sent to <a href="mailto:${APP_CONTACT_EMAIL}">${APP_CONTACT_EMAIL}</a>.</p>
    </section>`);
}

function mayaWorkPage() {
  const story = {
    title: "The Dragon Glass Map",
    series: "The Adventures of Elizabeth and Scarlet",
    edition: "Ages 9-12 illustrated middle grade edition",
    href: "/stories/elizabeth-scarlet/",
    pdfHref: "/assets/stories/elizabeth-scarlet/the-dragon-glass-map-illustrated.pdf",
    cover: "/assets/stories/elizabeth-scarlet/elizabeth-and-scarlets-adventures-cover.png",
    status: "Current story",
    description: "Book one in The Adventures of Elizabeth and Scarlet: a 25-chapter magical mystery with princess detectives, Max the butler, Leilani, and Cinder the baby dragon."
  };
  shell("Maya's Work - Bamboo Holdings", "", `
    <section class="maya-hero">
      <div class="inner maya-hero-grid">
        <div class="maya-hero-copy">
          <p class="eyebrow">Maya's Work</p>
          <h1>A quiet shelf for Maya's story worlds.</h1>
          <p class="lede">Illustrated adventures, printable editions, and live narration-ready story experiences collected in one place.</p>
          <div class="actions">
            <a class="button" href="${pageUrl(story.href)}">Read the story</a>
            <a class="button secondary" href="${assetUrl(story.pdfHref)}" download>Download PDF</a>
          </div>
        </div>
        <a class="maya-cover-link" href="${pageUrl(story.href)}" aria-label="Open ${esc(story.title)}">
          <img src="${assetUrl(story.cover)}" alt="${esc(story.title)} cover">
        </a>
      </div>
    </section>
    <section class="maya-book-section">
      <div class="inner maya-book-layout">
        <article class="maya-featured-story">
          <a class="maya-book-cover" href="${pageUrl(story.href)}" aria-label="Open ${esc(story.title)}">
            <img src="${assetUrl(story.cover)}" alt="">
          </a>
          <div class="maya-book-copy">
            <p class="eyebrow">${esc(story.status)}</p>
            <h2>${esc(story.title)}</h2>
            <p class="lede">${esc(story.description)}</p>
            <dl class="maya-book-facts">
              <div><dt>Series</dt><dd>${esc(story.series)}</dd></div>
              <div><dt>Edition</dt><dd>${esc(story.edition)}</dd></div>
              <div><dt>Length</dt><dd>25 chapters</dd></div>
              <div><dt>Formats</dt><dd>Web story, live reader, and illustrated PDF</dd></div>
            </dl>
            <div class="actions">
              <a class="button" href="${pageUrl(story.href)}">Open story</a>
              <a class="button secondary" href="${assetUrl(story.pdfHref)}" download>Download PDF</a>
            </div>
          </div>
        </article>
        <aside class="maya-next-panel">
          <p class="eyebrow">Narration</p>
          <h2>Read to Me is wired in.</h2>
          <p>The story page has a chapter player ready for live ElevenLabs narration through a secure API endpoint.</p>
          <div class="maya-next-list">
            <span>Secure API key</span>
            <span>Chapter streaming</span>
            <span>Warm storyteller voice</span>
          </div>
        </aside>
      </div>
    </section>`);
}

function currentRoutePath() {
  let path = window.location.pathname;
  if (isFilePreview) {
    const rootPath = siteRootUrl.pathname;
    if (path.startsWith(rootPath)) path = path.slice(rootPath.length);
    path = path.replace(/^\/+/, "");
    if (!path || path === "index.html") return "/";
    path = path.replace(/index\.html$/, "");
    return `/${path.replace(/^\/+/, "")}`.replace(/\/?$/, "/");
  }
  return path.endsWith("/") ? path : `${path}/`;
}

function route() {
  const path = currentRoutePath();
  if (path === "/") return home();
  if (path === "/maya/") return mayaWorkPage();
  if (path === "/apps/" || path === "/about/" || path === "/contact/") return home();
  const app = apps.find(item => path === item.slug || path === `${item.slug}support/` || path === `${item.slug}privacy/`);
  if (!app) return shell("Page Not Found - Bamboo Holdings", "", `<section class="inner hero narrow"><h1>Page not found.</h1><p class="lede">Return to <a href="${pageUrl("/")}">Bamboo Holdings</a>.</p></section>`);
  if (path.endsWith("/support/")) return supportPage(app);
  if (path.endsWith("/privacy/")) return privacyPage(app);
  return appPage(app);
}

route();
