// ==============================
// File: scripts/ui/utm.js
// ==============================
export function withUTM(url, utm = {}) {
  if (!url) return '';

  let u;

  try {
    u = new URL(url);
  } catch {
    try {
      u = new URL('https://' + url);
    } catch {
      return ''; // 🚨 mejor devolver vacío
    }
  }

  if (!['http:', 'https:'].includes(u.protocol)) return '';

  const params = u.searchParams;

  if (utm.source && !params.has('utm_source')) params.set('utm_source', utm.source);
  if (utm.medium && !params.has('utm_medium')) params.set('utm_medium', utm.medium);
  if (utm.campaign && !params.has('utm_campaign')) params.set('utm_campaign', utm.campaign);
  if (utm.content && !params.has('utm_content')) params.set('utm_content', utm.content);

  return u.toString();
}