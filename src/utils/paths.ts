const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(pathname: string): string {
  if (!pathname) return base || '/';
  if (/^(https?:|mailto:|tel:|#)/.test(pathname)) return pathname;
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${normalized}` || '/';
}

export function stripBase(pathname: string): string {
  if (!base || base === '/') return pathname;
  if (!pathname.startsWith(base)) return pathname;
  const stripped = pathname.slice(base.length);
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}
