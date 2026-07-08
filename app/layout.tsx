import type { Metadata } from "next";
import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import { Analytics } from "@vercel/analytics/react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Mango Realty | נדל\"ן יוקרה באזורי הביקוש",
    template: "%s | Mango Realty",
  },
  description: "מנגו נדל\"ן — משרד תיווך נדל\"ן מוביל באזורי הביקוש בישראל. דירות, בתים, נדל\"ן מסחרי וקרקעות. סוכן AI אישי לכל קונה.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: "Mango Realty",
    locale: "he_IL",
    type: "website",
  },
  robots: { index: true, follow: true },
  other: {
    "geo.region": "IL",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Mango Realty",
  "alternateName": "מנגו נדל\"ן",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "description": "משרד תיווך נדל\"ן מוביל באזורי הביקוש בישראל. דירות, בתים, נדל\"ן מסחרי וקרקעות.",
  "areaServed": { "@type": "Country", "name": "Israel" },
  "address": { "@type": "PostalAddress", "addressCountry": "IL" },
  "sameAs": [
    "https://www.instagram.com/mangorealty",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ConditionalNavbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
