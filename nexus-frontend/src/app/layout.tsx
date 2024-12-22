import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata = {
  title: "Solana AI Nexus",
  description: "A decentralized AI agent marketplace on Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.variable,
          manrope.variable,
          "bg-background text-foreground font-primary"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
