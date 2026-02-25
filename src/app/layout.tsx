import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, BottomNav } from "@/components/layout/Navigation";
import MeshGradient from "@/components/ui/MeshGradient";

export const metadata: Metadata = {
  title: "CineChive | Entertainment Archive",
  description: "Exquisite tracking for Movies, TV, and Music.",
};

import QueryProvider from "@/components/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased overflow-x-hidden selection:bg-vibe-violet/30 selection:text-white">
        <QueryProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            
            <main className="flex-1 relative pb-24 md:pb-0">
              <MeshGradient />
              <div className="relative z-10 w-full">
                {children}
              </div>
            </main>
            
            <BottomNav />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
