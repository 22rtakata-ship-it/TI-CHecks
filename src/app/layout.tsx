import type { Metadata } from "next";
import "@/styles/globals.css";
export const metadata: Metadata = {
  icons: {
    icon: { url: "/icon.svg?v=0.1.4", type: "image/svg+xml", sizes: "any" },
  },
  title: "TI Diário — Diário de atividades",
  description: "Organização e acompanhamento das atividades de TI.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
