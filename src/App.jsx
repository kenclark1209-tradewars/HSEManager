import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Incidents from '@/pages/Incidents';
import IncidentDetail from '@/pages/IncidentDetail';
import Actions from '@/pages/Actions';
import ActionDetail from '@/pages/ActionDetail';
import Risks from '@/pages/Risks';
import SOPs from '@/pages/SOPs';
import Regulations from '@/pages/Regulations';
import AIAssistant from '@/pages/AIAssistant';
import Settings from '@/pages/Settings';
import HSECategories from '@/pages/HSECategories';
import ReportsPage from '@/pages/ReportsPage';
import InspectionPage from '@/pages/InspectionPage';
import BudgetPage from '@/pages/BudgetPage';
import CompliancePage from '@/pages/CompliancePage';
import AIMonitor from '@/pages/AIMonitor';
import PDCAPage from '@/pages/PDCAPage';
import ChecklistPage from '@/pages/ChecklistPage';
import AIRoleAssistant from '@/pages/AIRoleAssistant';
import AIToolDefinitionsPage from '@/pages/AIToolDefinitionsPage';
import AIReviewQueuePage from '@/pages/AIReviewQueuePage';
import AIKnowledgeBase from '@/pages/AIKnowledgeBase';
import AuditLogPage from '@/pages/AuditLogPage';
import AIInsightsDashboard from '@/pages/AIInsightsDashboard';
import TrainingPage from '@/pages/TrainingPage';
import EmergencyPage from '@/pages/EmergencyPage';
import LegalRegistryPage from '@/pages/LegalRegistryPage';
import LegalAlertsPage from '@/pages/LegalAlertsPage';
import HSECategoryMatrixPage from '@/pages/HSECategoryMatrixPage';
import SOPLibraryPage from '@/pages/SOPLibraryPage';
import ChecklistLibraryPage from '@/pages/ChecklistLibraryPage';
import FormLibraryPage from '@/pages/FormLibraryPage';
import LegalClausePage from '@/pages/LegalClausePage';
import LegalComplianceDashboard from '@/pages/LegalComplianceDashboard';
import AILegalResearchPage from '@/pages/AILegalResearchPage';
import ComplianceTrackerPage from '@/pages/ComplianceTrackerPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/actions/:id" element={<ActionDetail />} />
        <Route path="/risks" element={<Risks />} />
        <Route path="/sops" element={<SOPs />} />
        <Route path="/regulations" element={<Regulations />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/hse-categories" element={<HSECategories />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/inspections" element={<InspectionPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/compliance-tracker" element={<ComplianceTrackerPage />} />
        <Route path="/ai/monitor" element={<AIMonitor />} />
        <Route path="/ai/role" element={<AIRoleAssistant />} />
        <Route path="/pdca" element={<PDCAPage />} />
        <Route path="/checklists" element={<ChecklistPage />} />
        <Route path="/ai/tools" element={<AIToolDefinitionsPage />} />
        <Route path="/ai/queue" element={<AIReviewQueuePage />} />
        <Route path="/ai/knowledge" element={<AIKnowledgeBase />} />
        <Route path="/ai/insights" element={<AIInsightsDashboard />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/legal/registry" element={<LegalRegistryPage />} />
        <Route path="/legal/alerts" element={<LegalAlertsPage />} />
        <Route path="/legal/categories" element={<HSECategoryMatrixPage />} />
        <Route path="/legal/clauses" element={<LegalClausePage />} />
        <Route path="/legal/dashboard" element={<LegalComplianceDashboard />} />
        <Route path="/legal/research" element={<AILegalResearchPage />} />
        <Route path="/library/sops" element={<SOPLibraryPage />} />
        <Route path="/library/checklists" element={<ChecklistLibraryPage />} />
        <Route path="/library/forms" element={<FormLibraryPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;