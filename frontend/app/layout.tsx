import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FHE RaceTrack - Encrypted Horse Racing DApp",
  description: "A privacy-preserving horse racing platform built with Zama FHEVM",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      </head>
      <body className="antialiased bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <main className="flex flex-col max-w-7xl mx-auto px-4 py-8">
          <nav className="flex w-full justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏇 FHE RaceTrack
            </h1>
          </nav>
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}

