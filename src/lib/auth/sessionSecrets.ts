export const SESSION_COOKIE_NAME = 'axpt_session';

export const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'dev-placeholder-session-secret'
);