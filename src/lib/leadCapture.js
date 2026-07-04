import config from '../config';

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
  return rows.join('\\n');
}

export function buildWhatsAppLeadUrl(payload) {
  const phone = config.phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(payload))}`;
}

export async function submitLead(payload) {
  const fallbackUrl = buildWhatsAppLeadUrl(payload);
  if (!config.leadEndpoint) {
    return { ok: false, fallback: 'whatsapp', fallbackUrl };
  }

  try {
    const response = await fetch(config.leadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
    });

    if (response.ok) return { ok: true };
    return { ok: false, error: `Server response ${response.status}`, fallback: 'whatsapp', fallbackUrl };
  } catch (error) {
    return { ok: false, error: error.message, fallback: 'whatsapp', fallbackUrl };
  }
}
