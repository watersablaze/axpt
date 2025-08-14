export function fmtDateTime(d: Date | string | number) {
  const dt = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(dt);
}

export function fmtDate(d: Date | string | number) {
  const dt = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: '2-digit'
  }).format(dt);
}