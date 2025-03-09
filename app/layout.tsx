import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NostrProvider } from '@/contexts/nostr-context'
import { CollectionsProvider } from "@/contexts/collections-context"
import { NDKProvider } from "@/contexts/ndk-context"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "vermi",
  description: "A Vermi Love Story",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NostrProvider>
            <NDKProvider>
              <CollectionsProvider>
                {children}
              </CollectionsProvider>
            </NDKProvider>
          </NostrProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
