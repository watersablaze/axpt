export function log(level: 'info' | 'warn' | 'error', msg: string, meta?: any) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta } : {}),
  };
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    JSON.stringify(payload)
  );
}