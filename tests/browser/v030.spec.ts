import { test, expect } from "@playwright/test";
import { initialData } from "../../src/lib/seed";
import type {
  AppData,
  Activity,
  ChecklistTemplate,
} from "../../src/types/domain";
const store = "295 — Itatiba";
async function boot(page: import("@playwright/test").Page, data: AppData) {
  await page.addInitScript((snapshot) => {
    if (!localStorage.getItem("ti-log-demo-v1"))
      localStorage.setItem("ti-log-demo-v1", JSON.stringify(snapshot));
  }, data);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Diário de atividades", exact: true }),
  ).toBeVisible();
}
test("não aplicável fica fora da porcentagem e aparece em outra cor na barra", async ({
  page,
}) => {
  const data = initialData();
  data.templates = Array.from({ length: 9 }, (_, i) => ({
    ...data.templates[0],
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    name: `Rotina ${i + 1}`,
    active: false,
  }));
  data.executions = data.templates.map((t, i) => ({
    id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    templateId: t.id,
    name: t.name,
    date: "2026-11-02",
    store,
    status: i === 8 ? "Não se aplica" : "Concluído",
    reason: i === 8 ? "Sem operação neste dia" : "",
    notes: "",
  }));
  await boot(page, data);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByLabel("Mês do dashboard").fill("2026-11");
  const routines = page.getByRole("region", { name: "Checklists de rotina" });
  await expect(routines.getByText("100%", { exact: true })).toBeVisible();
  await expect(routines).toContainText("8 de 8 aplicáveis");
  const segment = routines.locator(".dashboard-checklist-bar .not-applicable");
  expect((await segment.boundingBox())!.width).toBeGreaterThan(0);
  const naColor = await segment.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  const doneColor = await routines
    .locator(".dashboard-checklist-bar .done")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(naColor).not.toBe(doneColor);
});
test("não preenchidos mostra a data e abre aquele dia no diário", async ({
  page,
}) => {
  const data = initialData();
  data.templates = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Checklist pendente de teste",
      description: "",
      active: true,
      recurring: false,
      weekdays: [],
      date: "2026-11-03",
      start: "",
      end: "",
    },
  ];
  await boot(page, data);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByLabel("Mês do dashboard").fill("2026-11");
  await page
    .getByRole("button", { name: "Não preenchidos: 1", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Não preenchidos",
    exact: true,
  });
  await expect(dialog.locator('time[datetime="2026-11-03"]')).toBeVisible();
  await expect(dialog).toContainText("Checklist pendente de teste");
  await dialog.getByRole("button", { name: "Ver dia", exact: true }).click();
  await expect(page.getByLabel("Selecionar data")).toHaveValue("2026-11-03");
  await expect(
    page.getByText("Checklist pendente de teste", { exact: true }),
  ).toBeVisible();
});
test("atividades de uma ocorrência já removida somem da busca mas outro registro com o mesmo chamado permanece", async ({
  page,
}) => {
  const data = initialData();
  data.incidents = [
    {
      id: "i",
      title: "Removida",
      store,
      openedOn: "2026-11-02",
      status: "Pendente",
      ticket: "INC2219456",
      deletedAt: "2026-11-08T12:00:00Z",
      events: [],
    },
  ];
  const activity: Activity = {
    id: "a",
    title: "Celular vinculado à removida",
    date: "2026-11-02",
    createdAt: "2026-11-02T12:00:00Z",
    store,
    sector: "TI",
    category: "Celulares",
    equipment: "",
    problem: "",
    procedure: "",
    result: "",
    status: "Pendente",
    ticket: "INC2219456",
    nextAction: "",
    dependency: "",
    followUp: "",
    notes: "",
    incidentId: "i",
    revisions: [],
  };
  data.activities = [
    activity,
    { ...activity, id: "b", title: "Intervenção vinculada à removida" },
    {
      ...activity,
      id: "c",
      title: "Atividade independente",
      incidentId: undefined,
    },
  ];
  await boot(page, data);
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  await page.getByLabel("Pesquisar atividades").fill("INC2219456");
  await expect(
    page.getByRole("heading", { name: "Atividade independente", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: activity.title, exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Intervenção vinculada à removida",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(1);
});
test("validades diárias editam sem duplicar, separam lojas e mostram evolução mensal", async ({
  page,
}) => {
  await boot(page, initialData());
  await page.getByLabel("Selecionar data").fill("2026-11-02");
  let box = page.getByRole("region", { name: "Validades do dia" });
  await box.getByLabel("Vencidas", { exact: true }).fill("10");
  await box.getByLabel("Em risco", { exact: true }).fill("6");
  await box.getByLabel("Não vinculados", { exact: true }).fill("0");
  await box
    .getByRole("button", { name: "Salvar validades", exact: true })
    .click();
  await expect(
    box.getByText("Validades salvas com sucesso.", { exact: true }),
  ).toBeVisible();
  await box.getByLabel("Vencidas", { exact: true }).fill("8");
  await box
    .getByRole("button", { name: "Atualizar validades", exact: true })
    .click();
  await expect(box.getByLabel("Vencidas", { exact: true })).toHaveValue("8");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ti-log-demo-v1")!).validityRecords
          .length,
    ),
  ).toBe(1);
  await page.getByLabel("Selecionar data").fill("2026-11-03");
  box = page.getByRole("region", { name: "Validades do dia" });
  await expect(box.getByLabel("Vencidas", { exact: true })).toHaveValue("");
  for (const [label, value] of [
    ["Vencidas", "3"],
    ["Em risco", "2"],
    ["Não vinculados", "1"],
  ])
    await box.getByLabel(label, { exact: true }).fill(value);
  await box
    .getByRole("button", { name: "Salvar validades", exact: true })
    .click();
  await expect(
    box.getByText("Validades salvas com sucesso.", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Selecionar loja", { exact: true })
    .selectOption("178 — Indaiatuba");
  box = page.getByRole("region", { name: "Validades do dia" });
  await expect(box.getByLabel("Vencidas", { exact: true })).toHaveValue("");
  for (const [label, value] of [
    ["Vencidas", "50"],
    ["Em risco", "40"],
    ["Não vinculados", "30"],
  ])
    await box.getByLabel(label, { exact: true }).fill(value);
  await box
    .getByRole("button", { name: "Salvar validades", exact: true })
    .click();
  await expect(
    box.getByText("Validades salvas com sucesso.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validades", exact: true }).click();
  await page.getByLabel("Mês das validades").fill("2026-11");
  await expect(
    page
      .getByRole("region", { name: "Vencidas", exact: true })
      .locator("strong"),
  ).toHaveText("50");
  await page.getByLabel("Selecionar loja", { exact: true }).selectOption(store);
  await expect(
    page
      .getByRole("region", { name: "Vencidas", exact: true })
      .locator("strong"),
  ).toHaveText("3");
  await expect(
    page.getByRole("region", { name: "Vencidas", exact: true }),
  ).toContainText("Redução de 5");
  const missing = page
    .getByRole("row")
    .filter({ has: page.locator('time[datetime="2026-11-04"]') });
  await expect(missing).toContainText("Não preenchido");
  await expect(missing.locator("td").first()).toHaveText("—");
  await expect(
    page.getByRole("img", { name: "Quantidade registrada em cada dia útil" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "/tmp/ti-log-validity-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("button", { name: "Abrir validades de 02/11/2026", exact: true })
    .click();
  await expect(page.getByLabel("Selecionar data")).toHaveValue("2026-11-02");
  await expect(page.getByLabel("Vencidas", { exact: true })).toHaveValue("8");
  await page.getByLabel("Selecionar data").fill("2026-11-07");
  await expect(
    page.getByText("Não há preenchimento previsto de validades neste dia.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar validades", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  const records = await page.evaluate(
    () => JSON.parse(localStorage.getItem("ti-log-demo-v1")!).validityRecords,
  );
  expect(records).toHaveLength(3);
});
