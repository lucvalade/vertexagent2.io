# AI Open House Connect — PRD, System Instructions, and System Prompt

## Product Requirements Document

### Product Name
AI Open House Connect

### Product Summary
AI Open House Connect is a premium real estate platform for agents, teams, brokerages, lenders, and buyers that combines AI-guided property tours, open house sign-in, QR-based entry, flyer-driven marketing, lead capture, and consent-based lender routing into one connected workflow. The in-app AI assistant is Sora, and the product is built using Google AI Studio with Firebase Authentication, Firestore, and Cloud Functions as the core application stack.

### Product Problem
Current open house tools are strong at digital sign-in and basic property marketing, but they are weaker at delivering a richer guided buyer experience across multilingual interaction, voice-first tours, AI-generated content, and connected pre- and post-visit workflows. Curb Hero is especially strong in operational sign-in maturity, offline support, QR usage, CRM syncing, and agent adoption. AI Open House Connect must match and exceed core event reliability while introducing a more intelligent end-to-end buyer journey.

### Product Goal / Mission
Turn static listings and open house events into intelligent, guided, AI-powered buyer experiences that generate higher-quality leads and support smarter follow-up for agents, teams, brokerages, and lenders.

To become the premier AI-enhanced open house platform by combining:
- Frictionless event setup with a setup wizard,
- Offline-capable sign-in with proactive status reporting and automated delayed synchronization,
- AI Tour guided property experience with multilingual Sora guidance,
- Flyers and QR-based dynamic routing entry points,
- Strict, consent-based paired lender routing with absolute borrower opt-in,
- And advanced team or brokerage override policies.

---

### Core Roles & Permissions
1. **Agent**: Manages listings, custom tours, events, flyers, personal integrations (e.g., Follow Up Boss with field mapping), and leads. Can pair with a preferred lender via a "My Paired Lender" flow.
2. **Team Admin**: Manages team-level visibility, settings, and team-routing configurations. Can enforce or relax lender overrides for team listings.
3. **Brokerage Admin**: Manages office-wide policies, listing rules, broker logs, default lenders, and overrides.
4. **Lender**: Active B2B participant with an active marketing subscription. Sees only consented leads routed after explicit opt-in.
5. **Lender Staff**: Support staff for paired lenders receiving shared files, notifications, and client routing queues.
6. **Compliance Admin**: Oversees routing audits, province or state licensing compliance checks, and privacy consent logs.
7. **Platform Admin**: Manages billing, global defaults, system health, and overall platform administration.
8. **Guest Lead (Attendee)**: Submits info via the mobile kiosk or QR flow, participates in the AI Tour, and chooses to opt-in/opt-out of mortgage assistance.

---

### Key Modules & Technical Specifications

#### 1. Mobile Sign-In & Kiosk UX
- **Before-Event Setup Wizard**: A quick step-by-step process for agents prior to launching the kiosk (confirm listing, verify paired lender, ensure custom questions are enabled/disabled, specify branding).
- **Attendee-Facing Lock Mode**: Pre-rendered kiosk flow locked for consumer use. Prevents accidental app exploration.
- **Exit PIN Verification**: Requires a secure agent-configured PIN to unlock the kiosk and return to the backend.
- **Thank-You Auto-Reset Loop**: Resets the screens to the welcome state exactly 5 seconds after a successful submission so the next visitor can sign in smoothly.
- **Offline Event Buffer UI**: Real-time status reporting showing when the tablet is offline ("Local Cache Sync Pending: N leads"). Automatically queues submissions in `localStorage`/`IndexedDB` and plays back sync routines to Firestore once browser connection events fire or reconnect occurs.

#### 2. Advanced Lender Pairing & Mortgage Logic
- **"My Paired Lender" Settings Page**: Agents invite or accept pairing requests from active subscribed lenders. 
- **The Consent Gate**: A mandatory mortgage interest checkbox ("Would you like information on financing options?").
- **Dynamic Question Logic**: Disabling a paired lender, or selecting "No paired lender", immediately removes the mortgage questions and lender co-branding from the consumer-facing sign-in kiosk.
- **Resolution Precedence (Scope Stack)**:
  1. Listing-level specific override
  2. Team or Office override policy
  3. Agent's Preferred paired lender
  4. Market Default lender
  5. Fallback: No lender (hides mortgage opt-in)

#### 3. CRM Integration & Follow Up Boss Mapping
- **Asymmetric External Sync**: The database record stores the canonical lead locally first. Lead creation and status logging succeed internally even if the downstream CRM API returns an error.
- **Failed Sync Logging**: An accessible overview of pending or failed external syncs with single-click manual retry buttons.
- **Direct Follow Up Boss Sync**:
  - Full API key authentication in the Integrations panel.
  - Interactive field mapping interface: map contact details (First Name, Last Name, Email, Phone, Agent Tags, Custom Questions) directly to corresponding Follow Up Boss fields.
  - Automatically translates "Mortgage Opt-In: Yes" into a dedicated label or system tag (e.g., `fub-mortgage-interest`).

#### 4. Audit Trail & Compliance logs
- Complete system audit logs tracking:
  - Exact time consumer clicked opt-in or gave consent.
  - Routing decisions, downstream notifications sent, and CRM sync results.
  - Admin policy overrides or pairing alterations.

#### 5. Data Enrichment & Compliance
- **Data Enrichment & Verification**: The system must validate submitted emails and phone numbers against third-party identity APIs (e.g., Clearbit, FullContact, or Twilio) to assign a "Verified" confidence badge to leads. The API sync should also extract and append public background data—such as occupation, education, and social media links—to the lead's profile to assist agent follow-up.
- **Digital Compliance**: The sign-in flow must support mandatory, customizable liability waivers and legal disclaimers that attendees must accept before submitting their information.
- **Leads Firestore schema additions**:
  ```json
  {
    "isVerified": true,
    "confidenceScore": "high",
    "occupation": "Software Engineer",
    "employer": "Tech Corp",
    "education": "University of Toronto",
    "socialProfiles": {
      "linkedin": "https://linkedin.com/in/...",
      "facebook": "https://facebook.com/..."
    },
    "waiverAccepted": true,
    "waiverVersion": "v2.1"
  }
  ```

#### 6. Shared Listings / Cross-Hosting Open House Flow
- **Entry Point & Assignor Management**: Accessible directly from the Listing page card grid or detail context sidebar ellipsis menu helper tab.
- **Interactive Configuration Parameters**: 
  - Select hosting agent (pull from the registered team roster or authorize any guest practitioner email address).
  - Define lead ownership/visibility policies across target devices.
  - Apply lender routing rule overrides (listing lender, host lender, team setting, or absolute suppression / hide question flow).
  - Control granular permission bits (can launch kiosk, customize inputs, inject branding, post comments/notes, or handle contacts follow-up).
  - Schedule access rules (a singular specific calendar dates range, a custom frame period, or infinite reusable/unlocked kiosk execution).
- **Automation Handshake Notifications**: Creates specialized records in Firestore system logs, saves assignments directly in `shared_listing_assignments`, and dispatches emails via `sendEmail` with explicit list details, permissions limits, and tracking attributes.

---

### Pricing Models

#### Agent and Organization Pricing Tiers
- **Agent Starter**: Free
- **Agent Pro**: $29/month
- **Agent Elite**: $59/month
- **Team Pro**: Starting at $149/month
- **Brokerage**: Starting at $399/month

#### Lender Pricing Tiers (Subscribed Active B2B Seats)
- **1 Paired Agent Plan**: $20/month
- **3 Paired Agents Plan**: $45/month
- **10 Paired Agents Plan**: $80/month
- **20 Paired Agents Plan**: $100/month

---

## System Instructions

### Identity and Naming
- The app name is **AI Open House Connect**.
- The in-app AI assistant is **Sora** (never replace with other assistant names).

### Core Navigation Elements
Ensure a highly professional, cohesive navigation layout that integrates the core workflows:
1. **Dashboard**: General activity feed, latest event analytics, and system audit logs.
2. **Listings**: Real estate listings management with specific lender override configurations.
3. **AI Tours**: Audio/visual walkthrough builders guided by the Sora assistant.
4. **Open Houses**: Event creation, setup wizard, dynamic QR code management, and tablet kiosk loop.
5. **Leads**: Internal client record profiles, consent metadata logs, and Sora automated email draft follow-ups.
6. **Lenders**: Lender pairing workflows, B2B payment statuses, and routing allocations.
7. **Integrations**: Direct api connectivity with custom mapping (e.g., Follow Up Boss integration with field selectors).
8. **Team / Company**: Organization tiers, team configs, and admin routing override policies.
9. **Settings**: Profile fields, agent logos/photos, security PIN setup, and account levels.

### Design Direction & Aesthetics
- **Desktop/Tablet Refinement**: Modern real estate typography with elegant layout patterns (Inter user interface, bold title Arial displays, deep slate/blue accent highlights `#155dfc`).
- **Minimalist Aesthetic**: Rely on functional spacing, responsive canvas designs, clean card frames, and zero clutter or tech-jargon labels. 
- **Visual Slat Animations**: Apply premium visual feedback mechanisms, such as the staggered vertical frame blinds loop for essential "Open House" highlights.

### Technical Implementation Standards
- Utilize standard hook states (`useAuth`) and direct sub-components.
- Keep components modular. Divide large states into isolated files (e.g., separate layouts, forms, and custom animation canvases).
- Guard all external APIs using lazy initialization and error handlers; fallback safely to localized state stores key-value pairs during lost connection incidents.
- Maintain accurate Firestore routing collection patterns: `users`, `agents`, `lenders`, `teams`, `offices`, `listings`, `openHouseEvents`, `aiTours`, `leads`, `pairings`, `crmConnections`, `auditLogs`.

### 12. SHARED LISTINGS / CROSS-HOSTING
The platform must support shared listings for cross-hosted open houses.

#### ENTRY POINT
- Shared Listing is available from the ellipsis menu on each listing inside Your Listings.

#### RULES
- A shared listing assignment does not transfer listing ownership.
- Listing ownership remains with `listingOwnerAgentId`.
- Open-house execution may be delegated to `hostingAgentId`.
- A host may only launch open houses for listings explicitly shared with them or assigned by a team/brokerage admin.
- Shared listing access may be one-time, date-bounded, or reusable.

#### DATA MODEL
Store:
- `sharedListingAssignmentId`
- `listingId`
- `listingOwnerAgentId`
- `hostingAgentId`
- `assignedByUserId`
- `sharingScope` (single_event | date_range | reusable)
- `leadOwnershipRule`
- `leadVisibilityRule`
- `lenderRule`
- `status`
- `createdAt`
- `updatedAt`

#### OPEN HOUSE LOGIC
When a host creates an event from a shared listing:
- Create an `openHouse` record with both `listingOwnerAgentId` and `hostingAgentId`
- Inherit listing details from the source listing
- Apply lender rule based on the shared listing configuration
- Apply permissions limits from the assignment

#### LEAD LOGIC
All leads captured at the event must store:
- `listingId`
- `openHouseId`
- `listingOwnerAgentId`
- `hostingAgentId`
- `capturedByAgentId`
- `leadOwnershipRule`
- `routedToLenderId` if applicable

#### NOTIFICATIONS
- Notify listing owner when a host accepts assignment.
- Notify host when listing is shared.
- Notify team admin for assignment changes if team policy is enabled.

#### UI LABELS
- In attendee mode, display hosting agent as the event host.
- If required, also display listing attribution in smaller text.
- Never show admin controls in attendee mode.

#### AUDIT
The system must log:
- Who created the shared assignment,
- When the host launched the event,
- Which lender rule was applied,
- Who received the lead,
- Any override applied by team or brokerage.

---

## System Rules & Acceptance Criteria (Testing Mandates)
1. **Paired Lender Replacement Validation**: Agents can replace a paired lender fromsettings. Changing the status immediately reflects across assigned events.
2. **Inheritance & Override Validation**: Listing-level overrides override agent settings. Team block-policies enforce rules globally when set to "Enforce".
3. **Explicit Consent Log Verification**: No lender sees lead information unless `mortgageConsent` is recorded as `true` with the visitor's record.
4. **Res resilient offline workflow validation**: The user can fill out the sign-in input fields completely, press submit, see the "Saved Locally" verification note, and observe the loop return to the entry panel while offline. The application must perform automatic replication to the server when connection state changes.
5. **Direct Integration Reliability**: CRM failed sync states must never crash the browser or prevent user state changes. Stored queues must track retry count parameters and errors cleanly.
