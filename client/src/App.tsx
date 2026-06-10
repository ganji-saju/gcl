import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
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
import PartnerCaseBoard from "./pages/PartnerCaseBoard";
import ProviderQuoteDesk from "./pages/ProviderQuoteDesk";

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
      <Route path="/admin/beta" component={ClosedBetaOps} />
      <Route path="/admin/cases" component={CaseDashboard} />
      <Route path="/admin/quote-booking" component={QuoteBookingMvp} />
      <Route path="/admin/landing-routes" component={AdminLandingRoutes} />
      <Route path="/partner/cases" component={PartnerCaseBoard} />
      <Route path="/provider/quotes" component={ProviderQuoteDesk} />
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
