/** A language switch replaces route schema as well as visible copy and canonicals. */
export function clearWritingSchema() {
  const types = new Set(['Article', 'Book', 'CreativeWorkSeries', 'BreadcrumbList']);
  for (const script of document.head.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent);
      const records = Array.isArray(data) ? data : [data];
      if (records.some((record) => [].concat(record['@type'] ?? []).some((type) => types.has(type)))) script.remove();
    } catch { /* Leave unrelated structured data alone. */ }
  }
}
