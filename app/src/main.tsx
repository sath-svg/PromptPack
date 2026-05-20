import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useSettingsStore } from './stores/settingsStore'

// Initialize theme before render
useSettingsStore.getState().initTheme()

// Hydrate BYOK keys from {appConfigDir}/settings.json. Async — UI renders
// with the localStorage-persisted keys immediately, file values override
// once the read completes (usually within the first frame).
void useSettingsStore.getState().hydrateApiKeysFromFile()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
