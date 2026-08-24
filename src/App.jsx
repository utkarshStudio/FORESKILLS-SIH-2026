import { Toaster } from '@/components/UI';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { AuthProvider } from '@/hooks/hooks';
import { ScrollToTop, Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/Common';
import DecisionCenter from '@/pages/DecisionCenter';
import DistrictIntelligence from '@/pages/DistrictIntelligence';
import SkillDemand from '@/pages/SkillDemand';
import EconomicShocks from '@/pages/EconomicShocks';
import Investments from '@/pages/Investments';
import CurriculumIntelligence from '@/pages/CurriculumIntelligence';
import WorkforceDigitalTwin from '@/pages/WorkforceDigitalTwin';
import PolicySimulator from '@/pages/PolicySimulator';
import BudgetOptimizer from '@/pages/BudgetOptimizer';
import ScenarioComparison from '@/pages/ScenarioComparison';
import TalentMobility from '@/pages/TalentMobility';
import Reports from '@/pages/Reports';
import OfficerProfile from '@/pages/OfficerProfile';

const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground leading-relaxed">
            The page <span className="font-medium text-foreground">"{pageName}"</span> could not be found
            in this application.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Decision Center
          </Link>
        </div>

        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          Use the sidebar navigation to reach an existing page.
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ErrorBoundary><DecisionCenter /></ErrorBoundary>} />
      <Route path="/dashboard" element={<ErrorBoundary><DecisionCenter /></ErrorBoundary>} />
        <Route path="/district" element={<ErrorBoundary><DistrictIntelligence /></ErrorBoundary>} />
        <Route path="/district/:districtId" element={<ErrorBoundary><DistrictIntelligence /></ErrorBoundary>} />
        <Route path="/skills" element={<ErrorBoundary><SkillDemand /></ErrorBoundary>} />
        <Route path="/economic-shocks" element={<ErrorBoundary><EconomicShocks /></ErrorBoundary>} />
        <Route path="/investments" element={<ErrorBoundary><Investments /></ErrorBoundary>} />
        <Route path="/curriculum" element={<ErrorBoundary><CurriculumIntelligence /></ErrorBoundary>} />
        <Route path="/digital-twin" element={<ErrorBoundary><WorkforceDigitalTwin /></ErrorBoundary>} />
        <Route path="/policy-simulator" element={<ErrorBoundary><PolicySimulator /></ErrorBoundary>} />
        <Route path="/budget-optimizer" element={<ErrorBoundary><BudgetOptimizer /></ErrorBoundary>} />
        <Route path="/scenario-comparison" element={<ErrorBoundary><ScenarioComparison /></ErrorBoundary>} />
        <Route path="/talent-mobility" element={<ErrorBoundary><TalentMobility /></ErrorBoundary>} />
        <Route path="/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><OfficerProfile /></ErrorBoundary>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
