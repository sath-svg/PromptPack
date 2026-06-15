import { useEffect } from 'react';
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
import { MarketplacePage } from './components/Marketplace';
import { SkillyPlayground } from './components/Skilly/SkillyPlayground';
import { useAuthStore } from './stores/authStore';
import { useSyncStore } from './stores/syncStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUiStore } from './stores/uiStore';
import { TutorialOverlay } from './components/Onboarding/TutorialOverlay';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { FreePlanGate } from './components/Common/FreePlanGate';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { isFreePlanRetired } from './lib/constants';
import { checkForUpdateOnLaunch } from './lib/appUpdater';
import { bootMessengerClient, shutdownMessengerClient } from './lib/messenger/client';
// Skilly event bridge — subscribes to external stores on import. Side-effect only.
import './components/Skilly/skillyEventBridge';

function App() {
  const currentPage = useUiStore((s) => s.currentPage);
  const setCurrentPage = useUiStore((s) => s.setCurrentPage);
  const { session, refreshTier, initAuthListener } = useAuthStore();
  const { fetchAllPacks, cloudPacks, userPacks } = useSyncStore();
  const { hasCompletedOnboarding, completeOnboarding } = useSettingsStore();

  // Init auth listener immediately — must be ready before deep link fires
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    initAuthListener().then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, []);

  // Poll the updater endpoint once on launch. Shows an Install toast if
  // a new signed build is available; otherwise silent.
  useEffect(() => {
    void checkForUpdateOnLaunch();
  }, []);

  // Messenger bridge (Telegram gateway). Idempotent boot — the client
  // reads `messengersEnabled` + `telegramBotToken` from settings and
  // starts/stops the Rust long-poll loop accordingly. Toggling in
  // Settings re-applies without an app restart.
  //
  // We intentionally DO NOT shut down on unmount: the App component is
  // mounted for the process lifetime, and React StrictMode's mount →
  // unmount → mount cycle in dev caused a double-listener race against
  // the async `listen()` call (two `messenger://incoming` handlers
  // attached, every inbound message handled twice — one wins the
  // `inFlight` guard, the loser emits the spurious "Still working…"
  // reply). `bootMessengerClient` itself is memoized so concurrent
  // mounts share a single subscription.
  useEffect(() => {
    void bootMessengerClient();
  }, []);
  // Silence unused-import lint without changing the public surface.
  void shutdownMessengerClient;

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
      case 'marketplace':
        return <MarketplacePage />;
      case 'prompt-control':
        return <SkillControlPage />;
      case 'skilly':
        return <SkillyPlayground />;
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

  // Free plan retired: lock signed-in free accounts out of the whole app until
  // they upgrade. Server also blocks AI spend (FREE_PLAN_RETIRED); this is the
  // UI lockout. tier refreshes on focus/visibility, so upgrading lifts it.
  if (session && isFreePlanRetired(session.tier)) {
    return <FreePlanGate />;
  }

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
