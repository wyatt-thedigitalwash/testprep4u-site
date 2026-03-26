import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const EMAIL_FROM = "TestPrep4U <noreply@testprep4u.com>";
export const SUPPORT_EMAIL = "support@testprep4u.com";
