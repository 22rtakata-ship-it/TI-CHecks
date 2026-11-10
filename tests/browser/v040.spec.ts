import { test, expect, type Page } from "@playwright/test";
import { initialData } from "../../src/lib/seed";
import type { Activity, AppData, Incident } from "../../src/types/domain";

const store = "295 — Itatiba";
const activity: Activity = {
  id: "10000000-0000-4000-8000-000000000010",
  date: "2026-11-02",
  createdAt: "2026-11-02T13:00:00Z",
  store,
  title: "Registro anterior à atualização",
  category: "Computadores",
  sector: "Administrativo",
  equipment: "Estação ADM",
  problem: "Equipamento sem ligar",
  procedure: "Fonte verificada",
  result: "Aguardando peça",
  minutes: 10,
  notes: "Registro original preservado",
  status: "Aguardando terceiros",
  ticket: "INC4040",
  nextAction: "Substituir fonte",
  dependency: "Fornecedor",
  followUp: "2026-11-12",
  incidentId: "20000000-0000-4000-8000-000000000010",
  revisions: [],
};
function fixture(): AppData {
  const pending: Incident = {
    id: activity.incidentId!,
    title: "Troca da fonte ADM",
    store,
    openedOn: activity.date,
    status: "Aguardando terceiros",
    ticket: activity.ticket,
    events: [
      {
        id: "30000000-0000-4000-8000-000000000010",
        date: activity.date,
        at: activity.createdAt,
        text: activity.problem,
        status: "Aguardando terceiros",
        activityId: activity.id,
      },
    ],
  };
  return {
    ...initialData(),
    activities: [activity],
    incidents: [pending],
    evidence: [
      {
        id: "40000000-0000-4000-8000-000000000010",
        name: "antes.png",
        type: "image/png",
        size: 100,
        path: "fixture/antes.png",
        kind: "Antes",
        activityId: activity.id,
      },
    ],
  };
}
async function boot(page: Page, data = fixture()) {
  await page.addInitScript((snapshot) => {
    if (!localStorage.getItem("ti-log-demo-v1"))
      localStorage.setItem("ti-log-demo-v1", JSON.stringify(snapshot));
  }, data);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Diário de atividades", exact: true }),
  ).toBeVisible();
}
async function snapshot(page: Page): Promise<AppData> {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("ti-log-demo-v1")!),
  );
}

test("formulário rápido cria descrição e ocorrência vinculada sem chamado obrigatório", async ({
  page,
}) => {
  await boot(page, initialData());
  await page.getByLabel("Selecionar data").fill("2026-11-10");
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Nova atividade" });
  await dialog
    .getByLabel("Título da atividade *")
    .fill("TV do açougue desligada");
  await dialog.getByLabel("Categoria *").selectOption("TVs e monitores");
  await dialog.getByLabel("Status", { exact: true }).selectOption("Pendente");
  await dialog.getByLabel("Setor", { exact: true }).fill("Açougue");
  await dialog.getByLabel("Tempo gasto (minutos)").fill("10");
  await dialog
    .getByLabel("Descrição", { exact: true })
    .fill("TV religada. Aguardando verificação da alimentação.");
  expect(await dialog.locator("textarea").count()).toBe(1);
  const openIncident = dialog.getByRole("button", {
    name: "Abrir ocorrência para acompanhar",
    exact: true,
  });
  await expect(openIncident).toHaveAttribute("aria-pressed", "false");
  await openIncident.click();
  await expect(
    dialog.getByRole("button", { name: /Ocorrência será aberta ao salvar/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const saved = await snapshot(page);
  expect(saved.activities).toHaveLength(1);
  expect(saved.activities[0]).toMatchObject({
    title: "TV do açougue desligada",
    ticket: "",
    minutes: 10,
    description: "TV religada. Aguardando verificação da alimentação.",
  });
  expect(saved.incidents).toHaveLength(1);
  expect(saved.incidents[0].id).toBe(saved.activities[0].incidentId);
  expect(saved.incidents[0].events[0].text).toBe(
    saved.activities[0].description,
  );
});

test("edição preserva campos antigos; remoção confirmada persiste e restaura a mesma atividade", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  await page
    .getByRole("button", { name: `Editar ${activity.title}`, exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Editar atividade" });
  await expect(dialog.getByLabel("Descrição", { exact: true })).toHaveValue(
    /Equipamento sem ligar[\s\S]*Fonte verificada[\s\S]*Aguardando peça[\s\S]*Registro original preservado/,
  );
  await dialog
    .getByLabel("Descrição", { exact: true })
    .fill("Descrição consolidada após revisão.");
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  let saved = await snapshot(page);
  expect(saved.activities[0]).toMatchObject({
    ...activity,
    description: "Descrição consolidada após revisão.",
    revisions: [{ title: activity.title, status: activity.status }],
  });
  const evidence = saved.evidence;
  const incidents = saved.incidents;
  await page
    .getByRole("button", { name: `Editar ${activity.title}`, exact: true })
    .click();
  page.once("dialog", (d) => d.dismiss());
  await dialog
    .getByRole("button", { name: "Remover atividade", exact: true })
    .click();
  await expect(dialog).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await dialog
    .getByRole("button", { name: "Remover atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: activity.title, exact: true }),
  ).toHaveCount(0);
  saved = await snapshot(page);
  expect(saved.activities[0].deletedAt).toBeTruthy();
  expect(saved.activities).toHaveLength(1);
  expect(saved.incidents).toEqual(incidents);
  expect(saved.evidence).toEqual(evidence);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Atividades", exact: true }),
  ).toBeVisible();
  await page.getByText("Atividades removidas (1)", { exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: `Restaurar atividade ${activity.title}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: activity.title, exact: true }),
  ).toBeVisible();
  saved = await snapshot(page);
  expect(saved.activities[0].deletedAt).toBeUndefined();
  expect(saved.activities[0].id).toBe(activity.id);
  expect(saved.activities[0].description).toBe(
    "Descrição consolidada após revisão.",
  );
});

test("ocorrência exige relato e sincroniza resolução, status e reabertura sem criar outra atividade", async ({
  page,
}) => {
  await boot(page);
  await page.getByRole("button", { name: /^Ocorrências/ }).click();
  await page.getByRole("button", { name: "Acompanhar →", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Troca da fonte ADM" });
  await dialog.getByLabel("Data da atualização").fill("2026-11-10");
  await expect(dialog.getByLabel("Resolvido?", { exact: true })).toHaveValue(
    "Não",
  );
  await dialog.getByLabel("Resolvido?", { exact: true }).selectOption("Sim");
  await expect(dialog.getByLabel("Status", { exact: true })).toHaveValue(
    "Concluído",
  );
  await dialog
    .getByRole("button", { name: "Salvar atualização", exact: true })
    .click();
  await expect(dialog).toBeVisible();
  expect((await snapshot(page)).incidents[0].events).toHaveLength(1);
  await dialog
    .getByLabel("O que aconteceu? *")
    .fill("Fonte substituída e funcionamento validado.");
  await dialog
    .getByRole("button", { name: "Salvar atualização", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Acompanhar →", exact: true }).click();
  await expect(dialog.getByLabel("Resolvido?", { exact: true })).toHaveValue(
    "Sim",
  );
  await dialog.getByLabel("Resolvido?", { exact: true }).selectOption("Não");
  await expect(dialog.getByLabel("Status", { exact: true })).toHaveValue(
    "Em andamento",
  );
  await dialog
    .getByLabel("Status", { exact: true })
    .selectOption("Aguardando terceiros");
  await expect(dialog.getByLabel("Resolvido?", { exact: true })).toHaveValue(
    "Não",
  );
  await dialog.getByLabel("Data da atualização").fill("2026-11-11");
  await dialog
    .getByLabel("O que aconteceu? *")
    .fill("Falha voltou; solicitado retorno do fornecedor.");
  await dialog
    .getByRole("button", { name: "Salvar atualização", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const saved = await snapshot(page);
  expect(saved.activities).toHaveLength(1);
  expect(saved.incidents[0].status).toBe("Aguardando terceiros");
  expect(saved.incidents[0].events.map((event) => event.date)).toEqual([
    "2026-11-02",
    "2026-11-10",
    "2026-11-11",
  ]);
});

test("técnico objetivo usa N/A e separa ocorrências por situação real do mês", async ({
  page,
}) => {
  const data = fixture();
  data.activities.push({
    ...activity,
    id: "missing-fields",
    incidentId: undefined,
    title: "Atividade sem detalhes",
    sector: "",
    category: "Outros",
    ticket: "",
    problem: "",
    procedure: "",
    result: "",
    notes: "",
  });
  data.incidents.push({
    ...data.incidents[0],
    id: "resolved",
    title: "Impressora resolvida no mês",
    status: "Concluído",
    events: [
      {
        ...data.incidents[0].events[0],
        id: "resolved-start",
        activityId: undefined,
      },
      {
        id: "resolved-end",
        date: "2026-11-05",
        at: "2026-11-05T13:00:00Z",
        text: "Impressão validada",
        status: "Concluído",
      },
    ],
  });
  await boot(page, data);
  await page.getByRole("button", { name: "Relatórios", exact: true }).click();
  await page.getByLabel("Mês", { exact: true }).fill("2026-11");
  await page.getByLabel("Modelo", { exact: true }).selectOption("Técnico");
  await expect(page.getByLabel("Resumo executivo editável")).toHaveValue(
    /^No período de novembro de 2026,[\s\S]*\nTempo registrado[\s\S]*\nOcorrências resolvidas no mês: 1\.\nOcorrências pendentes ao final do período: 1\.$/,
  );
  const entry = page
    .locator(".report-entry")
    .filter({ hasText: "Atividade sem detalhes" });
  await expect(entry.locator("dt")).toHaveText([
    "Título",
    "Setor",
    "Categoria",
    "Chamado",
    "Status",
    "Descrição",
  ]);
  await expect(entry.locator("dd")).toHaveText([
    "Atividade sem detalhes",
    "N/A",
    "Outros",
    "N/A",
    "Aguardando terceiros",
    "N/A",
  ]);
  const completed = page.getByRole("region", {
    name: /Ocorrências concluídas no mês/,
  });
  const pending = page.getByRole("region", { name: /Ocorrências pendentes/ });
  await expect(completed).toContainText("Impressora resolvida no mês");
  await expect(completed).toContainText("05/11/2026");
  await expect(completed).not.toContainText("Troca da fonte ADM");
  await expect(pending).toContainText("Troca da fonte ADM");
  await expect(pending).toContainText("Aguardando terceiros");
  const left = (await completed.boundingBox())!;
  const right = (await pending.boundingBox())!;
  expect(right.x).toBeGreaterThan(left.x);
  expect(Math.abs(left.y - right.y)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const mobileLeft = (await completed.boundingBox())!;
  const mobileRight = (await pending.boundingBox())!;
  expect(mobileRight.y).toBeGreaterThan(mobileLeft.y);
});
