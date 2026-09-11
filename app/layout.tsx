import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "M365 License & Cost Optimizer",
  description:
    "Upload your Microsoft 365 tenant license mix and usage. Find inactive, duplicate, and over-specified licenses, and get a costed, verifiable savings report.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
