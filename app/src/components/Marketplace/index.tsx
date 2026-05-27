import { useEffect, useMemo, useState } from 'react';
import { open as openShell } from '@tauri-apps/plugin-shell';
import {
  Store,
  Search,
  GitBranch,
  Package,
  Palette,
  ShoppingBag,
  Plus,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Check,
  Lock,
  Tag as TagIcon,
  Download,
  BadgeCheck,
  Sparkles,
  Trash2,
  Star,
  Wallet,
  Bell,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSyncStore } from '../../stores/syncStore';
import {
  useMarketplaceStore,
  type ListingKind,
  type MarketplaceListing,
  type SortKey,
} from '../../stores/marketplaceStore';
import { usePackLimits, getPackLimitMessage } from '../../hooks/usePackLimits';
import { MARKETPLACE_MAX_PRICE_CENTS } from '../../lib/constants';
import { decodeSkillFile, PasswordRequiredError } from '../../lib/skillsetDecoder';
import { FlowPreviewPanel } from './previews/FlowPreview';
import { FolderPreviewPanel } from './previews/FolderPreview';
import { PresetPreviewPanel } from './previews/PresetPreview';

type View = 'browse' | 'detail' | 'new' | 'purchases' | 'my-listings';

const KIND_META: Record<ListingKind, { label: string; icon: typeof GitBranch }> = {
  flow: { label: 'Flow', icon: GitBranch },
  folder: { label: 'Skillset', icon: Package },
  preset: { label: 'Preset', icon: Palette },
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'downloads', label: 'Most downloads' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export function MarketplacePage() {
  const { session } = useAuthStore();
  const [view, setView] = useState<View>('browse');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const userId = session?.user_id;

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-[var(--muted-foreground)]">
        Sign in to access the marketplace.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Store size={22} className="text-[var(--primary)]" />
            Marketplace
          </h2>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Browse, buy, and sell Skill Sets.
          </p>
        </div>
        <nav className="flex gap-1 p-1 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm">
          {(
            [
              ['browse', 'Browse', Search],
              ['purchases', 'Purchased', ShoppingBag],
              ['my-listings', 'My listings', TagIcon],
              ['new', 'New listing', Plus],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setSelectedId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                view === id
                  ? 'bg-[var(--primary-soft)] text-[var(--foreground)] ring-1 ring-inset ring-[var(--primary)]/30'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'browse' &&
        (selectedId ? (
          <ListingDetail
            userId={userId}
            listingId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <BrowseView userId={userId} onPick={(id) => setSelectedId(id)} />
        ))}

      {view === 'detail' && selectedId && (
        <ListingDetail
          userId={userId}
          listingId={selectedId}
          onBack={() => setView('browse')}
        />
      )}

      {view === 'purchases' && <PurchasesView userId={userId} />}
      {view === 'my-listings' && <MyListingsView userId={userId} />}
      {view === 'new' && (
        <NewListingView userId={userId} onPublished={() => setView('my-listings')} />
      )}
    </div>
  );
}

// =========================================================
// Browse
// =========================================================

function BrowseView({
  userId,
  onPick,
}: {
  userId: string;
  onPick: (id: string) => void;
}) {
  const {
    listings,
    loading,
    error,
    filters,
    cursor,
    setFilter,
    fetchListings,
    loadMore,
    savedTagFilters,
    saveTagFilter,
    removeSavedTagFilter,
  } = useMarketplaceStore();

  useEffect(() => {
    fetchListings(userId);
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="text"
            placeholder="Search listings..."
            value={filters.query}
            onChange={(e) => setFilter('query', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchListings(userId);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <input
          type="text"
          placeholder="Tag"
          value={filters.tag}
          onChange={(e) => setFilter('tag', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchListings(userId);
          }}
          className="w-32 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <select
          value={filters.sort}
          onChange={(e) => {
            setFilter('sort', e.target.value as SortKey);
            setTimeout(() => fetchListings(userId), 0);
          }}
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)]"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchListings(userId)}
          className="px-3 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90"
        >
          Search
        </button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {(['all', 'flow', 'folder', 'preset'] as const).map((k) => (
          <button
            key={k}
            onClick={() => {
              setFilter('kind', k);
              setTimeout(() => fetchListings(userId), 0);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filters.kind === k
                ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {k === 'all' ? 'All' : KIND_META[k].label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        {savedTagFilters.map((tag) => {
          const active = filters.tag === tag;
          return (
            <span
              key={tag}
              className={`group inline-flex items-center gap-1 rounded-full border text-xs font-medium transition-colors ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setFilter('tag', tag);
                  setTimeout(() => fetchListings(userId), 0);
                }}
                className="pl-3 pr-1.5 py-1.5"
              >
                #{tag}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSavedTagFilter(tag);
                  if (filters.tag === tag) {
                    setFilter('tag', '');
                    setTimeout(() => fetchListings(userId), 0);
                  }
                }}
                className="pr-2.5 py-1.5 text-[var(--muted-foreground)] hover:text-red-500"
                aria-label={`Remove ${tag} filter`}
                title="Remove saved filter"
              >
                ×
              </button>
            </span>
          );
        })}
        {filters.tag && !savedTagFilters.includes(filters.tag.toLowerCase()) && (
          <button
            type="button"
            onClick={() => saveTagFilter(filters.tag)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-[var(--primary)]/40 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary-soft)]"
            title={`Save "#${filters.tag}" as a filter`}
          >
            <Plus size={11} /> Save "#{filters.tag}"
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading && listings.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          <Loader2 className="inline animate-spin" size={18} /> Loading listings…
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          No listings match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} onClick={() => onPick(l.id)} />
          ))}
        </div>
      )}

      {cursor != null && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => loadMore(userId)}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  onClick,
}: {
  listing: MarketplaceListing;
  onClick: () => void;
}) {
  const KindIcon = KIND_META[listing.kind].icon;
  const coverImage =
    listing.kind === 'preset' ? listing.presetPreview?.sampleImages?.[0] : undefined;
  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--primary)]/40 hover:shadow-sm transition-all"
    >
      {coverImage && (
        <>
          {/* Tiny thumbnail in top-right — hints at cover */}
          <div className="absolute top-3 right-3 z-10 h-10 w-10 rounded-md overflow-hidden border border-[var(--border)] shadow-sm bg-[var(--accent)] group-hover:opacity-0 transition-opacity duration-200">
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          {/* Full-card hover overlay */}
          <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <img
              src={coverImage}
              alt={`${listing.title} cover`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/15" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-sm font-medium">{listing.title}</p>
              <p className="text-xs opacity-80">
                {formatPrice(listing.price)} · {listing.promptCount} prompt
                {listing.promptCount !== 1 ? 's' : ''} · click to view all photos
              </p>
            </div>
          </div>
        </>
      )}
      <div className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-lg">
          {listing.icon ?? <KindIcon size={18} className="text-[var(--primary)]" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--foreground)] truncate flex items-center gap-1">
            {listing.title}
            {listing.isOfficial && (
              <BadgeCheck
                size={14}
                className="text-[var(--primary)] flex-shrink-0"
                aria-label="Verified Skillset Team listing"
              />
            )}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-[var(--accent)] text-[var(--muted-foreground)]">
              <KindIcon size={10} />
              {KIND_META[listing.kind].label}
            </span>
            {listing.isOfficial && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-[var(--primary-soft)] text-[var(--primary)]">
                Skillset Team
              </span>
            )}
            <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
              {listing.promptCount} prompt{listing.promptCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3 min-h-[2.5rem]">
        {listing.description}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-[var(--foreground)] truncate">
          {formatPrice(listing.price)}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {typeof listing.avgEvalScore === 'number' && listing.avgEvalScore > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-500">
              <Star size={11} className="fill-current" />
              {listing.avgEvalScore.toFixed(0)}
            </span>
          )}
          <span className="text-xs text-[var(--muted-foreground)]">
            {listing.downloads} download{listing.downloads !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {listing.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--accent)] text-[var(--muted-foreground)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      </div>
    </button>
  );
}

// =========================================================
// Listing Detail
// =========================================================

function ListingDetail({
  userId,
  listingId,
  onBack,
}: {
  userId: string;
  listingId: string;
  onBack: () => void;
}) {
  const { getListing, purchaseListing, claimFree } = useMarketplaceStore();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const data = await getListing(userId, listingId);
    setListing(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [listingId]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [listingId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-[var(--muted-foreground)]">
        <Loader2 className="inline animate-spin" size={18} /> Loading…
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="py-12 text-center text-[var(--muted-foreground)]">
        Listing not found.
      </div>
    );
  }

  const KindIcon = KIND_META[listing.kind].icon;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-2xl">
            {listing.icon ?? <KindIcon size={24} className="text-[var(--primary)]" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              {listing.title}
              {listing.isOfficial && (
                <BadgeCheck
                  size={18}
                  className="text-[var(--primary)] flex-shrink-0"
                  aria-label="Verified Skillset Team listing"
                />
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--accent)] text-[var(--muted-foreground)]">
                <KindIcon size={12} />
                {KIND_META[listing.kind].label}
              </span>
              {listing.isOfficial && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[var(--primary-soft)] text-[var(--primary)] font-medium">
                  <BadgeCheck size={12} />
                  by Skillset Team
                </span>
              )}
              <span className="text-xs text-[var(--muted-foreground)]">
                {listing.promptCount} prompt{listing.promptCount !== 1 ? 's' : ''} · {listing.downloads} downloads
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {formatPrice(listing.price)}
            </p>
            {typeof listing.avgEvalScore === 'number' && listing.avgEvalScore > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                <Star size={12} className="fill-current" />
                {listing.avgEvalScore.toFixed(1)} avg eval
                {listing.evalScoreCount ? ` · ${listing.evalScoreCount} scored` : ''}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground)] mb-4 whitespace-pre-wrap">
          {listing.description}
        </p>

        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {listing.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-xs rounded-full bg-[var(--accent)] text-[var(--muted-foreground)]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {error && <PurchaseError message={error} priceCredits={listing.price} />}

        <div className="flex gap-2">
          {listing.isOwner ? (
            <span className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--muted-foreground)] text-sm">
              You own this listing
            </span>
          ) : listing.purchased ? (
            <ImportPurchasedButton userId={userId} listingId={listing.id} />
          ) : listing.price === 0 ? (
            <button
              onClick={async () => {
                setBuyLoading(true);
                setError(null);
                try {
                  await claimFree(userId, listing.id);
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Claim failed');
                } finally {
                  setBuyLoading(false);
                }
              }}
              disabled={buyLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {buyLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Download size={16} />
              )}
              Get free
            </button>
          ) : (
            <button
              onClick={async () => {
                setBuyLoading(true);
                setError(null);
                try {
                  await purchaseListing(userId, listing.id);
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Purchase failed');
                } finally {
                  setBuyLoading(false);
                }
              }}
              disabled={buyLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {buyLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ShoppingBag size={16} />
              )}
              Buy for {formatPrice(listing.price)}
            </button>
          )}
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Refresh
          </button>
        </div>
      </div>

      {listing.kind === 'flow' && (
        <FlowPreviewPanel
          preview={listing.flowPreview}
          promptCount={listing.promptCount}
        />
      )}
      {listing.kind === 'folder' && (
        <FolderPreviewPanel
          preview={listing.folderPreview}
          promptCount={listing.promptCount}
        />
      )}
      {listing.kind === 'preset' && (
        <PresetPreviewPanel preview={listing.presetPreview} />
      )}
    </div>
  );
}

function ImportPurchasedButton({
  userId,
  listingId,
}: {
  userId: string;
  listingId: string;
}) {
  const { downloadPurchased } = useMarketplaceStore();
  const { createUserPack } = useSyncStore();
  const { canCreatePack, isAtLimit, tier, currentUserPackCount } = usePackLimits();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (isAtLimit || !canCreatePack) {
    return (
      <div className="flex-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-500">
          {getPackLimitMessage(tier, currentUserPackCount) ||
            'Pack limit reached. Free up a slot before importing.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const { fileData, title } = await downloadPurchased(userId, listingId);
            const bytes = base64ToBytes(fileData);
            const decoded = await decodeSkillFile(bytes);
            await createUserPack(userId, title, decoded.prompts);
            setDone(true);
          } catch (e) {
            if (e instanceof PasswordRequiredError) {
              setError('This pack is encrypted. Open the Import tab to enter the password.');
            } else {
              setError(e instanceof Error ? e.message : 'Import failed');
            }
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy || done}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="animate-spin" size={16} />
        ) : done ? (
          <Check size={16} />
        ) : (
          <Download size={16} />
        )}
        {done ? 'Imported' : busy ? 'Importing…' : 'Import to my packs'}
      </button>
      {error && <ErrorBanner message={error} />}
    </div>
  );
}

// =========================================================
// Purchases
// =========================================================

function PurchasesView({ userId }: { userId: string }) {
  const {
    purchases,
    purchasesLoading,
    fetchPurchases,
    error,
    lastSeenPurchaseRemovalAt,
    markPurchaseRemovalsSeen,
    dismissedRemovedPurchases,
    dismissRemovedPurchase,
  } = useMarketplaceStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases(userId);
  }, [userId]);

  // Refresh on window focus (golden path: user returns from Stripe Checkout)
  useEffect(() => {
    const onFocus = () => fetchPurchases(userId);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId]);

  if (selectedId) {
    return (
      <ListingDetail
        userId={userId}
        listingId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  // Affected purchases: listing deleted OR seller unlisted. These rows
  // remain in `purchases` so the buyer keeps proof of purchase + import
  // ability, but the source listing is gone from the marketplace.
  const removedPurchases = purchases.filter(
    (p) => p.listing === null || (p.listing && p.listing.isPublic === false),
  );

  return (
    <div className="space-y-4">
      <PurchaseRemovalsNotice
        purchases={removedPurchases}
        lastSeenAt={lastSeenPurchaseRemovalAt}
        onMarkSeen={markPurchaseRemovalsSeen}
      />

      <header className="flex items-center justify-between">
        <h3 className="font-medium text-[var(--foreground)]">Purchased</h3>
        <button
          onClick={() => fetchPurchases(userId)}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Refresh
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      {purchasesLoading && purchases.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          <Loader2 className="inline animate-spin" size={18} /> Loading…
        </div>
      ) : purchases.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          Nothing purchased yet. Browse the marketplace to find your first pack.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((p) =>
            p.listing ? (
              <ListingCard
                key={p.purchaseId}
                listing={p.listing}
                onClick={() => setSelectedId(p.listing!.id)}
              />
            ) : dismissedRemovedPurchases.includes(p.purchaseId) ? null : (
              <div
                key={p.purchaseId}
                className="relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted-foreground)]"
              >
                <button
                  type="button"
                  onClick={() => dismissRemovedPurchase(p.purchaseId)}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  aria-label="Dismiss"
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
                <p className="font-medium text-[var(--foreground)] mb-1">
                  Listing was removed by the seller
                </p>
                <p>
                  No longer in Purchased. Stays in{' '}
                  <span className="text-[var(--foreground)]">Your Skillsets</span>{' '}
                  if you imported it.
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================
// My Listings
// =========================================================

function MyListingsView({ userId }: { userId: string }) {
  const {
    myListings,
    myListingsLoading,
    fetchMyListings,
    unlist,
    relist,
    deleteListing,
    error,
    sales,
    salesLoading,
    fetchSales,
    lastSeenSalesAt,
    markSalesSeen,
  } = useMarketplaceStore();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyListings(userId);
    fetchSales(userId);
  }, [userId]);

  useEffect(() => {
    const onFocus = () => fetchSales(userId);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId]);

  return (
    <div className="space-y-4">
      <SalesActivityFeed
        sales={sales}
        loading={salesLoading}
        lastSeenSalesAt={lastSeenSalesAt}
        onMarkSeen={markSalesSeen}
        onRefresh={() => fetchSales(userId)}
      />

      <header className="flex items-center justify-between">
        <h3 className="font-medium text-[var(--foreground)]">My listings</h3>
        <button
          onClick={() => {
            fetchMyListings(userId);
            fetchSales(userId);
          }}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          Refresh
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      {myListingsLoading && myListings.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          <Loader2 className="inline animate-spin" size={18} /> Loading…
        </div>
      ) : myListings.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">
          You have not listed anything yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {myListings.map((l) => {
            const KindIcon = KIND_META[l.kind].icon;
            const busy = busyId === l.id;
            const confirmingDelete = confirmDeleteId === l.id;
            return (
              <li
                key={l.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-lg">
                    {l.icon ? (
                      l.icon
                    ) : (
                      <KindIcon size={16} className="text-[var(--primary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[var(--foreground)] truncate">
                        {l.title}
                      </p>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-[var(--accent)] text-[var(--muted-foreground)]">
                        <KindIcon size={10} />
                        {KIND_META[l.kind].label}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                          l.isPublic
                            ? 'bg-green-500/15 text-green-500'
                            : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {l.isPublic ? 'Listed' : 'Unlisted'}
                      </span>
                    </div>
                    {l.description && (
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1">
                        {l.description}
                      </p>
                    )}
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                      {formatPrice(l.price)} · {l.promptCount} prompt{l.promptCount !== 1 ? 's' : ''} · {l.downloads} download{l.downloads !== 1 ? 's' : ''}
                    </p>
                    {l.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {l.tags.slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--accent)] text-[var(--muted-foreground)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {l.isPublic ? (
                      <button
                        onClick={async () => {
                          setBusyId(l.id);
                          try {
                            await unlist(userId, l.id);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
                      >
                        Unlist
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setBusyId(l.id);
                          try {
                            await relist(userId, l.id);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        disabled={busy}
                        className="text-xs px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
                      >
                        Relist
                      </button>
                    )}
                    {confirmingDelete ? (
                      <div className="flex gap-1">
                        <button
                          onClick={async () => {
                            setBusyId(l.id);
                            try {
                              await deleteListing(userId, l.id);
                              setConfirmDeleteId(null);
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          disabled={busy}
                          className="text-xs px-2.5 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {busy ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={busy}
                          className="text-xs px-2.5 py-1.5 rounded-md text-[var(--muted-foreground)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(l.id)}
                        disabled={busy}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// =========================================================
// New Listing Wizard
// =========================================================

function NewListingView({
  userId,
  onPublished,
}: {
  userId: string;
  onPublished: () => void;
}) {
  const { session } = useAuthStore();
  const tier = session?.tier ?? 'free';
  const { createListingFromPack } = useMarketplaceStore();
  const {
    userPacks,
    fetchAllPacks,
    loadedUserPacks,
    fetchUserPackPrompts,
  } = useSyncStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [packMeta, setPackMeta] = useState<{
    headers: string[];
    promptCount: number;
    title: string;
    icon?: string;
    description?: string;
    promptHashes: string[];
  } | null>(null);

  const [kind, setKind] = useState<ListingKind>('folder');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [tags, setTags] = useState('');
  const [priceDollars, setPriceDollars] = useState('0');
  const [presetSummary, setPresetSummary] = useState('');
  const [presetImages, setPresetImages] = useState<
    Array<{ dataUrl: string; base64: string; ext: 'jpg' | 'jpeg' | 'png' | 'webp' }>
  >([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (userPacks.length === 0) fetchAllPacks(userId);
  }, [userId]);

  if (tier === 'free') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Lock size={28} className="mx-auto mb-3 text-[var(--muted-foreground)]" />
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
          Pro+ required
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Upgrade to Pro or Studio to list packs on the marketplace.
        </p>
      </div>
    );
  }

  const pickPack = async (pack: typeof userPacks[number]) => {
    setError(null);
    setSelectedPackId(pack.id);
    setPackLoading(true);
    try {
      if (pack.isEncrypted) {
        throw new Error(
          'Encrypted packs cannot be listed yet. Remove the password first.',
        );
      }
      let loaded = loadedUserPacks[pack.id];
      if (!loaded) {
        loaded = await fetchUserPackPrompts(pack) ?? undefined as any;
      }
      if (!loaded) throw new Error('Failed to load pack contents');
      const headers = loaded.prompts
        .map((p) => p.header || p.text.slice(0, 60))
        .filter(Boolean);
      const promptHashes = await Promise.all(
        loaded.prompts.map((p) => sha256Hex(p.text ?? '')),
      );
      setPackMeta({
        headers,
        promptCount: loaded.prompts.length,
        title: pack.title,
        icon: pack.icon,
        description: pack.description,
        promptHashes,
      });
      if (!title) setTitle(pack.title);
      if (!icon && pack.icon) setIcon(pack.icon);
      if (!description && pack.description) setDescription(pack.description);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pack');
      setSelectedPackId(null);
    } finally {
      setPackLoading(false);
    }
  };

  const submit = async () => {
    if (!selectedPackId || !packMeta) return;
    setError(null);
    const priceCredits = Math.round(parseFloat(priceDollars || '0'));
    if (
      !Number.isFinite(priceCredits) ||
      priceCredits < 0 ||
      priceCredits > MARKETPLACE_MAX_PRICE_CENTS
    ) {
      setError(
        `Price must be between 0 and ${MARKETPLACE_MAX_PRICE_CENTS.toLocaleString()} credits.`,
      );
      return;
    }
    if (priceCredits > 0 && priceCredits < 50) {
      setError('Paid listings must be at least 50 credits (or set to 0 for free).');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setBusy(true);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const previewHeaders = packMeta.headers.slice(0, 5);
      await createListingFromPack(userId, {
        packId: selectedPackId,
        kind,
        title: title.trim(),
        description: description.trim(),
        icon: icon.trim() || undefined,
        tags: tagList,
        price: priceCredits,
        flowPreview:
          kind === 'flow'
            ? { stepCount: packMeta.promptCount, stepLabels: previewHeaders }
            : undefined,
        folderPreview:
          kind === 'folder' ? { promptHeaders: previewHeaders } : undefined,
        presetPreview:
          kind === 'preset'
            ? {
                styleSummary: presetSummary.slice(0, 600),
                sampleImages: [],
                palette: [],
              }
            : undefined,
        presetImages:
          kind === 'preset' && presetImages.length > 0
            ? presetImages.map((p) => ({ base64: p.base64, ext: p.ext }))
            : undefined,
        promptHashes: packMeta.promptHashes,
      });
      onPublished();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  const showStripeGate = parseFloat(priceDollars || '0') > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StepBar step={step} />

      {error && <ErrorBanner message={error} />}

      {step === 1 && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-medium text-[var(--foreground)] mb-1">
              Pick a skillset to list
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Listings are created from your existing Your Skillsets packs. We
              copy the pack contents into the marketplace — your original stays
              put.
            </p>

            {userPacks.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                You don't have any skillsets yet. Create one in{' '}
                <span className="text-[var(--foreground)]">Your Skillsets</span>{' '}
                first, then come back.
              </div>
            ) : (
              <ul className="space-y-2">
                {userPacks.map((pack) => (
                  <li key={pack.id}>
                    <button
                      type="button"
                      onClick={() => pickPack(pack)}
                      disabled={packLoading}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors disabled:opacity-50 ${
                        selectedPackId === pack.id
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                          : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                      }`}
                    >
                      {pack.icon ? (
                        <span className="text-2xl">{pack.icon}</span>
                      ) : (
                        <Package size={20} className="text-[var(--primary)]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">
                          {pack.title}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {pack.promptCount} prompt
                          {pack.promptCount !== 1 ? 's' : ''}
                          {pack.isEncrypted ? ' · encrypted (cannot list)' : ''}
                        </p>
                      </div>
                      {packLoading && selectedPackId === pack.id && (
                        <Loader2
                          size={16}
                          className="animate-spin text-[var(--muted-foreground)]"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {step >= 2 && packMeta && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3">
            <Package size={18} className="text-[var(--primary)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-0.5">
                Source skillset
              </p>
              <p className="font-medium text-[var(--foreground)] truncate">
                {packMeta.icon ? `${packMeta.icon} ` : ''}{packMeta.title} · {packMeta.promptCount} prompt{packMeta.promptCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedPackId(null);
                setPackMeta(null);
              }}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Change
            </button>
          </div>

          <Field label="Listing type">
            <div className="flex gap-2">
              {(['flow', 'folder', 'preset'] as const).map((k) => {
                const Icon = KIND_META[k].icon;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm ${
                      kind === k
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    <Icon size={14} />
                    {KIND_META[k].label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)]"
              placeholder="e.g. SaaS landing copy flow"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)]"
              placeholder="What problem does this set solve?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon (emoji)">
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm"
                placeholder="🎯"
              />
            </Field>
            <Field label="Price (credits — 0 = free, paid min 50)">
              <input
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                type="number"
                step="1"
                min={0}
                max={MARKETPLACE_MAX_PRICE_CENTS}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm"
                placeholder="500"
              />
            </Field>
          </div>

          <Field label="Tags (comma separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm"
              placeholder="saas, copywriting, marketing"
            />
          </Field>

          {kind === 'preset' && (
            <>
              <Field label="Style summary (shown publicly)">
                <textarea
                  value={presetSummary}
                  onChange={(e) => setPresetSummary(e.target.value)}
                  rows={3}
                  maxLength={600}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm"
                  placeholder="Soft pastel chibi style, clean line work, warm palette…"
                />
              </Field>

              <Field label={`Reference photos (up to 5 — first shown on card)`}>
                <PresetImagePicker
                  images={presetImages}
                  onChange={setPresetImages}
                />
              </Field>
            </>
          )}

          {showStripeGate && <EarningsNote priceDollars={priceDollars} />}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => {
                setStep(1);
                setSelectedPackId(null);
                setPackMeta(null);
              }}
              className="px-3 py-2 text-sm text-[var(--muted-foreground)]"
            >
              Pick a different skillset
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              Publish listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBar({ step }: { step: 1 | 2 }) {
  const stepLabels = useMemo(() => ['Pick skillset', 'Details & publish'], []);
  return (
    <ol className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
      {stepLabels.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              i + 1 <= step
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--accent)]'
            }`}
          >
            {i + 1}
          </span>
          {label}
          {i < stepLabels.length - 1 && <span className="text-[var(--border)]">·</span>}
        </li>
      ))}
    </ol>
  );
}

function EarningsNote({ priceDollars }: { priceDollars: string }) {
  const priceCredits = Math.max(0, Math.round(parseFloat(priceDollars || '0')));
  const sellerCredits = Math.floor((priceCredits * 7000) / 10000);
  return (
    <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)] p-4">
      <div className="flex items-start gap-2">
        <Sparkles size={16} className="text-[var(--primary)] mt-0.5" />
        <p className="flex-1 text-xs text-[var(--muted-foreground)] leading-relaxed">
          You get{' '}
          <span className="text-[var(--foreground)] font-medium">
            {sellerCredits.toLocaleString()} credits
          </span>{' '}
          per sale at {priceCredits.toLocaleString()} credits (Skillset takes
          a 30% platform fee). Credits apply to your subscription and LLM
          usage automatically. No KYC, no payouts onboarding. Use the credits
          for token usage in{' '}
          <span className="text-[var(--foreground)] font-medium">Skill Chat</span>!
        </p>
      </div>
    </div>
  );
}

// =========================================================
// Shared
// =========================================================

type PickedImage = {
  dataUrl: string;
  base64: string;
  ext: 'jpg' | 'jpeg' | 'png' | 'webp';
};

function PresetImagePicker({
  images,
  onChange,
}: {
  images: PickedImage[];
  onChange: (next: PickedImage[]) => void;
}) {
  const remaining = Math.max(0, 5 - images.length);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const slots = remaining;
    const accepted: PickedImage[] = [];
    for (let i = 0; i < files.length && accepted.length < slots; i++) {
      const file = files[i];
      const mime = file.type.toLowerCase();
      let ext: PickedImage['ext'] | null = null;
      if (mime === 'image/jpeg' || mime === 'image/jpg') ext = 'jpg';
      else if (mime === 'image/png') ext = 'png';
      else if (mime === 'image/webp') ext = 'webp';
      if (!ext) continue;
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      const chunk = 0x8000;
      for (let j = 0; j < bytes.length; j += chunk) {
        bin += String.fromCharCode(...bytes.subarray(j, j + chunk));
      }
      const base64 = btoa(bin);
      accepted.push({ dataUrl: `data:${mime};base64,${base64}`, base64, ext });
    }
    if (accepted.length > 0) onChange([...images, ...accepted]);
  };

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-md overflow-hidden border border-[var(--border)] bg-[var(--accent)]"
          >
            <img
              src={img.dataUrl}
              alt={`preview ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white text-[10px] hover:bg-red-500"
              aria-label="Remove"
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 uppercase tracking-wider">
                Cover
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <label
            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
            title="Add reference photo"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <span className="text-xl leading-none">+</span>
            <span className="mt-1 text-[10px]">{remaining} left</span>
          </label>
        )}
      </div>
      <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5">
        Max 5. JPG / PNG / WEBP. First image is the marketplace cover.
      </p>
    </div>
  );
}

function PurchaseRemovalsNotice({
  purchases,
  lastSeenAt,
  onMarkSeen,
}: {
  purchases: import('../../stores/marketplaceStore').Purchase[];
  lastSeenAt: number;
  onMarkSeen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (purchases.length === 0) return null;
  // "Unread" = purchase was made before lastSeenAt but listing is now gone
  // (we can't perfectly date the removal, so use purchasedAt vs lastSeenAt
  // as a proxy: anything seen for the first time since the marker is new).
  const unread = purchases.filter((p) => p.purchasedAt > lastSeenAt).length;
  const showUnread = unread > 0 || lastSeenAt === 0;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          if (next && showUnread) onMarkSeen();
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 flex-shrink-0">
          <Bell size={14} className="text-amber-500" />
          {showUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-medium text-white">
              {purchases.length}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {purchases.length} purchase
            {purchases.length === 1 ? '' : 's'} no longer in marketplace
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {(() => {
              const anyDeleted = purchases.some((p) => p.listing === null);
              const anyUnlisted = purchases.some(
                (p) => p.listing && p.listing.isPublic === false,
              );
              if (anyDeleted && !anyUnlisted)
                return purchases.length === 1
                  ? 'No longer in Purchased — stays in Your Skillsets if you imported it.'
                  : 'No longer in Purchased — they stay in Your Skillsets if you imported them.';
              if (anyUnlisted && !anyDeleted)
                return 'Seller unlisted from marketplace. Your import stays.';
              return 'Seller removed or unlisted. Your import stays if you already imported.';
            })()}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-[var(--muted-foreground)]" />
        ) : (
          <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
        )}
      </button>
      {expanded && (
        <ul className="border-t border-amber-500/20 divide-y divide-amber-500/10 max-h-72 overflow-y-auto">
          {purchases.map((p) => {
            const removed = p.listing === null;
            const title = p.listing?.title ?? 'Removed listing';
            const icon = p.listing?.icon ?? '📦';
            const sellerLabel = formatSeller(
              p.sellerName,
              p.sellerEmail,
              p.sellerIsOfficial ?? p.listing?.isOfficial,
            );
            return (
              <li
                key={p.purchaseId}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className="text-lg flex-shrink-0 opacity-60">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--foreground)] truncate">{title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Purchased {timeAgo(p.purchasedAt)} ·{' '}
                    {removed ? 'deleted' : 'unlisted'} by {sellerLabel}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-amber-500 font-medium flex-shrink-0">
                  kept
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SalesActivityFeed({
  sales,
  loading,
  lastSeenSalesAt,
  onMarkSeen,
  onRefresh,
}: {
  sales: import('../../stores/marketplaceStore').Sale[];
  loading: boolean;
  lastSeenSalesAt: number;
  onMarkSeen: () => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const unreadCount = sales.filter((s) => s.purchasedAt > lastSeenSalesAt).length;
  const totalEarned = sales.reduce((sum, s) => sum + (s.creditsGranted ?? 0), 0);

  if (sales.length === 0 && !loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <Bell size={14} className="text-[var(--muted-foreground)]" />
        No sales yet. New purchases of your listings show up here.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        type="button"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          if (next && unreadCount > 0) onMarkSeen();
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--accent)]/50 transition-colors"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] flex-shrink-0">
          <Bell size={14} className="text-[var(--primary)]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {unreadCount > 0
              ? `${unreadCount} new sale${unreadCount === 1 ? '' : 's'}`
              : 'Sales activity'}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {sales.length} total · {totalEarned.toLocaleString()} credits earned
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2"
          aria-label="Refresh sales"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Refresh'}
        </button>
        {expanded ? (
          <ChevronUp size={14} className="text-[var(--muted-foreground)]" />
        ) : (
          <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
        )}
      </button>

      {expanded && (
        <ul className="border-t border-[var(--border)] divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
          {sales.map((s) => {
            const isNew = s.purchasedAt > lastSeenSalesAt;
            return (
              <li
                key={s.purchaseId}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                  isNew ? 'bg-[var(--primary-soft)]/40' : ''
                }`}
              >
                <span className="text-lg flex-shrink-0">
                  {s.listingIcon ?? '📦'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--foreground)] truncate">
                    {s.listingTitle ?? 'Listing'}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {timeAgo(s.purchasedAt)}
                    {s.payoutStatus === 'credited' && (
                      <span className="ml-1 text-emerald-500">
                        · paid
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-500 flex-shrink-0">
                  +{(s.creditsGranted ?? 0).toLocaleString()}
                </span>
                {isNew && (
                  <span className="ml-1 text-[9px] uppercase tracking-wider text-[var(--primary)] font-medium">
                    new
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Display a seller's identity from optional name + email. Admin account
 * (dksathvik@gmail.com) or any listing flagged `isOfficial` always shows
 * as "Skillset Team" regardless of underlying user.
 */
function formatSeller(
  name?: string | null,
  email?: string | null,
  isOfficial?: boolean,
): string {
  const adminEmail = 'dksathvik@gmail.com';
  if (isOfficial || (email && email.toLowerCase() === adminEmail)) {
    return 'Skillset Team';
  }
  const first = (name ?? '').trim().split(/\s+/)[0];
  if (first && email) return `${first} <${email}>`;
  if (first) return first;
  if (email) return email;
  return 'the seller';
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)] mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

/**
 * Friendly purchase-error block. Detects insufficient-credits messages and
 * surfaces a Top Up CTA inline instead of the raw red banner. Anything
 * else falls through to ErrorBanner.
 */
function PurchaseError({
  message,
  priceCredits,
}: {
  message: string;
  priceCredits: number;
}) {
  const needsTopup = /insufficient credits/i.test(message);
  if (!needsTopup) return <ErrorBanner message={message} />;

  // Parse "need N, have M" from cleaned message; fall back gracefully.
  const need = Number(message.match(/need\s+([\d,]+)/i)?.[1]?.replace(/,/g, '')) || priceCredits;
  const have = Number(message.match(/have\s+([\d,]+)/i)?.[1]?.replace(/,/g, '')) || 0;
  const short = Math.max(0, need - have);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <Wallet size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            You need {short.toLocaleString()} more credits to buy this
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Price: {need.toLocaleString()} credits · Your balance:{' '}
            {have.toLocaleString()} credits. Credits double as LLM usage in
            Skill Chat.
          </p>
          <button
            onClick={() =>
              openShell('https://skillset.so/account').catch(
                () => {},
              )
            }
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600"
          >
            <Wallet size={12} />
            Top up credits
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPrice(credits: number): string {
  if (credits === 0) return 'Free';
  return `${credits.toLocaleString()} credits`;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
