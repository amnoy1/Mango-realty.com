import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mango Realty | נדל\"ן יוקרה באזורי הביקוש",
    template: "%s | Mango Realty",
  },
  description: "מנגו ריאלטי — משרד תיווך נדל\"ן מוביל באזורי הביקוש בישראל. דירות, בתים, נדל\"ן מסחרי וקרקעות. סוכן AI אישי לכל קונה.",
  metadataBase: new URL("https://mango-realty.com"),
  openGraph: {
    siteName: "Mango Realty",
    locale: "he_IL",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
