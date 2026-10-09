// Shared by the router and static renderer so deep links have the same canvas
// before and after React loads.
export function pageSurfaceForPath(path) {
  const pathname = path.replace(/\/$/, '');
  if (pathname === '/observatory') return 'page-observatory';
  if (pathname === '/press' || pathname.startsWith('/press/')) return 'page-press';
  if (/^\/(?:hi\/)?(?:writing|books)\/[^/]+\/[^/]+$/.test(pathname)) return 'page-reader';
  return '';
}

export function syncThemeColor() {
  if (typeof document === 'undefined') return;
  const colour = getComputedStyle(document.documentElement).backgroundColor;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colour);
}
