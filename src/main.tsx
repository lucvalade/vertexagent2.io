import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from './App.tsx';
import {ThemeProvider} from 'next-themes';
import './index.css';

// Global Fetch Interceptor for Redirecting API Calls on Custom (External) Domains
try {
  const originalFetch = window.fetch;
  const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let url = "";
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.pathname + input.search;
    } else if (input && typeof input === "object" && "url" in input) {
      url = (input as Request).url;
    }

    // Intercept relative API routes and route to the primary Cloud Run deployment when running on Hostinger / other custom domains
    if (url.startsWith("/api/")) {
      const hostname = window.location.hostname;
      const isStandardEnv =
        hostname.includes("run.app") ||
        hostname.includes("localhost") ||
        hostname.includes("127.0.0.1") ||
        hostname.includes("webcontainer") ||
        hostname.includes("stackblitz") ||
        hostname.includes("gitpod") ||
        hostname.includes("github.dev");

      if (!isStandardEnv) {
        const backendUrl = "https://ais-pre-odlnfdziduv3enlxhjpgyj-108569774873.us-west1.run.app";
        const rewrittenUrl = `${backendUrl}${url}`;
        console.log(`[Global Fetch Interceptor] Redirecting custom host API call from ${hostname}: ${url} -> ${rewrittenUrl}`);
        
        if (typeof input === "string") {
          return originalFetch(rewrittenUrl, init);
        } else if (input instanceof URL) {
          return originalFetch(new URL(rewrittenUrl), init);
        } else {
          const clonedRequest = new Request(rewrittenUrl, input as Request);
          return originalFetch(clonedRequest, init);
        }
      }
    }
    return originalFetch(input, init);
  };

  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true
  });
} catch (error) {
  console.error("[Global Fetch Interceptor] Failed to define custom fetch:", error);
}

import { AuthProvider } from './hooks/useAuth.tsx';
import ProtectedLayout from './components/ProtectedLayout.tsx';
import PublicSite from './pages/PublicSite.tsx';
import PlaceholderPage from './pages/PlaceholderPage.tsx';
import Overview from './pages/Overview.tsx';
import Listings from './pages/Listings.tsx';
import ListingDetails from './pages/ListingDetails.tsx';
import EditListing from './pages/EditListing.tsx';
import Tour from './pages/Tour.tsx';
import ListingMicrosite from './pages/ListingMicrosite.tsx';
import Leads from './pages/Leads.tsx';
import LeadDetails from './pages/LeadDetails.tsx';
import Conversations from './pages/Conversations.tsx';
import ConversationDetails from './pages/ConversationDetails.tsx';
import Assets from './pages/Assets.tsx';
import VoiceLab from './pages/VoiceLab.tsx';
import Automations from './pages/Automations.tsx';
import Analytics from './pages/Analytics.tsx';
import Templates from './pages/Templates.tsx';
import EditTemplate from './pages/EditTemplate.tsx';
import Team from './pages/Team.tsx';
import EditMember from './pages/EditMember.tsx';
import Billing from './pages/Billing.tsx';
import Settings from './pages/Settings.tsx';
import WelcomeMessageDefaultsEmbed from './pages/WelcomeMessageDefaultsEmbed.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminUsers from './pages/admin/AdminUsers.tsx';
import AdminListings from './pages/admin/AdminListings.tsx';
import AdminWelcomeMessages from './pages/admin/AdminWelcomeMessages.tsx';
import AdminNotifications from './pages/admin/AdminNotifications.tsx';
import AdminLogs from './pages/admin/AdminLogs.tsx';
import AdminEmails from './pages/admin/AdminEmails.tsx';
import InviteAgent from './pages/admin/InviteAgent.tsx';
import BrokerageSettings from './pages/admin/BrokerageSettings.tsx';
import PilotAdmin from './pages/admin/PilotAdmin.tsx';
import Flyers from './pages/Flyers.tsx';
import Lenders from './pages/Lenders.tsx';
import AiTours from './pages/AiTours.tsx';
import OpenHousesAgent from './pages/OpenHousesAgent.tsx';

import Agent360 from './pages/admin/Agent360.tsx';
import EmailMarketing from './pages/EmailMarketing.tsx';
import Integrations from './pages/Integrations.tsx';
import SupportTickets from './pages/SupportTickets.tsx';
import ApiUsage from './pages/ApiUsage.tsx';
import Register from './pages/Register.tsx';
import Login from './pages/Login.tsx';
import Contact from './pages/Contact.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermsOfService from './pages/TermsOfService.tsx';
import Compliance from './pages/Compliance.tsx';

// Public pages
import ProductPage from './pages/ProductPage.tsx';
import OpenHousesPage from './pages/OpenHousesPage.tsx';
import UrlImportPage from './pages/UrlImportPage.tsx';
import BrokeragesPage from './pages/BrokeragesPage.tsx';
import PublicIntegrationsPage from './pages/PublicIntegrationsPage.tsx';
import PricingPage from './pages/PricingPage.tsx';
import DemoPage from './pages/DemoPage.tsx';
import HowItWorksPage from './pages/HowItWorksPage.tsx';
import GuidesPage from './pages/GuidesPage.tsx';
import HelpPage from './pages/HelpPage.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { db } from './lib/firebase.ts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Helper to check for suppressed errors (assertions, quota limits, offline states)
const isQuotaOrAssertionError = (msg: string) => {
  if (!msg) return false;
  return (
    msg.includes("INTERNAL ASSERTION FAILED") || 
    msg.includes("Unexpected state") || 
    msg.includes("b815") || 
    msg.includes("ca9") ||
    msg.includes("WatchChangeAggregator") ||
    msg.includes("TargetState") ||
    msg.includes("resource-exhausted") ||
    msg.includes("Quota limit exceeded") ||
    msg.includes("Quota exceeded") ||
    msg.includes("quota limits") ||
    msg.includes("quota")
  );
};

// Register global uncaught crash event listeners
window.addEventListener("error", (event) => {
  const msg = event.message || event.error?.message || String(event.error || "");
  if (isQuotaOrAssertionError(msg)) {
    console.warn("[Global Error Listener] Suppressed internal Firestore error:", msg);
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  try {
    addDoc(collection(db, "system_logs"), {
      type: "CRASH",
      message: `Global Uncaught: ${msg || "Unknown error"}`,
      timestamp: serverTimestamp(),
      createdAt: Date.now(),
      details: {
        message: msg,
        filename: event.filename || "",
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        stack: event.error?.stack || "",
        location: window.location.href,
        userAgent: navigator.userAgent
      },
      userEmail: "system_global_listener"
    }).catch(err => {
      console.warn("Failed to log uncaught error to Firestore:", err?.message || err);
    });
  } catch (err) {
    console.warn("Failed to log uncaught error to Firestore:", err);
  }
}, true);

window.addEventListener("unhandledrejection", (event) => {
  const reasonStr = event.reason?.message || String(event.reason || "");
  if (isQuotaOrAssertionError(reasonStr)) {
    console.warn("[Global Unhandled Rejection] Suppressed internal Firestore error:", reasonStr);
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  try {
    addDoc(collection(db, "system_logs"), {
      type: "CRASH",
      message: `Unhandled Rejection: ${reasonStr}`,
      timestamp: serverTimestamp(),
      createdAt: Date.now(),
      details: {
        reason: reasonStr,
        stack: event.reason?.stack || "",
        location: window.location.href,
        userAgent: navigator.userAgent
      },
      userEmail: "system_unhandled_rejection"
    }).catch(err => {
      console.warn("Failed to log unhandled rejection to Firestore:", err?.message || err);
    });
  } catch (err) {
    console.warn("Failed to log unhandled rejection to Firestore:", err);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<PublicSite />} />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfService />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="tour/:listingId" element={<Tour />} />
            <Route path="microsite/:listingId" element={<ListingMicrosite />} />
            <Route path="settings/embeds/welcome-message-defaults" element={<WelcomeMessageDefaultsEmbed />} />
            <Route path="pilot-admin" element={<PilotAdmin />} />
            <Route path="admin/emails" element={<AdminEmails />} />
            
            {/* New public subpages */}
            <Route path="product" element={<ProductPage />} />
            <Route path="open-houses/:listingId?" element={<OpenHousesPage />} />
            <Route path="url-import" element={<UrlImportPage />} />
            <Route path="brokerages" element={<BrokeragesPage />} />
            <Route path="integrations" element={<PublicIntegrationsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="guides" element={<GuidesPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="demo" element={<DemoPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="what-this-software-does" element={<HowItWorksPage />} />

            <Route path="app" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="listings" element={<Listings />} />
              <Route path="listings/:listingId" element={<ListingDetails />} />
              <Route path="listings/edit/:listingId?" element={<EditListing />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:leadId" element={<LeadDetails />} />
              <Route path="flyers" element={<Flyers />} />
              <Route path="email-marketing" element={<Navigate to="/app/admin/email-marketing" replace />} />
              <Route path="lenders" element={<Lenders />} />
              <Route path="aitours" element={<AiTours />} />
              <Route path="openhouses" element={<OpenHousesAgent />} />
              <Route path="conversations" element={<Conversations />} />
              <Route path="conversations/:convoId" element={<ConversationDetails />} />
              <Route path="assets" element={<Assets />} />
              <Route path="voicelab" element={<VoiceLab />} />
              <Route path="automations" element={<Automations />} />
              <Route path="crm" element={<Integrations />} />
              <Route path="crm/logs" element={<Navigate to="/app/crm?tab=logs" replace />} />
              <Route path="agent-360" element={<Agent360 />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="support" element={<SupportTickets />} />
              <Route path="tickets" element={<SupportTickets />} />
              <Route path="api-usage" element={<ApiUsage />} />
              <Route path="templates" element={<Templates />} />
              <Route path="templates/:templateId/edit" element={<EditTemplate />} />
              <Route path="templates/new" element={<EditTemplate />} />
              <Route path="team" element={<Team />} />
              <Route path="team/:memberId/edit" element={<EditMember />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="pilot-admin" element={<PilotAdmin />} />
              <Route path="admin">
                <Route index element={<AdminDashboard />} />
                <Route path="agent-360" element={<Agent360 />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/invite" element={<InviteAgent />} />
                <Route path="listings" element={<AdminListings />} />
                <Route path="welcomes" element={<AdminWelcomeMessages />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="tickets" element={<SupportTickets />} />
                <Route path="api-usage" element={<ApiUsage />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="emails" element={<AdminEmails />} />
                <Route path="email-marketing" element={<EmailMarketing />} />
                <Route path="brokerage" element={<BrokerageSettings />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

