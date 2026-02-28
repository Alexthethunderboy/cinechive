import type { Metadata } from "next";
import "./globals.css";
import { Sidebar, BottomNav } from "@/components/layout/Navigation";
import MeshGradient from "@/components/ui/MeshGradient";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "CineChive | Cinematic Library",
  description: "Exquisite curation for Movies, TV, and Cinema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-vibe-violet/30 selection:text-white h-screen overflow-hidden">
        <QueryProvider>
          <div className="flex h-full">
            <Sidebar />

            <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24 md:pb-0">
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

