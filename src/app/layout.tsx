import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Party Game - Board Game",
  description: "Multiplayer party board game with real-time updates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
