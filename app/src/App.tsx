import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ImportPage } from './components/ImportExport/ImportPage';
import { ExportPage } from './components/ImportExport/ExportPage';
import { SettingsPage } from './components/Settings';
import { DraftPage } from './components/Draft';
import { SavedPacksPage } from './components/SavedPacks';
import { UserPacksPage } from './components/UserPacks';
import { PromptControlPage } from './components/PromptControl';
import { useAuthStore } from './stores/authStore';
import { useSyncStore } from './stores/syncStore';
import { useSettingsStore } from './stores/settingsStore';
import { TutorialOverlay } from './components/Onboarding/TutorialOverlay';

function App() {
  const [currentPage, setCurrentPage] = useState('draft');
  const { session, refreshTier } = useAuthStore();
  const { fetchAllPacks, cloudPacks, userPacks } = useSyncStore();
  const { hasCompletedOnboarding, completeOnboarding } = useSettingsStore();

  // Fetch cloud and user packs when session is available
  useEffect(() => {
    if (session?.user_id && cloudPacks.length === 0 && userPacks.length === 0) {
      fetchAllPacks(session.user_id);
    }
  }, [session?.user_id]);

  // Refresh user tier on app load (in case it changed since last session)
  useEffect(() => {
    if (session?.user_id) {
      refreshTier();
    }
  }, [session?.user_id]);

  const renderPage = () => {
    switch (currentPage) {
      case 'draft':
        return <DraftPage />;
      case 'saved-packs':
        return <SavedPacksPage />;
      case 'user-packs':
        return <UserPacksPage />;
      case 'prompt-control':
        return <PromptControlPage />;
      case 'import':
        return <ImportPage />;
      case 'export':
        return <ExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DraftPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
      {!hasCompletedOnboarding && (
        <TutorialOverlay onComplete={completeOnboarding} />
      )}
    </Layout>
  );
}

export default App;
