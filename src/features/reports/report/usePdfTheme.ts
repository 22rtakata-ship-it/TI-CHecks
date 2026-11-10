import { useEffect, useState } from "react";
import type { PdfTheme } from "./types";

export function usePdfTheme() {
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>("light");
  const [customPdfTheme, setCustomPdfTheme] = useState(false);
  useEffect(() => {
    if (customPdfTheme) return;
    const root = document.documentElement;
    const followTheme = () =>
      setPdfTheme(root.dataset.theme === "dark" ? "dark" : "light");
    followTheme();
    const observer = new MutationObserver(followTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [customPdfTheme]);

  function selectPdfTheme(theme: PdfTheme) {
    setCustomPdfTheme(true);
    setPdfTheme(theme);
  }
  return { pdfTheme, selectPdfTheme };
}
