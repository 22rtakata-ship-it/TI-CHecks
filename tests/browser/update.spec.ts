import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { initialData } from "../../src/lib/seed";
import { today } from "../../src/lib/date";
import type { AppData, Activity } from "../../src/types/domain";
const store = "295 — Itatiba";
function fixture(): AppData {
  const date = `${today().slice(0, 7)}-01`;
  const activity: Activity = {
    id: "10000000-0000-4000-8000-000000000001",
    title: "Diagnóstico de celular",
    store,
    date,
    createdAt: date + "T12:00:00Z",
    sector: "TI",
    category: "Celulares",
    equipment: "Celular",
    problem: "Solicitação",
    procedure: "Verificação",
    result: "Concluído",
    minutes: 672,
    status: "Concluído",
    ticket: "1233542",
    nextAction: "",
    dependency: "",
    followUp: "",
    notes: "",
    incidentId: "20000000-0000-4000-8000-000000000002",
    revisions: [],
  };
  return {
    ...initialData(),
    activities: [
      activity,
      {
        ...activity,
        id: "30000000-0000-4000-8000-000000000003",
        store: "178 — Indaiatuba",
        title: "Atividade de outra loja",
        incidentId: undefined,
        minutes: 10,
      },
    ],
    incidents: [
      {
        id: activity.incidentId!,
        store,
        title: "Ocorrência criada incorretamente",
        openedOn: date,
        status: "Pendente",
        ticket: "1233542",
        events: [
          {
            id: "40000000-0000-4000-8000-000000000004",
            date,
            at: date + "T12:00:00Z",
            status: "Pendente",
            text: "Registro de validação",
            activityId: activity.id,
          },
        ],
      },
    ],
    evidence: [
      {
        id: "50000000-0000-4000-8000-000000000005",
        name: "evidencia-preservada.png",
        type: "image/png",
        size: 10,
        path: "fixture/private.png",
        kind: "Antes",
        incidentId: activity.incidentId,
      },
    ],
  };
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (data) => localStorage.setItem("ti-log-demo-v1", JSON.stringify(data)),
    fixture(),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Diário de atividades", exact: true }),
  ).toBeVisible();
});
test("busca pelo chamado normalizado e categoria Celulares disponível", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  await page
    .getByLabel("Pesquisar atividades", { exact: true })
    .fill("#123-3542");
  await expect(
    page.getByRole("heading", { name: "Diagnóstico de celular", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atividade de outra loja", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Pesquisar atividades", { exact: true })
    .fill("99999999");
  await expect(
    page.getByText("Nenhuma atividade encontrada", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Diagnóstico de celular", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  await expect(
    page
      .getByLabel("Categoria *", { exact: true })
      .locator("option")
      .filter({ hasText: "Celulares" }),
  ).toHaveCount(1);
});
test("remoção confirma, preserva vínculos e permite restaurar", async ({
  page,
}) => {
  await page.getByRole("button", { name: /^Ocorrências/ }).click();
  await page.getByRole("button", { name: "Acompanhar →", exact: true }).click();
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Remover ocorrência", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Remover ocorrência", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Ocorrência criada incorretamente",
      exact: true,
    }),
  ).toHaveCount(0);
  let stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ti-log-demo-v1")!),
  );
  expect(stored.incidents[0].deletedAt).toBeTruthy();
  expect(stored.activities).toHaveLength(2);
  expect(stored.evidence).toHaveLength(1);
  expect(stored.incidents[0].events).toHaveLength(1);
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Diagnóstico de celular", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^Ocorrências/ }).click();

  await page.getByRole("checkbox", { name: /Mostrar removidas/ }).check();
  await page
    .getByRole("button", { name: "Ver histórico →", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restaurar ocorrência", exact: true })
    .click();
  stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ti-log-demo-v1")!),
  );
  expect(stored.incidents[0].deletedAt).toBeUndefined();
  await page.getByRole("checkbox", { name: /Mostrar removidas/ }).uncheck();
  await expect(
    page.getByRole("heading", {
      name: "Ocorrência criada incorretamente",
      exact: true,
    }),
  ).toBeVisible();
});
test("dashboard e relatório exibem horas; PDF escuro e claro mantêm contraste", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByText("11 h 12 min", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("672 min", { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("button", { name: "Relatórios", exact: true }).click();
  await expect(page.getByLabel("Resumo executivo editável")).toHaveValue(
    /11 h 12 min/,
  );
  await page.getByLabel("Tema do PDF", { exact: true }).selectOption("dark");
  await page.emulateMedia({ media: "print" });
  let colors = await page.locator("article.report").evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  }));
  expect(colors.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(colors.background).not.toBe("rgb(255, 255, 255)");
  expect(colors.color).not.toBe("rgb(0, 0, 0)");
  const dark = await page.pdf({
    path: "/tmp/ti-log-report-dark.pdf",
    format: "A4",
    printBackground: true,
  });
  expect(dark.subarray(0, 4).toString()).toBe("%PDF");
  await page.emulateMedia({ media: "screen" });
  await page.getByLabel("Tema do PDF", { exact: true }).selectOption("light");
  await page.emulateMedia({ media: "print" });
  colors = await page.locator("article.report").evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  }));
  expect(colors.background).toBe("rgb(255, 255, 255)");
  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  expect(colors.color).not.toBe("rgb(255, 255, 255)");
  const light = await page.pdf({
    path: "/tmp/ti-log-report-light.pdf",
    format: "A4",
    printBackground: true,
  });
  expect(light.subarray(0, 4).toString()).toBe("%PDF");
  await page.emulateMedia({ media: "screen" });
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar XLSX", exact: true })
    .click();
  const download = await downloading;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await download.path())!);
  const sheet = workbook.getWorksheet("Atividades")!;
  expect(String(sheet.getRow(1).getCell(11).value).toLowerCase()).toMatch(
    /hora/,
  );
  expect(Number(sheet.getCell("K2").value)).toBeCloseTo(11.2);
});
