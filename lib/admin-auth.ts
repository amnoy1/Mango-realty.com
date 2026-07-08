const ADMIN_EMAILS = ["amir@mango-realty.com", "dorsur76@gmail.com"];

export const isAdmin = (email: string | null | undefined): boolean =>
  ADMIN_EMAILS.includes(email ?? "");
