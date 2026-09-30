import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { CityMap } from './components/CityMap';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailsView } from './components/ProjectDetailsView';
import { FieldOfficerModule } from './components/FieldOfficerModule';
import { ContractorView } from './components/ContractorView';
import { BudgetView } from './components/BudgetView';
import { DocumentCenterView } from './components/DocumentCenterView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { CommandCenterMode } from './components/CommandCenterMode';
import { AlertsCenterView } from './components/AlertsCenterView';

const MainAppContent: React.FC = () => {
  const { isLoggedIn, activeTab, selectedProjectId } = useApp();

  if (!isLoggedIn) {
    return <LoginModal />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'map':
        return <CityMap />;
      case 'projects':
        return selectedProjectId ? <ProjectDetailsView /> : <ProjectsView />;
      case 'ai-insights':
        return <ProjectDetailsView />;
      case 'field-updates':
        return <FieldOfficerModule />;
      case 'contractors':
        return <ContractorView />;
      case 'budget':
        return <BudgetView />;
      case 'reports':
        return <ReportsView />;
      case 'documents':
        return <DocumentCenterView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView />;
      case 'alerts':
        return <AlertsCenterView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0">
          {renderTabContent()}
        </main>
      </div>

      <AIAssistantDrawer />
      <CommandCenterMode />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
