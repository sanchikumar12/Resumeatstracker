import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS Resume Score Checker & Formatting Auditor",
  description: "Scan your resume against any job description. Instantly identify missing keywords, layout parsing issues (columns, tables), and semantic match score to beat the Applicant Tracking System.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
