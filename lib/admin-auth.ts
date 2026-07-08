const FULL_ADMIN_EMAILS = ["amir@mango-realty.com"];
const AGENT_EMAILS     = ["dorsur76@gmail.com"];
const ALL_ADMIN_EMAILS = [...FULL_ADMIN_EMAILS, ...AGENT_EMAILS];

/** כניסה לאדמין (נכסים, שכונות, תמונות, AI) */
export const isAdmin = (email: string | null | undefined): boolean =>
  ALL_ADMIN_EMAILS.includes(email ?? "");

/** ניהול סוכנים — אמיר בלבד */
export const isFullAdmin = (email: string | null | undefined): boolean =>
  FULL_ADMIN_EMAILS.includes(email ?? "");
