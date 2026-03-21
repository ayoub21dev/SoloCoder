import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة سولو كودر التعليمية",
  description: "المستقبل يبدأ من الكود",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${GeistSans.className} bg-background text-foreground antialiased selection:bg-white/10`}>
        {children}
      </body>
    </html>
  );
}
