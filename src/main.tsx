import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth.tsx';
import ProtectedLayout from './components/ProtectedLayout.tsx';
import PublicSite from './pages/PublicSite.tsx';
import PlaceholderPage from './pages/PlaceholderPage.tsx';
import Overview from './pages/Overview.tsx';
import Listings from './pages/Listings.tsx';
import ListingDetails from './pages/ListingDetails.tsx';
import EditListing from './pages/EditListing.tsx';
import Tour from './pages/Tour.tsx';
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
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminUsers from './pages/admin/AdminUsers.tsx';
import AdminListings from './pages/admin/AdminListings.tsx';

import Integrations from './pages/Integrations.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<PublicSite />} />
            <Route path="tour/:listingId" element={<Tour />} />
            <Route path="app" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="listings" element={<Listings />} />
              <Route path="listings/:listingId" element={<ListingDetails />} />
              <Route path="listings/edit/:listingId?" element={<EditListing />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:leadId" element={<LeadDetails />} />
              <Route path="conversations" element={<Conversations />} />
              <Route path="conversations/:convoId" element={<ConversationDetails />} />
              <Route path="assets" element={<Assets />} />
              <Route path="voicelab" element={<VoiceLab />} />
              <Route path="automations" element={<Automations />} />
              <Route path="crm" element={<Integrations />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="templates" element={<Templates />} />
              <Route path="templates/:templateId/edit" element={<EditTemplate />} />
              <Route path="templates/new" element={<EditTemplate />} />
              <Route path="team" element={<Team />} />
              <Route path="team/:memberId/edit" element={<EditMember />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin">
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="listings" element={<AdminListings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);

