import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import InternalOpsGate from "./components/InternalOpsGate";
import ScrollManager from "./components/ScrollManager";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";
import { CompareProvider } from "./contexts/CompareContext";
import Home from "./pages/Home";
import Hospitals from "./pages/Hospitals";
import HospitalDetail from "./pages/HospitalDetail";
import Treatments from "./pages/Treatments";
import TreatmentDetail from "./pages/TreatmentDetail";
import Compare from "./pages/Compare";
import Consultation from "./pages/Consultation";
import SkinPackageLanding from "./pages/SkinPackageLanding";
import ClosedBetaOps from "./pages/ClosedBetaOps";
import CaseDashboard from "./pages/CaseDashboard";
import QuoteBookingMvp from "./pages/QuoteBookingMvp";
import AdminLandingRoutes from "./pages/AdminLandingRoutes";
import AdminPartnerRegistry from "./pages/AdminPartnerRegistry";
import AdminProviderRegistry from "./pages/AdminProviderRegistry";
import PartnerCaseBoard from "./pages/PartnerCaseBoard";
import ProviderQuoteDesk from "./pages/ProviderQuoteDesk";
import OpsHealth from "./pages/OpsHealth";
import ReservationCalendar from "./pages/ReservationCalendar";
import type { OpsRole } from "./lib/partnerMvpApi";

function InternalRoute({
  children,
  allowedRoles = ["admin"],
  title,
  allowLocalDemo = false,
}: {
  children: ReactNode;
  allowedRoles?: OpsRole[];
  title?: string;
  allowLocalDemo?: boolean;
}) {
  return <InternalOpsGate allowedRoles={allowedRoles} title={title} allowLocalDemo={allowLocalDemo}>{children}</InternalOpsGate>;
}

function ClosedBetaOpsRoute() {
  return <InternalRoute><ClosedBetaOps /></InternalRoute>;
}

function CaseDashboardRoute() {
  return <InternalRoute><CaseDashboard /></InternalRoute>;
}

function QuoteBookingRoute() {
  return <InternalRoute><QuoteBookingMvp /></InternalRoute>;
}

function ReservationCalendarRoute() {
  return <InternalRoute allowLocalDemo><ReservationCalendar /></InternalRoute>;
}

function AdminLandingRoutesRoute() {
  return <InternalRoute><AdminLandingRoutes /></InternalRoute>;
}

function AdminProviderRegistryRoute() {
  return <InternalRoute allowLocalDemo><AdminProviderRegistry /></InternalRoute>;
}

function AdminPartnerRegistryRoute() {
  return <InternalRoute allowLocalDemo><AdminPartnerRegistry /></InternalRoute>;
}

function PartnerCaseBoardRoute() {
  return <InternalRoute allowedRoles={["admin", "partner"]} title="파트너 운영 접근"><PartnerCaseBoard /></InternalRoute>;
}

function ProviderQuoteDeskRoute() {
  return <InternalRoute allowedRoles={["admin", "provider"]} title="병원 운영 접근"><ProviderQuoteDesk /></InternalRoute>;
}

function OpsHealthRoute() {
  return <InternalRoute><OpsHealth /></InternalRoute>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hospitals" component={Hospitals} />
      <Route path="/hospitals/:slug" component={HospitalDetail} />
      <Route path="/treatments" component={Treatments} />
      <Route path="/treatments/:slug" component={TreatmentDetail} />
      <Route path="/compare" component={Compare} />
      <Route path="/consultation" component={Consultation} />
      <Route path="/admin/beta" component={ClosedBetaOpsRoute} />
      <Route path="/admin/cases" component={CaseDashboardRoute} />
      <Route path="/admin/quote-booking" component={QuoteBookingRoute} />
      <Route path="/admin/reservation-calendar" component={ReservationCalendarRoute} />
      <Route path="/admin/providers" component={AdminProviderRegistryRoute} />
      <Route path="/admin/partners" component={AdminPartnerRegistryRoute} />
      <Route path="/admin/landing-routes" component={AdminLandingRoutesRoute} />
      <Route path="/admin/ops-health" component={OpsHealthRoute} />
      <Route path="/partner/cases" component={PartnerCaseBoardRoute} />
      <Route path="/provider/quotes" component={ProviderQuoteDeskRoute} />
      <Route path="/:locale/:slug" component={SkinPackageLanding} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <I18nProvider>
          <CompareProvider>
            <TooltipProvider>
              <ScrollManager />
              <Toaster richColors position="top-right" />
              <Router />
            </TooltipProvider>
          </CompareProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
