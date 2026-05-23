export default function MarketplaceSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="max-w-md text-center">
        <div className="mb-4 mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Purchase complete
        </h1>
        <p className="text-neutral-600 mb-6">
          Your .skill pack is now available in the desktop app. Open Skillset
          and check the Marketplace → Purchased tab to import it into your
          skillsets.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Return home
        </a>
      </div>
    </main>
  );
}
