/**
 * Presentation site — there is no backend to accept form submissions.
 * We only build a prefilled WhatsApp message so a request opens the chat
 * with the relevant context instead of pretending data was stored.
 */
function buildMessage(payload) {
  const rows = [
    `Sursa: ${payload.source || 'DentNow website'}`,
    payload.name ? `Nume: ${payload.name}` : '',
    payload.phone ? `Telefon: ${payload.phone}` : '',
    payload.email ? `Email: ${payload.email}` : '',
    payload.service ? `Serviciu: ${payload.service}` : '',
    payload.preferredDay ? `Zi preferata: ${payload.preferredDay}` : '',
    payload.score ? `Scor igiena: ${payload.score}` : '',
    payload.ebook ? `E-book: ${payload.ebook}` : '',
    payload.message ? `Mesaj: ${payload.message}` : '',
  ].filter(Boolean);
  return rows.join('\n');
}

export function buildWhatsAppLeadUrl(payload = {}, phoneNumber = '') {
  const phone = String(phoneNumber).replace(/[^0-9]/g, '');
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(payload))}` : '';
}

// WhatsApp link for a specific clinic number.
export function whatsappUrlFor(phone, text = 'Buna ziua, doresc o programare la DentNow.') {
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : '';
}
