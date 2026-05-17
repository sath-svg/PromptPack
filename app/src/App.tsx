import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ImportPage } from './components/ImportExport/ImportPage';
import { ExportPage } from './components/ImportExport/ExportPage';
import { SettingsPage } from './components/Settings';
import { DraftPage } from './components/Draft';
import { SavedPacksPage } from './components/SavedPacks';
import { UserPacksPage } from './components/UserPacks';
import { SkillControlPage } from './components/PromptControl';
import { SkillChatPage } from './components/SkillChat';
import { SkillPresetPage } from './components/SkillPreset';
import { useAuthStore } from './stores/authStore';
import { useSyncStore } from './stores/syncStore';
import { useSettingsStore } from './stores/settingsStore';
import { TutorialOverlay } from './components/Onboarding/TutorialOverlay';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { NotificationCenter } from './components/Notifications/NotificationCenter';

function App() {
  const [currentPage, setCurrentPage] = useState('chat');
  const { session, refreshTier, initAuthListener } = useAuthStore();
  const { fetchAllPacks, cloudPacks, userPacks } = useSyncStore();
  const { hasCompletedOnboarding, completeOnboarding } = useSettingsStore();

  // Init auth listener immediately — must be ready before deep link fires
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    initAuthListener().then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, []);

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

  // Re-check tier when the window regains focus or becomes visible. Covers
  // the common "upgraded to Pro in the browser, came back to the desktop
  // app, still showing Free" case where the upgrade happened outside the
  // app and there was no signal to invalidate the cached tier.
  useEffect(() => {
    if (!session?.user_id) return;

    const onFocus = () => refreshTier();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshTier();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session?.user_id, refreshTier]);

  // Cross-component navigation: in-app code dispatches CustomEvent
  // 'skillset:navigate' with detail = page id. Avoids prop-drilling
  // setCurrentPage to deeply nested components.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      let page: string | null = null;
      let section: string | null = null;
      if (typeof detail === 'string') {
        page = detail;
      } else if (detail && typeof detail === 'object') {
        const d = detail as { page?: unknown; section?: unknown };
        if (typeof d.page === 'string') page = d.page;
        if (typeof d.section === 'string') section = d.section;
      }
      if (page) setCurrentPage(page);
      if (section) {
        let tries = 0;
        const tryScroll = () => {
          const el = document.getElementById(section!);
          if (el) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
            el.classList.add('search-flash');
            setTimeout(() => el.classList.remove('search-flash'), 1500);
            return;
          }
          if (++tries < 20) setTimeout(tryScroll, 25);
        };
        requestAnimationFrame(tryScroll);
      }
    };
    window.addEventListener('skillset:navigate', handler);
    return () => window.removeEventListener('skillset:navigate', handler);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <SkillChatPage />;
      case 'draft':
        return <DraftPage />;
      case 'skill-preset':
        return <SkillPresetPage />;
      case 'saved-packs':
        return <SavedPacksPage />;
      case 'user-packs':
        return <UserPacksPage />;
      case 'prompt-control':
        return <SkillControlPage />;
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
      <ErrorBoundary key={currentPage} onGoHome={() => setCurrentPage('chat')}>
        {renderPage()}
      </ErrorBoundary>
      {!hasCompletedOnboarding && (
        <TutorialOverlay onComplete={completeOnboarding} />
      )}
      <NotificationCenter />
    </Layout>
  );
}

export default App;
