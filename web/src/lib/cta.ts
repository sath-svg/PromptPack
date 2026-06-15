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

/** Where Stripe sends the user after a successful trial checkout. */
export const TRIAL_SUCCESS_PATH = "/overview";
