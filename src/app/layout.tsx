import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanças do Casal",
  description: "Finanças pessoais e do casal em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
