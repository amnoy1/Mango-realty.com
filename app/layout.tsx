import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: {
    default: "Mango Realty | נדל\"ן יוקרה באזורי הביקוש",
    template: "%s | Mango Realty",
  },
  description: "מנגו ריאלטי — משרד תיווך נדל\"ן מוביל באזורי הביקוש בישראל. דירות, בתים, נדל\"ן מסחרי וקרקעות. סוכן AI אישי לכל קונה.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app"),
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
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
