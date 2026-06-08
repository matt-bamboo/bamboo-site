const CONTACT_EMAIL = "info@bamboo.holdings";
const TODAY = "June 8, 2026";

const apps = [
  {
    id: "runway",
    name: "Runway",
    slug: "/apps/runway/",
    status: "In Development",
    tagline: "A calmer way to spend in retirement.",
    hero: "Know how long your money may last.",
    intro: "Runway helps retirees understand how long their savings may last, what to spend each month, and which account to draw from first.",
    long: "Runway is a private, voice-friendly retirement planning companion for people managing their own money. It turns Social Security, pensions, expenses, and savings accounts into a clear monthly drawdown picture. Clara, the app's AI guide, answers questions in plain English and helps explain the plan. Runway does not connect to banks, move money, or replace a licensed financial advisor.",
    users: ["Retirees and near-retirees managing their own finances", "Older adults who want plain-English guidance without spreadsheet complexity", "People planning monthly retirement withdrawals", "Users who want a voice-friendly, senior-oriented interface", "Retirees comparing income, expenses, account balances, and longevity estimates"],
    features: [["Your Runway Year", "See an estimate of how long your savings may last based on the numbers you enter."], ["Monthly Drawdown Plan", "Understand which account to spend from first and why it may matter."], ["Clara, Your Retirement Guide", "Ask questions in plain English and get explanations based on your entered numbers."], ["Voice-Friendly by Design", "Large text, high contrast, tap-to-talk, and narration support make the app easier to use."], ["No Bank Login", "Runway does not connect to your bank or brokerage. You stay in control of what you enter."], ["All Your Income in One View", "Combine Social Security, pensions, recurring expenses, and savings into one clearer retirement picture."]],
    works: ["Enter income, expenses, and account balances.", "Review your estimated Runway year.", "See a monthly drawdown plan.", "Ask Clara questions in plain English.", "Update your numbers as life changes."],
    availability: "In development for iPhone.",
    disclaimer: "Runway is an educational planning tool, not professional financial advice. Clara is an AI guide. Estimates may be incomplete or inaccurate. Always verify important decisions with official sources or a qualified professional.",
    support: {
      overview: "Runway is a private, local-first retirement planning app. Because there are no user accounts, support cannot access, reset, or recover your financial data remotely.",
      include: ["Device model", "iOS version", "Runway app version if visible in the app", "A brief description of the issue", "Whether you are using demo data or your own data"],
      caution: "Do not include actual account balances, Social Security amounts, or other sensitive financial details in support emails.",
      faq: [["Does Runway connect to my bank?", "No. Runway does not connect to banks, brokerages, or financial institutions. Users enter balances manually."], ["Where is my data stored?", "Runway stores financial information on the device. When you ask Clara a question, relevant financial context and your message may be sent to an AI service to generate a response."], ["Is Clara financial advice?", "No. Clara is an AI guide, not a licensed financial advisor. Runway provides estimates and educational guidance only."], ["How do I update my numbers?", "Open the area for your money or profile information and update income, balances, bills, or spending targets."], ["Does Runway work without internet?", "Core local planning features may work without internet. Clara's AI responses require a network connection."]],
      limitations: ["No bank linking or automatic balance updates", "No professional financial advice", "AI answers may be incomplete or wrong", "RMD and Social Security estimates are approximations", "No confirmed cross-device sync", "Voice features may vary by platform and build type"]
    },
    privacy: {
      stored: ["First name or profile details", "Age or date-of-birth information used for estimates", "Social Security and pension amounts", "Other income sources", "Account balances", "Monthly spending targets and actual spending", "Fixed bills or recurring expenses", "Medicare-related planning fields", "AI chat messages", "Clara memory notes or preferences", "App settings such as voice, text size, and color preferences"],
      local: "Runway is designed to store user-entered financial information locally on the device. It does not require a user account or bank login.",
      thirdParty: "When a user asks Clara a question, Runway may send the user's message and a summary of relevant financial context to a third-party AI provider to generate a response.",
      accounts: "Runway currently does not require user accounts, email login, Sign in with Apple, or bank authentication.",
      ai: "Clara's AI responses require third-party AI processing and should be treated as educational explanations, not professional advice.",
      children: "Runway is intended for adults and is not directed at children.",
      payments: "Payment, purchase, and subscription behavior has not been confirmed for the public site.",
      tracking: "No analytics, advertising, or behavioral tracking claims are made here unless confirmed against the current build.",
      deletion: "Users should be able to delete locally stored data through reset or start-over behavior where available. Exact shipped behavior should be confirmed before publishing detailed instructions."
    }
  },
  {
    id: "ignite",
    name: "Ignite",
    slug: "/apps/ignite/",
    status: "Early Access",
    tagline: "Know your number. Own your timeline.",
    hero: "Know your number. Own your timeline.",
    intro: "Ignite helps people pursuing financial independence track their runway, net worth, spending, and FIRE progress with account-aware planning tools and an AI coach.",
    long: "Ignite is a personal finance app built for people serious about financial independence. It helps users connect accounts, track net worth, review transactions, model FIRE scenarios, and understand what their current spending means for their retirement timeline.",
    users: ["Adults pursuing financial independence or early retirement", "FIRE-focused savers and investors", "People who want more than a monthly budget app", "Retirees or near-retirees who want drawdown visibility", "Users who want to understand runway, safe withdrawal rates, net worth, and spending drift"],
    features: [["Your runway, front and center", "See how long your money may last based on your actual spending and planning assumptions."], ["Built for your phase", "Ignite adapts its dashboard, vocabulary, and tools to where you are."], ["Real accounts, real numbers", "Connect accounts through Plaid, review transactions, and track your financial picture in one place."], ["An AI coach with context", "Ask questions about your finances and get plain-English explanations based on your account and planning data."], ["Tools for serious planners", "Explore FIRE projections, safe withdrawal rates, Roth conversions, Monte Carlo modeling, and more."], ["Your data, your control", "Export your data, delete your account, and use Demo Mode before connecting accounts."]],
    works: ["Sign in with Apple or Google.", "Choose your phase: building toward independence or living off your portfolio.", "Connect accounts through Plaid or start with Demo Mode.", "See your runway, FIRE number, spending, and net worth.", "Review transactions and update your assumptions.", "Ask the AI coach questions and refine your plan."],
    availability: "Currently in TestFlight / Early Access.",
    disclaimer: "Ignite provides personal finance tracking, projections, and educational tools for informational purposes only. Ignite is not a licensed financial advisor, investment advisor, tax advisor, legal advisor, or insurance broker. Projections and calculators are estimates. Actual results will vary.",
    support: {
      overview: "Ignite is a personal finance app for tracking financial independence, runway, net worth, transactions, and planning scenarios.",
      include: ["Device model", "iOS or Android version", "Ignite app version if visible in Settings", "Whether you are using Demo Mode or connected accounts", "A short description of the issue"],
      faq: [["Do I need to connect a bank account?", "No. Demo Mode lets users explore Ignite with fictional financial data before connecting real accounts."], ["How does account connection work?", "Ignite uses Plaid to connect supported financial institutions. Users authenticate through Plaid's flow. Ignite does not receive the user's bank sign-in details."], ["What is runway?", "Runway is an estimate of how long money may last based on current balances, spending, and assumptions."], ["Does Ignite give financial advice?", "No. Ignite provides calculators, projections, and AI-assisted educational information. It does not provide licensed financial, tax, investment, insurance, or legal advice."], ["Does the AI coach use my financial data?", "Yes. Ignite may send financial summaries, spending context, account information, or planning metrics to an AI service to generate a response."]],
      limitations: ["Financial projections are estimates, not guarantees", "AI responses are informational, not professional advice", "Bank sync depends on supported financial institutions and Plaid availability", "Voice features may vary by device and build", "Demo Mode uses fictional data", "Availability on app stores must be confirmed before publishing"]
    },
    privacy: {
      stored: ["Name and email address from sign-in provider", "Birthdate or age-related planning inputs", "State or region for certain planning estimates", "Annual income, annual expenses, savings targets, FIRE assumptions, and planning preferences", "Bank account balances, account types, transaction history, merchants, dates, categories, and amounts via Plaid", "Manual assets such as real estate, vehicles, collectibles, or crypto holdings", "Bills, goals, investment trades, and other user-entered records", "AI chat messages and voice interaction transcripts", "Subscription status and purchase-related records through app-store billing infrastructure", "App preferences and dashboard settings"],
      local: "Ignite is a server-backed app. User data may be stored in a backend database so users can access their account across devices.",
      thirdParty: "Ignite may use third-party services for authentication, bank connectivity, AI coaching, subscription management, app-store billing, price lookup, and partner or referral systems if enabled.",
      accounts: "Users sign in with Apple or Google through an authentication provider. Demo Mode may allow exploration with fictional data if that behavior is confirmed in the current build.",
      ai: "When users ask the AI coach a question or use AI-powered features, Ignite may send relevant financial context and user messages to an AI provider to generate responses.",
      children: "Ignite is intended for adults and is not directed to children.",
      payments: "Payments or subscriptions, if enabled, are handled through Apple App Store and Google Play billing. Ignite does not directly collect payment card numbers.",
      tracking: "No third-party analytics, advertising, or behavioral tracking claims are made here unless confirmed against the current build.",
      deletion: "Users should be able to delete their account/data and export their data from the app. Final language should match the shipped UI and third-party deletion limitations."
    }
  },
  {
    id: "chalk",
    name: "Chalk",
    slug: "/apps/chalk/",
    status: "Preview",
    tagline: "The gymnastics coaching companion",
    hero: "Every session. Every skill. Every athlete.",
    intro: "Chalk helps gymnastics coaches log sessions, rate skills, and send personalized drill plans to athletes and parents.",
    long: "Chalk brings the daily coaching workflow into one place. Coaches can log individual or class sessions, rate athlete skills on a simple 1-4 scale, and review personalized homework plans generated from those session ratings.",
    users: ["Gymnastics coaches", "Youth gymnasts and athletes", "Parents who want safe visibility into homework and progress", "Gym owners, program directors, and facility admins"],
    features: [["Rate, plan, send", "Log a session, rate skills, and turn practice notes into a focused homework plan."], ["Built for class flow", "Move through activity areas, collect ratings for the whole class, and review everything before closing the session."], ["Homework that fits", "Plans are generated from the day's ratings, with flexibility built in and a focused cap."], ["Four views, one workflow", "Coaches, athletes, parents, and admins each see the information they need."], ["Track the journey", "Skill trees, milestones, session history, and progress comparisons help make improvement visible."], ["Private by design", "No accounts, no ads, and no server sync in the current preview. Data is stored on the device."]],
    works: ["Choose a role: Coach, Athlete, Parent, or Admin.", "Log an individual athlete session or start a class session.", "Rate skills and add notes.", "Review the homework draft.", "Send homework to the athlete and parent views.", "Track progress over time."],
    availability: "Currently in private preview for iOS.",
    disclaimer: "Chalk is a preview product for youth sports workflows. Public privacy and compliance details should receive owner and legal review before launch.",
    support: {
      overview: "Chalk is a gymnastics coaching companion for session logging, skill tracking, and homework follow-through. The current preview uses local on-device data and does not include accounts or cloud sync.",
      include: ["Your iPhone model", "Your iOS version", "Chalk app version if visible", "Whether you are using demo data or custom data", "A short description of the issue"],
      faq: [["How do I log a training session?", "Open the Coach view, choose an athlete or class, rate the relevant skills, add notes if needed, and save the session."], ["What do the 1-4 ratings mean?", "1 means Needs Work, 2 means Developing, 3 means Almost There, and 4 means Nailed It."], ["How does homework get created?", "After a session, Chalk creates a homework draft from the ratings. Coaches can review and adjust the plan before sending it."], ["Does Chalk require a login?", "No. The current preview has no account system. It opens to a role picker."], ["Will data sync to another device?", "No. Current data is stored on the device only and does not sync across devices."]],
      limitations: ["iOS only in the current preview", "No account system", "No cloud backup or multi-device sync", "No Android build currently", "No push notifications currently", "No AI processing or machine learning in the homework engine", "Data can be lost if the app is deleted or the device is replaced without backup"]
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
    id: "sparks",
    name: "Sparks: Create with AI",
    slug: "/apps/sparks/",
    status: "Coming Soon",
    tagline: "Turn screen time into creation time.",
    hero: "Build something amazing today.",
    intro: "Sparks is an AI-powered creative studio where kids build games, art, stories, and interactive projects with help from Sparky, a friendly AI companion.",
    long: "Sparks helps children turn ideas into playable creations. Kids can choose a template, accept a creative challenge, or start from an idea of their own, then collaborate with Sparky through text or voice. Parents get local controls and visibility into activity, creations, and conversation history.",
    users: ["Children ages 6-12", "Parents and guardians who want more creative screen time", "Families looking for private, ad-free creative play", "Kids who want to make games, art, quizzes, stories, and playful projects without learning formal coding first"],
    features: [["Create with AI", "Kids describe what they want to make and Sparky helps bring it to life."], ["Start with a spark", "Choose from creative templates or take on a Daily Spark challenge."], ["Talk or type", "Kids can express ideas in their own words, using text or voice where available."], ["Play what you make", "Switch from building to playing so each creation feels real."], ["Private family sharing", "Share creations on a family-only wall, not a public social network."], ["Parents stay involved", "Parents can manage profiles, review activity, set limits, and adjust controls."]],
    works: ["Set up a child profile and parent controls.", "Pick a template or Daily Spark challenge.", "Tell Sparky what to build.", "Watch the project take shape.", "Play the finished creation.", "Share with family when appropriate."],
    availability: "Coming soon.",
    disclaimer: "Sparks is intended for parent-supervised use by children. Child privacy and AI-provider data handling require careful review before public launch.",
    support: {
      overview: "Sparks is a creative AI app for kids. It is designed for parent-supervised use, with local profiles, parent controls, and creative projects stored on the device in the current implementation.",
      include: ["Device model", "iOS, iPadOS, or Android version", "Sparks app version if visible in Settings", "A short description of the issue", "Screenshots if helpful"],
      faq: [["Does Sparks need the internet?", "AI features such as Sparky chat, voice input, and voice responses require an internet connection. Some app screens may open without internet, but creation features may be limited."], ["Who can see my child's creations?", "Sparks is designed around private family use. There is no public social feed in the current implementation."], ["Does Sparks sync across devices?", "No. Current data is stored locally on the device."], ["What happens if I forget the parent PIN?", "The parent PIN is stored locally. If there is no recovery flow, reinstalling the app may be required and may erase local data."], ["Can parents review conversations?", "The Parent Dashboard is intended to provide visibility into activity and conversation history."]],
      limitations: ["No cross-device sync currently", "Parent PIN recovery may be limited", "AI features require internet access", "Child privacy and AI-provider data handling require careful review before public launch", "Public availability status must be confirmed before publishing"]
    },
    privacy: {
      stored: ["Child display name or profile name", "Child age group or profile settings", "Parent setup information", "Parent PIN stored locally", "Creative projects", "Pixel art or generated project content", "Conversation history with Sparky", "Voice input used for transcription", "Usage minutes and app activity", "Achievements, streaks, and milestones", "Family Wall posts"],
      local: "Profiles, projects, conversation history, activity records, and settings are stored locally on the device in the current implementation.",
      thirdParty: "AI features may send conversation text, voice audio, or text-to-speech content to third-party providers for processing. Provider details and data-retention terms should be confirmed before launch.",
      accounts: "Sparks currently does not use a server account system for children. Parent setup is local in the current implementation.",
      ai: "AI-powered chat, voice, and text-to-speech features may transmit content to external providers for processing.",
      children: "Sparks is intended for children and requires careful privacy review before public launch. The site does not claim COPPA compliance without legal review.",
      payments: "The public release model has not been confirmed. This page does not claim free, paid, subscription, or in-app purchase behavior.",
      tracking: "Final analytics, tracking, or advertising behavior has not been claimed and should be confirmed against the current build.",
      deletion: "Parents can manage child data from the Parent Dashboard in the current implementation. Exact deletion and full-reset behavior should be confirmed before publishing final instructions."
    }
  },
  {
    id: "univoice",
    name: "UniVoice",
    slug: "/apps/univoice/",
    status: "TestFlight",
    tagline: "Sing. Score. Grow.",
    hero: "Every kid's a star.",
    intro: "UniVoice is a kids' karaoke and singing coach app with real-time pitch feedback, song practice, warmups, and playful rewards.",
    long: "UniVoice turns singing practice into a game for kids. Children can choose from familiar public-domain songs, follow scrolling lyrics, see real-time pitch feedback, earn stars, and build confidence with warmups and ear-training games.",
    users: ["Kids ages 4-12 who like singing or karaoke", "Parents looking for skill-building screen time", "Families who want kid-friendly songs and feedback", "Young singers practicing pitch matching, warmups, and confidence", "Music teachers or caregivers looking for a simple vocal practice tool"],
    features: [["Sing with feedback", "A color-coded pitch bar helps kids hear and see how close they are to each note."], ["Built for young singers", "Simple screens, encouraging feedback, and optional Little Singer Mode make practice approachable."], ["Warm up first", "Guided vocal exercises and ear-training games help kids build real skills."], ["Earn stars and badges", "Practice feels rewarding with stars, achievements, and progress history."], ["Choose a coach", "Friendly coach personas offer encouragement and feedback."], ["Parent-friendly controls", "Parents can manage profiles, recordings, and settings from the Parent Zone."]],
    works: ["Create a singer profile.", "Choose a coach and song.", "Warm up if desired.", "Sing along with scrolling lyrics.", "Watch the pitch feedback.", "Earn stars and review progress."],
    availability: "Available in TestFlight early access. Request access at info@bamboo.holdings.",
    disclaimer: "UniVoice is child-directed and involves voice/audio features. Public privacy details should receive owner and legal review before launch.",
    support: {
      overview: "UniVoice is a singing and karaoke practice app for kids. It uses microphone input to provide pitch feedback, stores progress on the device, and gives parents tools to manage profiles and recordings.",
      include: ["Device model", "iOS, iPadOS, or Android version", "UniVoice app version if visible in Settings", "A short description of the issue", "Screenshot or screen recording if helpful"],
      faq: [["Why does UniVoice need microphone access?", "UniVoice listens while a child sings so it can show pitch feedback and score the performance. Pitch analysis runs on the device in the current implementation."], ["Does UniVoice record my child's voice?", "Voice recordings should only be saved when the user chooses to save them. Confirm exact shipped behavior before publishing final language."], ["Does progress sync across devices?", "No. Current progress is stored locally on the device."], ["How do I access the Parent Zone?", "Use the Parent Zone entry point and complete the parent gate."], ["What happens if the AI coach voice does not work?", "Some coach voice features may require internet access. The app may fall back to device speech when the server or voice service is unavailable."]],
      limitations: ["No cross-device sync currently", "Progress is stored locally on the device", "Public billing/subscription behavior must be confirmed before publishing", "Android public availability must be confirmed before claiming", "AI coach voice features may require internet access"]
    },
    privacy: {
      stored: ["Child first name or profile name", "Child age or age range", "Avatar, theme, or coach preferences", "Song performance history", "Stars, scores, and timestamps", "Vocal range calibration values", "Favorite songs", "Optional saved voice recordings", "Volume and app settings", "Subscription or trial state if billing is enabled"],
      local: "Profiles, progress, preferences, favorites, and recordings are stored locally on the device in the current implementation.",
      thirdParty: "Some coach voice features may send short coach-summary text to a third-party voice generation provider to create audio. Final provider and retention claims should be confirmed before publication.",
      accounts: "UniVoice currently does not require account creation or sign-in.",
      ai: "Pitch detection and scoring run locally in the current implementation. Some coach voice features may use third-party voice generation.",
      children: "UniVoice is intended for children and requires careful privacy review before public launch. The site does not claim COPPA compliance without legal review.",
      payments: "Live subscription or purchase behavior has not been confirmed. If payments are enabled, processing should be handled through app-store billing.",
      tracking: "Final analytics, tracking, or advertising behavior has not been claimed and should be confirmed against the current build.",
      deletion: "Users can delete profiles and recordings in the current implementation. Full reset may require deleting and reinstalling the app."
    }
  },
  {
    id: "triptracker-pro",
    name: "TripTracker Pro",
    slug: "/apps/triptracker-pro/",
    status: "Coming Soon",
    tagline: "AI-powered resort receipt tracking",
    hero: "Every charge, every tip, every receipt - accounted for.",
    intro: "TripTracker Pro helps resort travelers scan receipts, track expenses, reconcile hotel bills, split costs, and keep a clean record of their trip.",
    long: "TripTracker Pro turns the financial chaos of a resort vacation into a clear, organized record. Travelers can photograph receipts, review AI-extracted line items, compare saved receipts against a hotel folio, track shared expenses, and keep notes about resorts and staff.",
    users: ["Frequent resort and timeshare travelers", "Travelers managing multi-person trips", "People who want to reconcile hotel folios before checkout", "Travelers who track cash tips, card charges, and shared expenses", "Resort guests who want notes and records to carry forward to future stays"],
    features: [["Scan receipts as you go", "Capture receipts during the trip and review extracted details before saving."], ["Reconcile your hotel bill", "Compare your final folio against saved receipts and spot charges that need review."], ["Split costs without a spreadsheet", "Track shared expenses and see a clean settlement summary at the end of the trip."], ["Remember staff and tips", "Keep a record of staff names, roles, and tip history across resort visits."], ["Keep resort notes", "Save details about a property so they are available next time you return."], ["Export your trip record", "Create a portable trip file for personal records or device migration."]],
    works: ["Create a trip with resort, dates, currencies, and optional budget.", "Scan receipts throughout the stay.", "Upload the hotel folio near checkout.", "Review matched and disputed charges.", "Settle shared expenses.", "Export a clean trip summary."],
    availability: "Coming soon.",
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
      payments: "The public release model has not been confirmed. This page does not claim paid, free, subscription, or purchase behavior.",
      tracking: "No analytics, advertising, or tracking claims are made unless confirmed against the current codebase before publication.",
      deletion: "Users can delete app records from within the app. Exact full-data-reset behavior should be confirmed before publishing detailed instructions."
    }
  },
  {
    id: "match-card",
    name: "Match Card",
    slug: "/apps/match-card/",
    status: "TestFlight",
    tagline: "Golf scorecard and round analytics",
    hero: "Your courses. Your rivalry. One scorecard.",
    intro: "Match Card is a two-player golf scorecard for iPhone that helps regular playing partners score rounds, track rivalry stats, settle friendly side games, and keep a course-by-course record.",
    long: "Match Card is built for golfers who play the same courses with the same regular partner and care about the rivalry as much as the score. It keeps live scoring simple, supports tap or voice score entry, tracks per-course performance, calculates a course-specific handicap, and keeps a season-long head-to-head trophy.",
    users: ["Recreational golfers who play regularly with the same partner", "Two-player golf rivalries", "Golfers who care about course-specific history and head-to-head records", "Players who want a cleaner alternative to bloated golf apps", "Golfers who want side-game math handled for them"],
    features: [["Live scoring, one-handed", "Fast hole-by-hole scoring with auto-saving drafts."], ["Score with your voice", "Tap the mic, say the scores, and keep the round moving."], ["Built for rivalries", "Track the season-long head-to-head between you and your regular playing partner."], ["Per-course handicap", "Keep course-specific performance history instead of one blended number."], ["Side games settled", "Handle Skins, Match Play, Nassau, Stableford, and more without spreadsheet math."], ["Share the round", "Generate clean post-round share cards for scores, stats, and highlights."]],
    works: ["Set your two player names.", "Choose or add a course.", "Score each hole by tap or voice.", "Save the round.", "Review side games and the season trophy.", "Share the result if you want."],
    availability: "Now in TestFlight for iPhone.",
    disclaimer: "Match Card can tally friendly side games, but it does not process payments, transfer money, or settle wagers.",
    support: {
      overview: "Match Card is a two-player golf scorecard for iPhone. It does not require an account and is designed to work offline for round scoring.",
      include: ["iPhone model", "iOS version", "Match Card app version if visible", "A short description of the issue", "What screen you were on"],
      faq: [["Do I need an account?", "No. Match Card does not require sign-in or account creation."], ["How does voice scoring work?", "Tap the microphone on the live scoring screen and say the scores. It is a tap-to-record feature, not always-listening."], ["Why does the app ask for location?", "Location may be used to capture a weather stamp for the round or bias course search. If location is denied, the app should still support scoring."], ["Is my data backed up?", "Only if the user enables optional backup. Backup is off by default."], ["Does Match Card handle money or betting payments?", "No. Match Card can tally friendly side games, but it does not process payments, transfer money, or settle wagers."]],
      limitations: ["iPhone only unless owner confirms otherwise", "TestFlight beta unless owner confirms public App Store release", "No live multi-device sync", "Optional backup is not an account system", "No always-listening voice mode"]
    },
    privacy: {
      stored: ["Round scores and scoring details", "Player names", "Course and venue records", "Hole notes and course history", "Bag and club data", "Side-game results", "App settings", "Attached local photo references", "Derived stats, records, and handicap calculations"],
      local: "Match Card is local-first and account-free. Most scoring, stats, handicap, course, and settings data lives on the user's device.",
      thirdParty: "Depending on which features the user chooses, Match Card may send limited data to service providers, including voice clips for transcription, scorecard images for parsing, course search queries, approximate location for course lookup, and approximate coordinates for weather information.",
      accounts: "Match Card currently does not require user accounts, login, email, Apple Sign In, or Google Sign In.",
      ai: "Voice, image, location, and course-search processing are feature-specific and should not be described as advertising or tracking.",
      children: "Match Card is not directed at children.",
      payments: "Match Card does not currently offer subscriptions, in-app purchases, ads, or payment processing unless owner confirms a change.",
      tracking: "No analytics, advertising, or tracking claims are made unless confirmed against the current codebase before publication.",
      deletion: "Users can erase local data in the app. Optional backup, if enabled, should be deleted separately through the backup feature."
    }
  },
  {
    id: "allotment-optimizer",
    name: "Allotment Optimizer",
    slug: "/apps/allotment-optimizer/",
    status: "Coming Soon",
    tagline: "Shop smarter. Stay within your limit.",
    hero: "Plan the perfect dispensary trip.",
    intro: "Allotment Optimizer helps Arizona cannabis consumers plan dispensary trips by comparing product combinations against allotment limits, budgets, deals, and estimated taxes.",
    long: "Allotment Optimizer is a private, on-device planning tool for adult Arizona cannabis consumers. Users can enter available allotment, add products and deals, choose an optimization goal, and compare valid purchase combinations before visiting a dispensary.",
    users: ["Adult Arizona cannabis consumers, 21 and older", "Medical cardholders tracking a rolling allotment window", "Recreational shoppers trying to compare product options", "Shoppers who want to compare deals, budgets, estimated taxes, and gram limits before a dispensary visit"],
    features: [["Smart optimizer", "Enter your available grams, budget, and product options. The optimizer ranks valid combinations so you can compare carts."], ["Deal-aware math", "BOGO offers, discounts, quantity limits, and product weights can all be factored into planning."], ["14-day lock tracker", "Medical users can track recent purchases and see when grams become available again."], ["Arizona-focused planning", "Built around Arizona cannabis shopping rules, estimated taxes, medical allotment tracking, and dispensary workflows."], ["Private by design", "No account required. Planning data is stored on the user's device."], ["Save repeat setups", "Use presets and product history to prepare for recurring shopping trips faster."]],
    works: ["Set your available gram allotment and optional budget.", "Add products manually or from saved products.", "Add applicable deals or constraints.", "Choose an optimization goal.", "Compare ranked cart scenarios.", "Log a purchase if you want to track allotment and spending history."],
    availability: "Coming soon.",
    disclaimer: "Allotment Optimizer is an informational planning tool only. It does not sell, deliver, or facilitate the purchase of cannabis. Nothing in the app is medical, legal, tax, or financial advice. It is intended for adults 21 and older in jurisdictions where cannabis is legal.",
    support: {
      overview: "Allotment Optimizer is a private planning tool for Arizona cannabis shoppers. It helps users compare product combinations, track allotment use, and review purchase history on their own device.",
      include: ["Device model", "iOS version", "App version if visible in Settings", "A short description of the issue", "Steps to reproduce the issue"],
      faq: [["Does the app connect to live dispensary inventory?", "No. Users enter products manually or capture details from menu pages. The app is a planning tool, not a live inventory system."], ["Why do some grams show as locked?", "For medical-use planning, recent purchases can count against a rolling allotment window. The tracker estimates when logged grams become available again."], ["Why does tax not exactly match my receipt?", "The app uses estimated rates and planning assumptions. Actual receipts may differ due to local taxes, discounts, rounding, store policies, or rule changes."], ["Can I use this outside Arizona?", "No. The current app is Arizona-specific."], ["Does the app sell cannabis?", "No. It does not sell, deliver, process orders, or facilitate cannabis purchases."]],
      limitations: ["Arizona only", "No live inventory or real-time pricing", "No account or cloud sync", "Tax estimates may not match receipts exactly", "Rules and rates may change", "Android availability should not be claimed unless confirmed"]
    },
    privacy: {
      stored: ["Product names, categories, prices, weights, and deal details", "Gram allotment and budget settings", "Purchase dates, dispensary names, itemized purchase lines, estimated taxes, and spending totals", "Saved presets and product library entries", "Dispensary favorites or browser links", "App preferences and theme settings"],
      local: "Planning data, product entries, presets, purchase history, and preferences are stored locally on the user's device.",
      thirdParty: "No third-party processing is claimed here unless confirmed. Current public-facing copy states that the app does not require an account or backend service for its planning features.",
      accounts: "No account is required.",
      ai: "No AI processing is claimed for the public planning features unless confirmed.",
      children: "The app is intended for adults 21 and older. It is not intended for children or users under the legal cannabis age.",
      payments: "Payment or subscription behavior has not been confirmed.",
      tracking: "No analytics, advertising, or tracking claims are made unless confirmed against the current codebase before publication.",
      deletion: "Users can reset or delete local app data through the app where supported, or by uninstalling the app. Exact reset behavior should be confirmed before publishing detailed instructions."
    }
  }
];

const nav = [
  ["Home", "/"],
  ["Ventures", "/ventures/"],
  ["Apps", "/apps/"],
  ["About", "/about/"],
  ["Contact", "/contact/"]
];

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
  return `<div class="app-icon" aria-hidden="true">${esc(app.name.split(" ").map(word => word[0]).join("").slice(0, 2))}</div>`;
}

function shell(title, active, content) {
  document.title = title;
  document.body.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="inner">
        <nav class="nav" aria-label="Primary">
          <a class="brand" href="/">
            <img src="/assets/brand/bamboo-logo.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'), {className: 'brand-mark', textContent: 'B'}))">
            <span>Bamboo Holdings</span>
          </a>
          <button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
          <div class="nav-links">${nav.map(([label, href]) => `<a href="${href}"${label === active ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</div>
        </nav>
      </div>
    </header>
    <main id="main">${content}</main>
    <footer class="site-footer">
      <div class="inner footer-grid">
        <span>&copy; ${new Date().getFullYear()} Bamboo Holdings. Builder-led venture studio.</span>
        <div class="footer-links">${nav.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div>
      </div>
    </footer>`;
  const button = document.querySelector(".menu-button");
  const links = document.querySelector(".nav-links");
  button.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
  });
}

function home() {
  const featured = apps.slice(0, 3);
  shell("Bamboo Holdings - Venture Studio", "Home", `
    <section class="inner hero">
      <div>
        <p class="eyebrow">Bamboo Holdings</p>
        <h1>Small studio. Practical products. Long-term thinking.</h1>
        <p class="lede">Bamboo Holdings is a founder-led venture studio building focused software products for specific, underserved workflows.</p>
        <div class="actions"><a class="button" href="/apps/">View apps</a><a class="button secondary" href="/ventures/">Explore ventures</a></div>
      </div>
      <div class="studio-visual" aria-label="Bamboo Holdings venture studio preview">
        <div class="visual-grid">
          <div class="visual-tile"><strong>Personal finance</strong><span>Retirement, runway, and planning tools.</span><i class="metric-line"></i></div>
          <div class="visual-tile"><strong>Family apps</strong><span>Creative, educational, and parent-aware products.</span><i class="metric-line"></i></div>
          <div class="visual-tile"><strong>Field workflows</strong><span>Travel, coaching, golf, and niche planning.</span><i class="metric-line"></i></div>
          <div class="visual-tile"><strong>Public pages</strong><span>Support, privacy, and clear product positioning.</span><i class="metric-line"></i></div>
        </div>
        <p class="copy">Built quietly, tested carefully, and described cautiously until each product is ready.</p>
      </div>
    </section>
    <section class="band section">
      <div class="inner split">
        <div><p class="eyebrow">Venture studio</p><h2>Products before theater.</h2></div>
        <div><p class="copy">Bamboo Holdings explores practical software opportunities, prototypes quickly, and brings the strongest ideas into clearer public form. The studio is intentionally small and builder-led, with an emphasis on useful products over broad claims.</p></div>
      </div>
    </section>
    <section class="inner section">
      <p class="eyebrow">Featured apps</p>
      <div class="grid">${featured.map(app => portfolioCard(app)).join("")}</div>
    </section>
    <section class="inner section tight">
      <p class="eyebrow">Current focus</p>
      ${cards([["Planning tools", "Apps that help people make sense of money, retirement, travel records, and niche rules."], ["Family and youth experiences", "Products designed with privacy caution, parent visibility, and age-appropriate constraints."], ["Specific workflows", "Focused tools for coaching, scoring, record keeping, and repeatable personal routines."]])}
    </section>
    <section class="band section">
      <div class="inner split">
        <div><p class="eyebrow">Founder-led</p><h2>Built by a practical product operator.</h2></div>
        <div><p class="copy">Bamboo Holdings is led by Matthew Grossman. The company keeps a small footprint and treats each product as a serious craft project: clear problem, careful wording, useful experience, and room to evolve.</p><div class="actions"><a class="button secondary" href="/about/">About Bamboo</a></div></div>
      </div>
    </section>
    <section class="inner section">
      <p class="eyebrow">Contact</p>
      <h2>Have a product, partnership, or support question?</h2>
      <p class="lede">Reach Bamboo Holdings directly at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
      <div class="actions"><a class="button" href="/contact/">Contact</a></div>
    </section>`);
}

function portfolioCard(app) {
  return `<article class="card portfolio-card">
    ${appIcon(app)}
    <span class="status">${esc(app.status)}</span>
    <h3>${esc(app.name)}</h3>
    <p>${esc(app.tagline)}</p>
    <p>${esc(app.intro)}</p>
    <div class="mini-links">
      <a href="${app.slug}">Overview</a>
      <a href="${app.slug}support/">Support</a>
      <a href="${app.slug}privacy/">Privacy</a>
    </div>
  </article>`;
}

function ventures() {
  shell("Ventures - Bamboo Holdings", "Ventures", `
    <section class="inner hero narrow">
      <p class="eyebrow">Ventures</p>
      <h1>A small venture studio for focused software products.</h1>
      <p class="lede">Bamboo Holdings develops practical products around specific workflows, learns from early users, and keeps public claims grounded in what each product is ready to support.</p>
      <div class="actions"><a class="button" href="/apps/">View app portfolio</a><a class="button secondary" href="/contact/">Start a conversation</a></div>
    </section>
    <section class="band section"><div class="inner split"><div><h2>The studio model</h2></div><div><p class="copy">Bamboo Holdings operates as a compact, founder-led venture studio. Some ideas become public app projects; others remain research, prototypes, or internal experiments until there is enough substance to discuss them responsibly.</p></div></div></section>
    <section class="inner section">
      <p class="eyebrow">Current venture category</p>
      ${cards([["App portfolio", "The current public portfolio is a set of mobile-focused apps spanning finance, family creativity, coaching, travel, golf, and specialized planning."], ["Future venture areas", "Bamboo may explore non-app ventures over time, but no specific future project is being named or announced here."], ["Founder-led scope", "The studio is intentionally small. The priority is careful product building, useful support pages, and honest availability language."]])}
    </section>`);
}

function appsPage() {
  shell("Apps - Bamboo Holdings", "Apps", `
    <section class="inner hero narrow">
      <p class="eyebrow">Apps</p>
      <h1>Focused products for specific jobs.</h1>
      <p class="lede">The Bamboo Holdings app portfolio is intentionally varied, but each product starts from the same question: what would make this workflow clearer, calmer, or easier to finish?</p>
    </section>
    <section class="inner section tight">
      <div class="grid">${apps.map(app => portfolioCard(app)).join("")}</div>
    </section>`);
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
          <div class="actions"><a class="button" href="${app.slug}support/">Support</a><a class="button secondary" href="${app.slug}privacy/">Privacy</a></div>
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
  shell(`${app.name} Support - Bamboo Holdings`, "Apps", `
    <section class="inner hero narrow">
      <p class="eyebrow">${esc(app.name)} support</p>
      <h1>Support for ${esc(app.name)}</h1>
      <p class="lede">${esc(app.support.overview)}</p>
      <p class="copy">For help, contact <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
      <div class="actions"><a class="button secondary" href="${app.slug}">Back to ${esc(app.name)}</a><a class="button secondary" href="${app.slug}privacy/">Privacy</a></div>
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
      <div class="actions"><a class="button secondary" href="${app.slug}">Back to ${esc(app.name)}</a><a class="button secondary" href="${app.slug}support/">Support</a></div>
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
      <p>Questions can be sent to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
    </section>`);
}

function about() {
  shell("About - Bamboo Holdings", "About", `
    <section class="inner hero">
      <div>
        <p class="eyebrow">About</p>
        <h1>Founder-led, practical, and product-first.</h1>
        <p class="lede">Bamboo Holdings is a small venture studio led by Matthew Grossman. The work is hands-on: identify a specific workflow, build a thoughtful product, and communicate clearly about what is ready.</p>
      </div>
      <div class="headshot-wrap">
        <img src="/assets/brand/matthew-grossman-headshot.jpg" alt="Matthew Grossman" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className: 'headshot-placeholder', textContent: 'Headshot placeholder'}))">
      </div>
    </section>
    <section class="band section"><div class="inner split"><div><h2>Built with a narrow scope and a long view.</h2></div><div><p class="copy">Bamboo Holdings does not present itself as a large firm or agency. It is a builder-led holding company for focused products, careful experiments, and ventures that earn their way into public view.</p></div></div></section>
    <section class="inner section tight">${cards([["Practical", "The studio favors products that solve concrete problems for specific people."], ["Cautious", "Availability, privacy, and compliance language stays grounded until each product is confirmed."], ["Long-term", "The portfolio is built with room for iteration, support, and future venture paths."]])}</section>`);
}

function contact() {
  shell("Contact - Bamboo Holdings", "Contact", `
    <section class="inner hero narrow">
      <p class="eyebrow">Contact</p>
      <h1>Get in touch.</h1>
      <p class="lede">For app support, product questions, venture conversations, or general inquiries, contact Bamboo Holdings by email.</p>
      <div class="actions"><a class="button" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div>
    </section>
    <section class="band section"><div class="inner"><p class="copy">There is no contact form, account portal, newsletter signup, analytics tracker, or ticketing backend on this site.</p></div></section>`);
}

function route() {
  const path = location.pathname.endsWith("/") ? location.pathname : `${location.pathname}/`;
  if (path === "/") return home();
  if (path === "/ventures/") return ventures();
  if (path === "/apps/") return appsPage();
  if (path === "/about/") return about();
  if (path === "/contact/") return contact();
  const app = apps.find(item => path === item.slug || path === `${item.slug}support/` || path === `${item.slug}privacy/`);
  if (!app) return shell("Page Not Found - Bamboo Holdings", "", `<section class="inner hero narrow"><h1>Page not found.</h1><p class="lede">Return to <a href="/">Bamboo Holdings</a>.</p></section>`);
  if (path.endsWith("/support/")) return supportPage(app);
  if (path.endsWith("/privacy/")) return privacyPage(app);
  return appPage(app);
}

route();
