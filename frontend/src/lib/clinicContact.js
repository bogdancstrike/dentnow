/**
 * Clinic contact helpers — derive phone / WhatsApp details from a backend
 * clinic's `contacts` array. Clinic data comes exclusively from the publication
 * API (see SiteDataProvider); nothing about a clinic is hardcoded in the frontend.
 */
import { whatsappUrlFor } from './leadCapture';

function primaryContact(contacts, kind) {
  return contacts.find((c) => c.kind === kind && c.is_primary)
    || contacts.find((c) => c.kind === kind);
}

/** Phone number (tel: digits) + display label for a clinic, or null when none is published. */
export function clinicPhone(clinic) {
  const contacts = clinic?.contacts || [];
  const phone = primaryContact(contacts, 'phone');
  if (!phone) return null;
  const tel = phone.url?.startsWith('tel:') ? phone.url.slice(4) : phone.normalized_value;
  if (!tel) return null;
  return { tel, display: phone.display_value || phone.normalized_value || tel };
}

/** WhatsApp deep-link for a clinic (falls back to its phone number), or null. */
export function clinicWhatsappHref(clinic, message) {
  const contacts = clinic?.contacts || [];
  const whatsapp = primaryContact(contacts, 'whatsapp');
  if (whatsapp?.url) return whatsapp.url;
  const number = whatsapp?.normalized_value || clinicPhone(clinic)?.tel;
  if (!number) return null;
  return message ? whatsappUrlFor(number, message) : whatsappUrlFor(number);
}
