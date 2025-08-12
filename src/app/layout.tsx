import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataGreg",
  description: "Aggregate datasets and export to JSONL for fine-tuning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="backdrop-orbs" />
        <ThemeProvider>
          <TooltipProvider>
              {children}
              <footer className="text-center mt-16 py-8 border-t border-border flex flex-col items-center gap-4">
                <p className="text-muted-foreground">
                  Built with Next.js • Export to JSONL for OpenAI, Gemini, and more
                </p>
                <p className="text-muted-foreground flex items-center">
                    <Tooltip>
                    <TooltipTrigger asChild>
                  <Link href="https://github.com/rubynouille/datagreg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-x-1 hover:text-foreground">
                    <span className="font-bold">DataGreg</span> is open source.
                    <FaGithub className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View the source code on GitHub</p>
                  </TooltipContent>
                  </Tooltip>
                </p>
              </footer>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
