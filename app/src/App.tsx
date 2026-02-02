import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PromptList } from './components/PromptList';
import { ImportPage } from './components/ImportExport/ImportPage';
import { ExportPage } from './components/ImportExport/ExportPage';
import { SettingsPage } from './components/Settings';
import { DraftPage } from './components/Draft';
import { CloudPromptsPage } from './components/CloudPrompts';
import { usePromptStore } from './stores/promptStore';
import type { Prompt } from './types';

// Demo data for testing
const DEMO_PROMPTS: Prompt[] = [
  {
    id: '1',
    text: 'You are an expert software engineer. Help me write clean, maintainable code with best practices. Focus on readability and performance.',
    header: 'Code Review',
    source: 'chatgpt',
    isFavorite: true,
    useCount: 5,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    syncStatus: 'synced',
  },
  {
    id: '2',
    text: 'Explain {{concept}} to me like I am a {{level}} level programmer. Use practical examples and analogies.',
    header: 'Explain Concept',
    source: 'claude',
    isFavorite: false,
    useCount: 3,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    syncStatus: 'synced',
  },
  {
    id: '3',
    text: 'Write a comprehensive test suite for the following code. Include unit tests, edge cases, and integration tests where appropriate.',
    header: 'Test Suite',
    source: 'gemini',
    isFavorite: false,
    useCount: 2,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    syncStatus: 'local-only',
  },
  {
    id: '4',
    text: 'Search for the latest information about {{topic}} and summarize the key findings with sources.',
    header: 'Research Topic',
    source: 'perplexity',
    isFavorite: true,
    useCount: 8,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 3,
    syncStatus: 'synced',
  },
];

function App() {
  const [currentPage, setCurrentPage] = useState('library');
  const { setPrompts, prompts } = usePromptStore();

  // Load demo data on first render
  useEffect(() => {
    if (prompts.length === 0) {
      setPrompts(DEMO_PROMPTS);
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
      case 'favorites':
        return <PromptList />;
      case 'draft':
        return <DraftPage />;
      case 'cloud':
        return <CloudPromptsPage />;
      case 'import':
        return <ImportPage />;
      case 'export':
        return <ExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PromptList />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
