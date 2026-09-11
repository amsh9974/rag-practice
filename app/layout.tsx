import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Innoligo M365 Licence & Cost Optimiser",
  description:
    "Find out how much your Microsoft 365 licences are costing you in waste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="antialiased">{children}</body>
    </html>
  );
}
