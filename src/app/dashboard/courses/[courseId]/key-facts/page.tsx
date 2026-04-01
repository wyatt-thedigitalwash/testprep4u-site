import { Lightbulb } from "lucide-react";

export default function KeyFactsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Lightbulb size={28} className="text-blue-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-navy">Key Facts</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Quick-reference study facts and key concepts for your insurance exam
          will appear here.
        </p>
        <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-500">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
