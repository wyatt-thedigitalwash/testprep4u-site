"use client";

import { useState } from "react";
import { contactPage } from "@/lib/content";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Mail, Phone, MessageCircle, Send, CheckCircle } from "lucide-react";

const SUBJECTS = [
  "General Inquiry",
  "Enrollment Question",
  "Technical Support",
  "Billing / Refund",
  "Partnership / Group Pricing",
  "Other",
];

export function ContactForm() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    // TODO: Wire up Resend API route (e.g. POST /api/contact)
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSubmitted(true);
  }

  return (
    <section className="py-20 md:py-24">
      <div
        ref={ref}
        className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16"
      >
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
          {/* Left — Form */}
          <div className="flex-1" style={fadeUp(isInView, 0)}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-navy">
                  Message Sent
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Thanks for reaching out. We&rsquo;ll get back to you within one
                  business day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    defaultValue=""
                    className="w-full cursor-pointer rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="" disabled>
                      Select a topic...
                    </option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-8 py-3.5 font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-60 sm:w-auto"
                >
                  <Send size={16} />
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Right — Support info */}
          <div className="lg:w-[360px]" style={fadeUp(isInView, 150)}>
            <div className="space-y-6">
              {/* Support note */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="font-display text-base font-bold text-navy">
                  24/7 Student Support
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {contactPage.supportNote}
                </p>
              </div>

              {/* Contact details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Mail size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Email</p>
                    {/* ⚑ CLIENT ACTION REQUIRED: Supply support email */}
                    <p className="mt-0.5 text-sm text-gray-500">
                      support@testprep4u.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Phone size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Phone</p>
                    {/* ⚑ CLIENT ACTION REQUIRED: Supply support phone number */}
                    <p className="mt-0.5 text-sm text-gray-500">
                      (XXX) XXX-XXXX
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <MessageCircle size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      Live Chat
                    </p>
                    {/* ⚑ CLIENT ACTION REQUIRED: Supply chat platform details */}
                    <p className="mt-0.5 text-sm text-gray-500">
                      Available 24/7 for enrolled students
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
