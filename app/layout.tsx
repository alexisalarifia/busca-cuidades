import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/register-sw";

export const metadata: Metadata = {
  title: "BuscaCiudades",
  description: "A pocket travel companion for Mexico City.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BuscaCiudades",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-paper text-ink antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
