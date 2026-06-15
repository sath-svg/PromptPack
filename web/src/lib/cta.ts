/**
 * Single funnel entry for the 3-day trial.
 *
 * The homepage email gate, the /prompts + /skillsets clickable assets, the
 * pricing CTAs, and the nav button all route here. `/start-trial` launches the
 * Stripe checkout when signed in, or bounces to sign-up (which returns here)
 * when signed out.
 */
export const TRIAL_CTA_HREF = "/start-trial";

/** Length of the Stripe free trial, in days. Keep in sync with the email copy. */
export const TRIAL_DAYS = 3;

/**
 * Where Stripe sends the user after a successful trial checkout. The
 * set-password page prompts email-only trial accounts to replace their
 * throwaway password, then forwards everyone else straight to /overview.
 */
export const TRIAL_SUCCESS_PATH = "/account/set-password";
