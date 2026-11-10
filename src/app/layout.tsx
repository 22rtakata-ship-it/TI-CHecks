import type { Metadata } from "next";
import "@/styles/globals.css";
export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  title: "TI Log — Diário de atividades",
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
