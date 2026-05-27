import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CONVEX_URL } from '../lib/constants';
import { tauriFetch } from '../lib/tauriFetch';

/**
 * Marketplace listing shape — same enum as `syncStore.PackKind`
 * (flow | folder | preset). Kept as a local alias here so this store
 * stays self-contained, but the values MUST stay in sync with PackKind
 * so a UserPack can be published to the marketplace without translation.
 */
export type ListingKind = 'flow' | 'folder' | 'preset';

export interface FlowPreview {
  stepCount: number;
  stepLabels: string[];
}
export interface FolderPreview {
  promptHeaders: string[];
}
export interface PresetPreview {
  styleSummary: string;
  sampleImages: string[];
  palette: string[];
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  kind: ListingKind;
  title: string;
  description: string;
  icon?: string;
  tags: string[];
  price: number;
  currency: string;
  r2Key: string;
  fileSize: number;
  promptCount: number;
  flowPreview?: FlowPreview;
  folderPreview?: FolderPreview;
  presetPreview?: PresetPreview;
  isPublic: boolean;
  isOfficial?: boolean;
  avgEvalScore?: number;
  evalScoreCount?: number;
  downloads: number;
  createdAt: number;
  updatedAt: number;
  purchased?: boolean;
  isOwner?: boolean;
}

export interface Purchase {
  purchaseId: string;
  purchasedAt: number;
  pricePaid: number;
  listing: MarketplaceListing | null;
  sellerName?: string | null;
  sellerEmail?: string | null;
  sellerIsOfficial?: boolean;
}

export interface Sale {
  purchaseId: string;
  purchasedAt: number;
  pricePaid: number;
  creditsGranted: number;
  listingId: string;
  listingTitle: string | null;
  listingIcon: string | null;
  payoutStatus: string;
}

export type SortKey = 'newest' | 'downloads' | 'price_asc' | 'price_desc';

export interface Filters {
  kind: ListingKind | 'all';
  query: string;
  tag: string;
  sort: SortKey;
}

interface MarketplaceState {
  listings: MarketplaceListing[];
  cursor: number | null;
  total: number;
  filters: Filters;
  loading: boolean;
  error: string | null;

  purchases: Purchase[];
  purchasesLoading: boolean;

  myListings: MarketplaceListing[];
  myListingsLoading: boolean;

  /** Recent sales feed for seller's My listings notification centre. */
  sales: Sale[];
  salesLoading: boolean;
  /** Unix ms — last time the user "viewed" the feed. Persisted so the
   *  unread badge survives across app restarts and only marks rows newer
   *  than this as unread. */
  lastSeenSalesAt: number;
  fetchSales: (userId: string) => Promise<void>;
  markSalesSeen: () => void;
  /** Last time the buyer viewed their Purchased-tab removal notifications. */
  lastSeenPurchaseRemovalAt: number;
  markPurchaseRemovalsSeen: () => void;
  /** Inline "Listing was removed by the seller" grid cards the buyer has
   *  dismissed. Persisted so dismissals survive app restarts. */
  dismissedRemovedPurchases: string[];
  dismissRemovedPurchase: (purchaseId: string) => void;

  /** User-saved tag filters. Persisted to localStorage. */
  savedTagFilters: string[];
  saveTagFilter: (tag: string) => void;
  removeSavedTagFilter: (tag: string) => void;

  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  fetchListings: (userId: string) => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  getListing: (userId: string, listingId: string) => Promise<MarketplaceListing | null>;
  fetchPurchases: (userId: string) => Promise<void>;
  fetchMyListings: (userId: string) => Promise<void>;
  createListingFromPack: (
    userId: string,
    payload: {
      packId: string;
      kind: ListingKind;
      title: string;
      description: string;
      icon?: string;
      tags: string[];
      price: number;
      flowPreview?: FlowPreview;
      folderPreview?: FolderPreview;
      presetPreview?: PresetPreview;
      presetImages?: Array<{ base64: string; ext: 'jpg' | 'jpeg' | 'png' | 'webp' }>;
      promptHashes?: string[];
    },
  ) => Promise<string>;
  purchaseListing: (
    userId: string,
    listingId: string,
  ) => Promise<{ alreadyPurchased: boolean }>;
  claimFree: (userId: string, listingId: string) => Promise<{ alreadyClaimed: boolean }>;
  downloadPurchased: (
    userId: string,
    listingId: string,
  ) => Promise<{ fileData: string; title: string }>;
  unlist: (userId: string, listingId: string) => Promise<void>;
  relist: (userId: string, listingId: string) => Promise<void>;
  deleteListing: (userId: string, listingId: string) => Promise<void>;
  clearError: () => void;
}

async function post<T>(path: string, body: any): Promise<T> {
  const res = await tauriFetch(`${CONVEX_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON response (e.g. Convex "No matching route" 404). Surface a
    // friendlier message than the raw JSON.parse error.
    const snippet = text.slice(0, 80);
    if (res.status === 404 || /no matching route/i.test(text)) {
      throw new Error(
        'Marketplace API not deployed yet. Run `cd web && npx convex deploy` to publish the new endpoints.',
      );
    }
    throw new Error(`Server returned ${res.status}: ${snippet || 'empty response'}`);
  }
  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  return json as T;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
  listings: [],
  cursor: 0,
  total: 0,
  filters: { kind: 'all', query: '', tag: '', sort: 'newest' },
  loading: false,
  error: null,
  purchases: [],
  purchasesLoading: false,
  myListings: [],
  myListingsLoading: false,

  sales: [],
  salesLoading: false,
  lastSeenSalesAt: 0,
  lastSeenPurchaseRemovalAt: 0,
  markPurchaseRemovalsSeen() {
    set({ lastSeenPurchaseRemovalAt: Date.now() });
  },
  dismissedRemovedPurchases: [],
  dismissRemovedPurchase(purchaseId) {
    set((s) =>
      s.dismissedRemovedPurchases.includes(purchaseId)
        ? s
        : { dismissedRemovedPurchases: [...s.dismissedRemovedPurchases, purchaseId] },
    );
  },
  async fetchSales(userId) {
    set({ salesLoading: true });
    try {
      const { sales } = await post<{ sales: Sale[] }>(
        '/api/desktop/marketplace/recent-sales',
        { userId, limit: 50 },
      );
      set({ sales, salesLoading: false });
    } catch (e) {
      set({ error: errMsg(e), salesLoading: false });
    }
  },
  markSalesSeen() {
    set({ lastSeenSalesAt: Date.now() });
  },

  savedTagFilters: [],
  saveTagFilter(tag) {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    set((s) =>
      s.savedTagFilters.includes(clean)
        ? s
        : { savedTagFilters: [...s.savedTagFilters, clean] },
    );
  },
  removeSavedTagFilter(tag) {
    set((s) => ({
      savedTagFilters: s.savedTagFilters.filter((t) => t !== tag),
    }));
  },

  setFilter(key, value) {
    set((s) => ({ filters: { ...s.filters, [key]: value } }));
  },

  async fetchListings(userId) {
    const { filters } = get();
    set({ loading: true, error: null, cursor: 0 });
    try {
      const result = await post<{
        listings: MarketplaceListing[];
        nextCursor: number | null;
        total: number;
      }>('/api/desktop/marketplace/list', {
        userId,
        kind: filters.kind === 'all' ? undefined : filters.kind,
        tag: filters.tag || undefined,
        query: filters.query || undefined,
        sort: filters.sort,
        cursor: 0,
      });
      set({
        listings: result.listings,
        cursor: result.nextCursor,
        total: result.total,
        loading: false,
      });
    } catch (e) {
      set({ error: errMsg(e), loading: false });
    }
  },

  async loadMore(userId) {
    const { cursor, filters, listings } = get();
    if (cursor == null) return;
    set({ loading: true, error: null });
    try {
      const result = await post<{
        listings: MarketplaceListing[];
        nextCursor: number | null;
        total: number;
      }>('/api/desktop/marketplace/list', {
        userId,
        kind: filters.kind === 'all' ? undefined : filters.kind,
        tag: filters.tag || undefined,
        query: filters.query || undefined,
        sort: filters.sort,
        cursor,
      });
      set({
        listings: [...listings, ...result.listings],
        cursor: result.nextCursor,
        total: result.total,
        loading: false,
      });
    } catch (e) {
      set({ error: errMsg(e), loading: false });
    }
  },

  async getListing(userId, listingId) {
    try {
      const { listing } = await post<{ listing: MarketplaceListing }>(
        '/api/desktop/marketplace/get',
        { userId, listingId },
      );
      return listing;
    } catch (e) {
      set({ error: errMsg(e) });
      return null;
    }
  },

  async fetchPurchases(userId) {
    set({ purchasesLoading: true });
    try {
      const { purchases } = await post<{ purchases: Purchase[] }>(
        '/api/desktop/marketplace/my-purchases',
        { userId },
      );
      set({ purchases, purchasesLoading: false });
    } catch (e) {
      set({ error: errMsg(e), purchasesLoading: false });
    }
  },

  async fetchMyListings(userId) {
    set({ myListingsLoading: true });
    try {
      const { listings } = await post<{ listings: MarketplaceListing[] }>(
        '/api/desktop/marketplace/my-listings',
        { userId },
      );
      set({ myListings: listings, myListingsLoading: false });
    } catch (e) {
      set({ error: errMsg(e), myListingsLoading: false });
    }
  },

  async createListingFromPack(userId, payload) {
    const result = await post<{ listingId: string }>(
      '/api/desktop/marketplace/create-listing-from-pack',
      { userId, ...payload },
    );
    return result.listingId;
  },

  async purchaseListing(userId, listingId) {
    const result = await post<{ alreadyPurchased: boolean }>(
      '/api/desktop/marketplace/purchase',
      { userId, listingId },
    );
    return { alreadyPurchased: !!result.alreadyPurchased };
  },

  async claimFree(userId, listingId) {
    const result = await post<{ alreadyClaimed: boolean }>(
      '/api/desktop/marketplace/claim-free',
      { userId, listingId },
    );
    return { alreadyClaimed: !!result.alreadyClaimed };
  },

  async downloadPurchased(userId, listingId) {
    const result = await post<{
      fileData: string;
      listing: { title: string };
    }>('/api/desktop/marketplace/download', { userId, listingId });
    return { fileData: result.fileData, title: result.listing.title };
  },

  async unlist(userId, listingId) {
    await post<{ success: boolean }>('/api/desktop/marketplace/unlist', {
      userId,
      listingId,
    });
    set((s) => ({
      myListings: s.myListings.map((l) =>
        l.id === listingId ? { ...l, isPublic: false } : l,
      ),
    }));
  },

  async relist(userId, listingId) {
    await post<{ success: boolean }>('/api/desktop/marketplace/relist', {
      userId,
      listingId,
    });
    set((s) => ({
      myListings: s.myListings.map((l) =>
        l.id === listingId ? { ...l, isPublic: true } : l,
      ),
    }));
  },

  async deleteListing(userId, listingId) {
    await post<{ success: boolean }>('/api/desktop/marketplace/delete', {
      userId,
      listingId,
    });
    set((s) => ({
      myListings: s.myListings.filter((l) => l.id !== listingId),
    }));
  },

  clearError() {
    set({ error: null });
  },
    }),
    {
      name: 'marketplace-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only user-customized values; not transient fetches.
      partialize: (state) => ({
        savedTagFilters: state.savedTagFilters,
        filters: state.filters,
        lastSeenSalesAt: state.lastSeenSalesAt,
        lastSeenPurchaseRemovalAt: state.lastSeenPurchaseRemovalAt,
        dismissedRemovedPurchases: state.dismissedRemovedPurchases,
      }),
    },
  ),
);

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
