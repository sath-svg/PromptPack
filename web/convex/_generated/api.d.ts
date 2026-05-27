/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as authStatus from "../authStatus.js";
import type * as autoTopup from "../autoTopup.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as evaluations from "../evaluations.js";
import type * as http from "../http.js";
import type * as httpDesktop from "../httpDesktop.js";
import type * as httpExtension from "../httpExtension.js";
import type * as httpInternal from "../httpInternal.js";
import type * as jwt from "../jwt.js";
import type * as loops from "../loops.js";
import type * as marketplace from "../marketplace.js";
import type * as packVersions from "../packVersions.js";
import type * as packs from "../packs.js";
import type * as posthog from "../posthog.js";
import type * as promptVersions from "../promptVersions.js";
import type * as purchasedPacks from "../purchasedPacks.js";
import type * as refreshTokens from "../refreshTokens.js";
import type * as savedPacks from "../savedPacks.js";
import type * as skillsets from "../skillsets.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  authStatus: typeof authStatus;
  autoTopup: typeof autoTopup;
  credits: typeof credits;
  crons: typeof crons;
  email: typeof email;
  evaluations: typeof evaluations;
  http: typeof http;
  httpDesktop: typeof httpDesktop;
  httpExtension: typeof httpExtension;
  httpInternal: typeof httpInternal;
  jwt: typeof jwt;
  loops: typeof loops;
  marketplace: typeof marketplace;
  packVersions: typeof packVersions;
  packs: typeof packs;
  posthog: typeof posthog;
  promptVersions: typeof promptVersions;
  purchasedPacks: typeof purchasedPacks;
  refreshTokens: typeof refreshTokens;
  savedPacks: typeof savedPacks;
  skillsets: typeof skillsets;
  stripe: typeof stripe;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
