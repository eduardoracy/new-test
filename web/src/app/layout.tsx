import "./globals.css";
import { ReactNode } from "react";
import MagicLinkClient from "@/components/MagicLinkClient";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-neutral-50 text-neutral-900">
                <MagicLinkClient />
                <div className="max-w-6xl mx-auto p-4">{children}</div>
            </body>
        </html>
    );
}
