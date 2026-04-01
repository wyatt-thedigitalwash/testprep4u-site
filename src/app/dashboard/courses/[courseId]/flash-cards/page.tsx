import { Layers } from "lucide-react";

export default function FlashCardsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Layers size={28} className="text-blue-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-navy">
          Flash Cards
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Digital flash cards targeting your weak areas will appear here.
          Practice key insurance concepts with spaced repetition.
        </p>
        <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-500">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
