import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadowbroker Turbo",
  description: "Promoting excellence in spreadsheet craftsmanship since 1987.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
