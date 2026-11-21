import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VERIMIND AI // Cognitive Ledger & Authenticity Engine",
  description: "Zero-Spyware Proof-of-Understanding & Cognitive Authenticity Engine for Higher Education & Bootcamps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-alabaster text-ink-primary antialiased selection:bg-stone selection:text-ink-primary">
        {children}
      </body>
    </html>
  );
}
