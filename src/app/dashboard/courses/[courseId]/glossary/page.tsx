import { BookA } from "lucide-react";

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <BookA size={28} className="text-blue-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-navy">Glossary</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          A searchable glossary of insurance terms and definitions will appear
          here.
        </p>
        <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-500">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
