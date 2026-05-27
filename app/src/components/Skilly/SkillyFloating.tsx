/**
 * Fixed-position Skilly that lives across every tab.
 *
 * Rendered via a portal directly into `document.body` so no transformed
 * / filtered / contained ancestor in the Layout tree can capture
 * `position: fixed` and clip Skilly. (CSS: ancestors with `transform`,
 * `filter`, `perspective`, `will-change`, or `contain: paint` create a
 * containing block and steal `position: fixed` from the viewport.)
 *
 * Hides when:
 *   - the user is on the dedicated Skilly tab (`currentPage === 'skilly'`)
 *     so we never render two mascots at once.
 *   - the user has disabled Skilly in Settings (`skillyEnabled === false`).
 *   - the onboarding tour is still running — the tour mounts its own
 *     hero-sized Skilly inside the speech-bubble overlay, then drops him
 *     into this floating slot when the user finishes the tour.
 */

import { createPortal } from 'react-dom';
import { useUiStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Skilly } from './Skilly';

export function SkillyFloating() {
  const currentPage = useUiStore((s) => s.currentPage);
  const skillyEnabled = useSettingsStore((s) => s.skillyEnabled);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);

  if (skillyEnabled === false) return null;
  if (currentPage === 'skilly') return null;
  if (!hasCompletedOnboarding) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(<Skilly variant="floating" />, document.body);
}
