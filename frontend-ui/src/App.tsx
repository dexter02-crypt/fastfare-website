import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Auth
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import EmailVerification from "./pages/auth/EmailVerification";
import OrganizationSetup from "./pages/auth/OrganizationSetup";
import RegisterUser from "./pages/auth/RegisterUser";
import RegisterPartner from "./pages/auth/RegisterPartner";

// Dashboard
import DashboardWrapper from "./pages/dashboard/DashboardWrapper";
import OrganizationDashboard from "./pages/dashboard/OrganizationDashboard";
import UserProfile from "./pages/dashboard/UserProfile";
import NotificationCenter from "./pages/dashboard/NotificationCenter";
import SearchResults from "./pages/dashboard/SearchResults";
import UserManagement from "./pages/dashboard/UserManagement";

// Public Pages
import PricingPage from "./pages/public/PricingPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import ServicesPage from "./pages/public/ServicesPage";
import FeaturesPage from "./pages/public/FeaturesPage";
import IntegrationsPage from "./pages/public/IntegrationsPage";
import ApiReferencePage from "./pages/public/ApiReferencePage";
import ChangelogPage from "./pages/public/ChangelogPage";
import DocumentationPage from "./pages/public/DocumentationPage";
import HelpCenterPage from "./pages/public/HelpCenterPage";
import LogisticsGuidePage from "./pages/public/LogisticsGuidePage";
import CommunityPage from "./pages/public/CommunityPage";
import CareersPage from "./pages/public/CareersPage";
import PressPage from "./pages/public/PressPage";
import CookiePolicyPage from "./pages/public/CookiePolicyPage";

// Shipment Management
import NewShipmentBooking from "./pages/shipment/NewShipmentBooking";
import ShipmentSuccess from "./pages/shipment/ShipmentSuccess";
import ShipmentsList from "./pages/shipment/ShipmentsList";
import ShipmentDetails from "./pages/shipment/ShipmentDetails";
import EditShipment from "./pages/shipment/EditShipment";

// Bulk Operations
import BulkUpload from "./pages/bulk/BulkUpload";
import BulkValidation from "./pages/bulk/BulkValidation";
import BulkProcessing from "./pages/bulk/BulkProcessing";
import BulkSuccess from "./pages/bulk/BulkSuccess";

// Tracking
import FleetTracking from "./pages/tracking/FleetTracking";
import PublicTracking from "./pages/tracking/PublicTracking";
import TrackingResults from "./pages/tracking/TrackingResults";
import LiveMapTracking from "./pages/tracking/LiveMapTracking";
import ProofOfDelivery from "./pages/tracking/ProofOfDelivery";
import UserLiveTracking from "./pages/tracking/UserLiveTracking";
import PartnerFleetView from "./pages/tracking/PartnerFleetView";

// Rates
import RateCalculator from "./pages/rates/RateCalculator";

// Warehouse
import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";
import InventoryManagement from "./pages/warehouse/InventoryManagement";

// Drivers
import DriverManagement from "./pages/drivers/DriverManagement";

// Fleet
import FleetManagement from "./pages/fleet/FleetManagement";
import PartnerTeamManagement from "./pages/partner/PartnerTeamManagement";
import PartnerOrders from "./pages/orders/PartnerOrders";
import PartnerActivity from "./pages/orders/PartnerActivity";
import UserOrders from "./pages/orders/UserOrders";

// Analytics
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";

// Reports
import Reports from "./pages/reports/Reports";
import UserReports from "./pages/reports/UserReports";

// Billing
import BillingDashboard from "./pages/billing/BillingDashboard";
import WalletRecharge from "./pages/billing/WalletRecharge";
import TransactionsPage from "./pages/billing/TransactionsPage";
import InvoicesPage from "./pages/billing/InvoicesPage";

// Support
import SupportCenter from "./pages/support/SupportCenter";

// Settings
import SettingsPage from "./pages/settings/SettingsPage";
import KYCVerification from "./pages/settings/KYCVerification";
import FinancialSetup from "./pages/settings/FinancialSetup";

// Returns
import ReturnsDashboard from "./pages/returns/ReturnsDashboard";

// Legal — Seller/User Policies
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import AcceptableUsePolicy from "./pages/legal/AcceptableUsePolicy";
import SellerRegistrationPolicy from "./pages/legal/SellerRegistrationPolicy";
import TierMembershipPolicy from "./pages/legal/TierMembershipPolicy";
import SettlementPayoutPolicy from "./pages/legal/SettlementPayoutPolicy";
import CODReconciliationPolicy from "./pages/legal/CODReconciliationPolicy";
import ShippingDeliveryPolicy from "./pages/legal/ShippingDeliveryPolicy";
import RTOCancellationPolicy from "./pages/legal/RTOCancellationPolicy";

// Legal — Partner Policies
import PartnerAgreement from "./pages/legal/PartnerAgreement";
import PartnerPrivacyPolicy from "./pages/legal/PartnerPrivacyPolicy";
import PartnerOnboardingPolicy from "./pages/legal/PartnerOnboardingPolicy";
import PartnerPayoutPolicy from "./pages/legal/PartnerPayoutPolicy";
import PartnerCodeOfConduct from "./pages/legal/PartnerCodeOfConduct";
import PartnerDisputePolicy from "./pages/legal/PartnerDisputePolicy";

// Legal — Platform-Wide Policies
import AntiFraudPolicy from "./pages/legal/AntiFraudPolicy";
import GrievanceRedressalPolicy from "./pages/legal/GrievanceRedressalPolicy";
import DataRetentionPolicy from "./pages/legal/DataRetentionPolicy";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import PartnerManagement from "./pages/admin/PartnerManagement";

// Settlement & Tier System
import SettlementDashboard from "./pages/settlement/SettlementDashboard";

// Onboarding
import BusinessStage from "./pages/onboarding/BusinessStage";
import SellingChannels from "./pages/onboarding/SellingChannels";

// WMS (Warehouse Management System)
import WMSDashboard from "./pages/wms/WMSDashboard";
import WMSFleetManagement from "./pages/wms/FleetManagement";
import WMSInventoryPage from "./pages/wms/InventoryPage";
import WMSRTDDashboard from "./pages/wms/RTDDashboard";
import WMSInboundPage from "./pages/wms/InboundPage";
import WMSReportsPage from "./pages/wms/WMSReportsPage";
import WMSTrackingPage from "./pages/wms/WMSTrackingPage";

const queryClient = new QueryClient();

import { WalletProvider } from "./contexts/WalletContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WalletProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/user" element={<RegisterUser />} />
            <Route path="/register/partner" element={<RegisterPartner />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/track" element={<PublicTracking />} />
            <Route path="/track/:awb" element={<TrackingResults />} />
            <Route path="/rates" element={<RateCalculator />} />
            <Route path="/rate-calculator" element={<RateCalculator />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/api-reference" element={<ApiReferencePage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/logistics-guide" element={<LogisticsGuidePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/press" element={<PressPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />

            {/* Legal — Seller/User Policies (Public) */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/acceptable-use" element={<AcceptableUsePolicy />} />
            <Route path="/seller-registration-policy" element={<SellerRegistrationPolicy />} />
            <Route path="/tier-membership" element={<TierMembershipPolicy />} />
            <Route path="/settlement-payout" element={<SettlementPayoutPolicy />} />
            <Route path="/cod-reconciliation" element={<CODReconciliationPolicy />} />
            <Route path="/shipping-delivery" element={<ShippingDeliveryPolicy />} />
            <Route path="/rto-cancellation" element={<RTOCancellationPolicy />} />

            {/* Legal — Partner Policies (Public) */}
            <Route path="/partner-agreement" element={<PartnerAgreement />} />
            <Route path="/partner-privacy" element={<PartnerPrivacyPolicy />} />
            <Route path="/partner-onboarding" element={<PartnerOnboardingPolicy />} />
            <Route path="/partner-payout" element={<PartnerPayoutPolicy />} />
            <Route path="/partner-code-of-conduct" element={<PartnerCodeOfConduct />} />
            <Route path="/partner-dispute" element={<PartnerDisputePolicy />} />

            {/* Legal — Platform-Wide Policies (Public) */}
            <Route path="/anti-fraud" element={<AntiFraudPolicy />} />
            <Route path="/grievance-redressal" element={<GrievanceRedressalPolicy />} />
            <Route path="/data-retention" element={<DataRetentionPolicy />} />

            {/* ═══ Protected Routes (require login) ═══ */}

            {/* Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />
            <Route path="/organization-setup" element={<ProtectedRoute><OrganizationSetup /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />

            {/* Shipment Management */}
            <Route path="/shipment/new" element={<ProtectedRoute><NewShipmentBooking /></ProtectedRoute>} />
            <Route path="/shipment/success" element={<ProtectedRoute><ShipmentSuccess /></ProtectedRoute>} />
            <Route path="/shipments" element={<ProtectedRoute><ShipmentsList /></ProtectedRoute>} />
            <Route path="/shipment/:id" element={<ProtectedRoute><ShipmentDetails /></ProtectedRoute>} />
            <Route path="/shipment/:id/edit" element={<ProtectedRoute><EditShipment /></ProtectedRoute>} />

            {/* Bulk Operations */}
            <Route path="/bulk/upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
            <Route path="/bulk/validation" element={<ProtectedRoute><BulkValidation /></ProtectedRoute>} />
            <Route path="/bulk/processing" element={<ProtectedRoute><BulkProcessing /></ProtectedRoute>} />
            <Route path="/bulk/success" element={<ProtectedRoute><BulkSuccess /></ProtectedRoute>} />

            {/* Tracking (authenticated) */}
            <Route path="/fleet-tracking" element={<ProtectedRoute><FleetTracking /></ProtectedRoute>} />
            <Route path="/tracking/:awb/live" element={<ProtectedRoute><LiveMapTracking /></ProtectedRoute>} />
            <Route path="/tracking/:awb/pod" element={<ProtectedRoute><ProofOfDelivery /></ProtectedRoute>} />
            <Route path="/track-live/:awb" element={<ProtectedRoute><UserLiveTracking /></ProtectedRoute>} />
            <Route path="/partner/fleet-view" element={<ProtectedRoute><PartnerFleetView /></ProtectedRoute>} />

            {/* Warehouse */}
            <Route path="/warehouse" element={<ProtectedRoute><WarehouseDashboard /></ProtectedRoute>} />
            <Route path="/warehouse/inventory" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />

            {/* Drivers */}
            <Route path="/drivers" element={<ProtectedRoute><DriverManagement /></ProtectedRoute>} />

            {/* Fleet & Partners */}
            <Route path="/fleet" element={<ProtectedRoute><FleetManagement /></ProtectedRoute>} />
            <Route path="/partner/orders" element={<ProtectedRoute><PartnerOrders /></ProtectedRoute>} />
            <Route path="/partner/activity" element={<ProtectedRoute><PartnerActivity /></ProtectedRoute>} />
            <Route path="/partner/team" element={<ProtectedRoute><PartnerTeamManagement /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />

            {/* Analytics */}
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />

            {/* Reports */}
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/my-reports" element={<ProtectedRoute><UserReports /></ProtectedRoute>} />

            {/* Billing */}
            <Route path="/billing" element={<ProtectedRoute><BillingDashboard /></ProtectedRoute>} />
            <Route path="/billing/recharge" element={<ProtectedRoute><WalletRecharge /></ProtectedRoute>} />
            <Route path="/billing/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/billing/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />

            {/* Support */}
            <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />
            <Route path="/settings/financial-setup" element={<ProtectedRoute><FinancialSetup /></ProtectedRoute>} />

            {/* Returns */}
            <Route path="/returns" element={<ProtectedRoute><ReturnsDashboard /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute><PartnerManagement /></ProtectedRoute>} />

            {/* Settlement & Tier System */}
            <Route path="/settlement" element={<ProtectedRoute><SettlementDashboard /></ProtectedRoute>} />

            {/* Onboarding */}
            <Route path="/onboarding/business-stage" element={<ProtectedRoute><BusinessStage /></ProtectedRoute>} />
            <Route path="/onboarding/channels" element={<ProtectedRoute><SellingChannels /></ProtectedRoute>} />
            <Route path="/onboarding/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />

            {/* WMS (Warehouse Management System) */}
            <Route path="/wms" element={<ProtectedRoute><WMSDashboard /></ProtectedRoute>} />
            <Route path="/wms/fleet" element={<ProtectedRoute><WMSFleetManagement /></ProtectedRoute>} />
            <Route path="/wms/inventory" element={<ProtectedRoute><WMSInventoryPage /></ProtectedRoute>} />
            <Route path="/wms/rtd" element={<ProtectedRoute><WMSRTDDashboard /></ProtectedRoute>} />
            <Route path="/wms/inbound" element={<ProtectedRoute><WMSInboundPage /></ProtectedRoute>} />
            <Route path="/wms/reports" element={<ProtectedRoute><WMSReportsPage /></ProtectedRoute>} />
            <Route path="/wms/tracking" element={<ProtectedRoute><WMSTrackingPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

