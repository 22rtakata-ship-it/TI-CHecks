import ExcelJS from "exceljs";
import { test, expect } from "@playwright/test";
test("diário, atividade rápida, persistência, ocorrência e checklist", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Diário de atividades", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Selecionar data").fill("2027-01-08");
  await expect(
    page.getByText("Checklist de coletores", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Checklist de balanças PDV", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  await page
    .getByLabel("Título da atividade *")
    .fill("Religamento das TVs do açougue");
  await page.getByLabel("Tempo gasto (minutos)").fill("10");
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Religamento das TVs do açougue",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Selecionar data").fill("2027-01-08");
  await expect(
    page.getByRole("heading", {
      name: "Religamento das TVs do açougue",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar Religamento das TVs do açougue" })
    .click();
  await page
    .getByLabel("Título da atividade *")
    .fill("TVs religadas e verificadas");
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "TVs religadas e verificadas",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preencher", exact: true })
    .first()
    .click();
  await page
    .getByLabel("A verificação foi executada?")
    .selectOption("Não concluído");
  await page
    .getByRole("button", { name: "Salvar checklist", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Justificativa obrigatória")
    .fill("Aguardando acesso ao setor");
  await page
    .getByRole("button", { name: "Salvar checklist", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Não concluído", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  await page.getByLabel("Título da atividade *").fill("Falha de placa-mãe PDV");
  await page.getByLabel("Status", { exact: true }).selectOption("Pendente");
  await page.getByLabel("Número do chamado (opcional)").fill("1233542");
  await page
    .getByRole("button", {
      name: "Abrir ocorrência para acompanhar",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await page.getByRole("button", { name: "Acompanhar →", exact: true }).click();
  await page.getByLabel("Data da atualização").fill("2027-01-10");
  await page.getByLabel("O que aconteceu? *").fill("Placa-mãe substituída");
  await page
    .getByRole("dialog")
    .getByLabel("Resolvido?", { exact: true })
    .selectOption("Sim");
  await page
    .getByRole("button", { name: "Salvar atualização", exact: true })
    .click();
  await page.getByLabel("Selecionar data").fill("2027-01-10");
  await expect(
    page.getByRole("heading", { name: "Falha de placa-mãe PDV", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Relatórios", exact: true }).click();
  await page.getByLabel("Mês", { exact: true }).fill("2027-01");
  await expect(
    page.getByRole("heading", {
      name: "Relatório de atividades de TI",
      exact: true,
    }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar XLSX", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("ti-diario-2027-01.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await download.path())!);
  expect(workbook.worksheets.map((s) => s.name)).toEqual([
    "Atividades",
    "Checklists",
    "Ocorrências",
    "Resumo",
  ]);
  expect(workbook.getWorksheet("Atividades")!.getCell("B2").value).toBe(
    "TVs religadas e verificadas",
  );
  expect(workbook.getWorksheet("Ocorrências")!.rowCount).toBe(2);
  await page.screenshot({ path: "/tmp/ti-log-report.png", fullPage: true });
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ path: "/tmp/ti-log-report.pdf", format: "A4" });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
});
test("navegação mobile e tema", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("heading", { name: "Diário de atividades", exact: true })
    .waitFor();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("button", { name: "Checklists", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Modelos de checklist", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Novo modelo", exact: false }).click();
  await page.getByLabel("Nome *", { exact: true }).fill("Rotina personalizada");
  await page.getByLabel("Seg", { exact: true }).check();
  await page.getByLabel("Qua", { exact: true }).check();
  await page
    .getByRole("button", { name: "Salvar modelo", exact: true })
    .click();
  await expect(
    page.getByText("Rotina personalizada", { exact: true }),
  ).toBeVisible();
});
