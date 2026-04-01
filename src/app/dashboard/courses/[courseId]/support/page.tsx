import Link from "next/link";
import { HelpCircle, Mail, MessageCircle, ExternalLink } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <HelpCircle size={22} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              Support
            </h2>
            <p className="text-sm text-gray-500">
              We&apos;re here to help you succeed.
            </p>
          </div>
        </div>
      </div>

      {/* Contact options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Mail size={20} className="text-blue-500" />
          </div>
          <h3 className="font-display text-sm font-semibold text-navy">
            Email Support
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get a response within 24 hours.
          </p>
          <Link
            href="/contact"
            target="_blank"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-500 transition-colors hover:text-blue-600"
          >
            Contact Us
            <ExternalLink size={14} />
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success-light">
            <MessageCircle size={20} className="text-success" />
          </div>
          <h3 className="font-display text-sm font-semibold text-navy">
            24/7 Chat
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Live chat support available around the clock.
          </p>
          <span className="mt-4 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
            Coming Soon
          </span>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-navy">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {[
            {
              q: "How do I reset my password?",
              a: "Go to Settings and click 'Change Password', or use the forgot password link on the login page.",
            },
            {
              q: "What happens if my access expires?",
              a: "You'll lose access to course materials and exams. Contact support to extend your access.",
            },
            {
              q: "How do I get my certificate?",
              a: "Complete all course modules, pass the final exam with 70% or higher, meet the seat time requirement, and sign the self-study affidavit.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <p className="text-sm font-semibold text-navy">{faq.q}</p>
              <p className="mt-1 text-sm text-gray-500">{faq.a}</p>
            </div>
          ))}
        </div>

        <Link
          href="/faq"
          target="_blank"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-500 transition-colors hover:text-blue-600"
        >
          View All FAQs
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
