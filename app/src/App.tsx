import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ImportPage } from './components/ImportExport/ImportPage';
import { ExportPage } from './components/ImportExport/ExportPage';
import { SettingsPage } from './components/Settings';
import { DraftPage } from './components/Draft';
import { SavedPacksPage } from './components/SavedPacks';
import { UserPacksPage } from './components/UserPacks';
import { useAuthStore } from './stores/authStore';
import { useSyncStore } from './stores/syncStore';

function App() {
  const [currentPage, setCurrentPage] = useState('draft');
  const { session, refreshTier } = useAuthStore();
  const { fetchAllPacks, cloudPacks, userPacks } = useSyncStore();

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
    </Layout>
  );
}

export default App;
