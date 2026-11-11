import { test, expect, type Page } from "@playwright/test";
import { initialData } from "../../src/lib/seed";
import type { Activity, AppData, Status } from "../../src/types/domain";

const store = "295 — Itatiba";
const presetId = "10000000-0000-4000-8000-000000000014";
const prefix = "Máquina ADM";
const detail = "Cartazista fonte queimada";
const fullTitle = `${prefix} - ${detail}`;
const statuses: Status[] = [
  "Pendente",
  "Concluído",
  "Em andamento",
  "Aguardando terceiros",
];
function activity(index = 0): Activity {
  return {
    id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    date: "2026-11-11",
    createdAt: "2026-11-11T13:00:00Z",
    store,
    title: `Atividade ${statuses[index]}`,
    category: "Computadores",
    sector: "ADM",
    equipment: "Estação ADM",
    problem: "Descrição anterior",
    procedure: "Teste de alimentação",
    result: "Resultado anterior",
    notes: "Anotação preservada",
    status: statuses[index],
    ticket: `INC014${index}`,
    nextAction: "",
    dependency: "",
    followUp: "",
    revisions: [],
  };
}
function patternedData(): AppData {
  return {
    ...initialData(),
    titlePresets: [{ id: presetId, name: prefix }],
    activities: [
      {
        ...activity(),
        title: fullTitle,
        titlePresetId: presetId,
        titlePrefix: prefix,
        titleDetail: detail,
      },
    ],
  };
}
async function boot(page: Page, data: AppData = initialData()) {
  await page.addInitScript((snapshot) => {
    if (!localStorage.getItem("ti-log-demo-v1"))
      localStorage.setItem("ti-log-demo-v1", JSON.stringify(snapshot));
  }, data);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Diário de atividades", exact: true }),
  ).toBeVisible();
}
async function stored(page: Page): Promise<AppData> {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("ti-log-demo-v1")!),
  );
}
async function openActivity(page: Page, title = fullTitle) {
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  await page
    .getByRole("button", { name: `Editar ${title}`, exact: true })
    .click();
  return page.getByRole("dialog", { name: "Editar atividade", exact: true });
}

test("cadastra título padrão, impede duplicado e cria atividade/ocorrência pesquisáveis pelo título completo", async ({
  page,
}) => {
  await boot(page);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  const catalog = page.getByRole("region", {
    name: "Títulos padrão",
    exact: true,
  });
  await catalog.getByLabel("Nome do título padrão").fill("  Máquina   ADM  ");
  await catalog
    .getByRole("button", { name: "Adicionar título padrão", exact: true })
    .click();
  await expect(catalog.getByRole("status")).toHaveText(
    "Título padrão adicionado.",
  );
  await catalog.getByLabel("Nome do título padrão").fill("maquina ADM");
  await catalog
    .getByRole("button", { name: "Adicionar título padrão", exact: true })
    .click();
  await expect(catalog.getByRole("alert")).toContainText("Já existe");
  const presets = (await stored(page)).titlePresets!;
  expect(presets).toHaveLength(1);
  expect(presets[0].name).toBe(prefix);
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Nova atividade",
    exact: true,
  });
  await dialog
    .getByLabel("Título padrão", { exact: true })
    .selectOption(presets[0].id);
  await dialog
    .getByLabel("Complemento do título *", { exact: true })
    .fill(detail);
  await expect(
    dialog.getByRole("status", { name: "Título final", exact: true }),
  ).toContainText(fullTitle);
  await dialog.getByLabel("Número do chamado (opcional)").fill("INC014");
  await dialog
    .getByRole("button", {
      name: "Abrir ocorrência para acompanhar",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const data = await stored(page);
  expect(data.activities[0]).toMatchObject({
    title: fullTitle,
    titlePresetId: presets[0].id,
    titlePrefix: prefix,
    titleDetail: detail,
  });
  expect(data.incidents[0].title).toBe(fullTitle);
  expect(data.incidents[0].id).toBe(data.activities[0].incidentId);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Atividades", exact: true }),
  ).toBeVisible();
  for (const query of ["maquina adm", "Cartazista fonte", "INC014"]) {
    await page.getByLabel("Pesquisar atividades", { exact: true }).fill(query);
    await expect(
      page.getByRole("heading", { name: fullTitle, exact: true }),
    ).toBeVisible();
  }
});

test("renomear e remover modelo preserva o título salvo, os detalhes legados e sua edição", async ({
  page,
}) => {
  const data = patternedData();
  await boot(page, data);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  const catalog = page.getByRole("region", {
    name: "Títulos padrão",
    exact: true,
  });
  await catalog
    .getByRole("button", {
      name: `Editar título padrão ${prefix}`,
      exact: true,
    })
    .click();
  await catalog.getByLabel("Nome do título padrão").fill("Notebook ADM");
  await catalog
    .getByRole("button", { name: "Salvar título padrão", exact: true })
    .click();
  await expect(catalog.getByRole("status")).toHaveText(
    "Título padrão atualizado.",
  );
  let dialog = await openActivity(page);
  await expect(dialog.getByLabel("Título padrão", { exact: true })).toHaveValue(
    "saved-title-prefix",
  );
  await expect(dialog.getByLabel("Complemento do título *")).toHaveValue(
    detail,
  );
  await dialog
    .getByLabel("Descrição", { exact: true })
    .fill("Descrição após revisão.");
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  page.once("dialog", (d) => d.dismiss());
  await catalog
    .getByRole("button", {
      name: "Remover título padrão Notebook ADM",
      exact: true,
    })
    .click();
  expect((await stored(page)).titlePresets).toHaveLength(1);
  page.once("dialog", (d) => d.accept());
  await catalog
    .getByRole("button", {
      name: "Remover título padrão Notebook ADM",
      exact: true,
    })
    .click();
  await expect(catalog.getByRole("status")).toHaveText(
    "Título padrão removido.",
  );
  dialog = await openActivity(page);
  await expect(dialog.getByLabel("Título padrão", { exact: true })).toHaveValue(
    "saved-title-prefix",
  );
  await dialog
    .getByLabel("Status", { exact: true })
    .selectOption("Em andamento");
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const saved = await stored(page);
  expect(saved.titlePresets).toEqual([]);
  expect(saved.activities[0]).toMatchObject({
    ...data.activities[0],
    status: "Em andamento",
    description: "Descrição após revisão.",
    revisions: expect.any(Array),
  });
  expect(saved.activities[0].revisions).toHaveLength(2);
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByLabel("Título padrão", { exact: true })
      .locator("option"),
  ).toHaveText(["Sem título padrão"]);
});

test("atividade anterior sem metadados continua com título livre; limite não trunca o texto", async ({
  page,
}) => {
  const legacy = { ...activity(), title: fullTitle };
  const data = {
    ...initialData(),
    titlePresets: [{ id: presetId, name: prefix }],
    activities: [legacy],
  };
  await boot(page, data);
  let dialog = await openActivity(page);
  await expect(dialog.getByLabel("Título padrão", { exact: true })).toHaveValue(
    "",
  );
  await expect(dialog.getByLabel("Título da atividade *")).toHaveValue(
    fullTitle,
  );
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect((await stored(page)).activities[0].title).toBe(fullTitle);
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Nova atividade", exact: true });
  await dialog
    .getByLabel("Título padrão", { exact: true })
    .selectOption(presetId);
  await dialog.getByLabel("Complemento do título *").fill("x".repeat(180));
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("180 caracteres");
  await expect(dialog.getByLabel("Complemento do título *")).toHaveValue(
    "x".repeat(180),
  );
  expect((await stored(page)).activities).toHaveLength(1);
  await dialog
    .getByLabel("Complemento do título *")
    .fill("Título dentro do limite");
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
});

for (const theme of ["light", "dark"]) {
  test(`cartões distinguem os quatro status e copiam chamado sem abrir o registro — ${theme}`, async ({
    page,
  }) => {
    const data = initialData();
    data.activities = statuses.map((_, i) => activity(i));
    data.incidents = data.activities.map((a, i) => ({
      id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      title: `Ocorrência ${a.status}`,
      store,
      openedOn: a.date,
      ticket: a.ticket,
      status: a.status,
      events: [
        {
          id: `event-${i}`,
          date: a.date,
          at: a.createdAt,
          text: "Registro de validação",
          status: a.status,
        },
      ],
    }));
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("ti-log-theme", selectedTheme);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as unknown as { copiedTicket: string }).copiedTicket =
              value;
          },
        },
      });
    }, theme);
    await boot(page, data);
    await page.getByRole("button", { name: "Atividades", exact: true }).click();
    const expectedClasses = [
      "status-pending",
      "status-completed",
      "status-progress",
      "status-waiting",
    ];
    for (let i = 0; i < statuses.length; i++) {
      const card = page.locator(".activity-card").filter({
        has: page.getByRole("heading", {
          name: data.activities[i].title,
          exact: true,
        }),
      });
      await expect(card).toHaveClass(new RegExp(expectedClasses[i]));
      await expect(card.locator(".technical-status-badge")).toHaveText(
        statuses[i],
      );
      const color = await card.evaluate(
        (el) => getComputedStyle(el).borderLeftColor,
      );
      const [r, g, b] = color.match(/\d+/g)!.map(Number);
      if (i === 0) expect(r).toBeGreaterThan(Math.max(g, b));
      if (i === 1) expect(g).toBeGreaterThan(Math.max(r, b));
      if (i === 2) expect(Math.min(r, g)).toBeGreaterThan(b);
      if (i === 3) expect(b).toBeGreaterThan(Math.max(r, g));
    }
    const first = page
      .locator(".activity-card")
      .filter({ hasText: data.activities[0].title });
    await first
      .getByRole("button", { name: "Copiar chamado INC0140", exact: true })
      .click();
    await expect(first.getByRole("status")).toHaveText("Copiado");
    expect(
      await page.evaluate(
        () => (window as unknown as { copiedTicket: string }).copiedTicket,
      ),
    ).toBe("INC0140");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: /^Ocorrências/ }).click();
    for (let i = 0; i < statuses.length; i++) {
      const card = page.locator(".incident-card").filter({
        has: page.getByRole("heading", {
          name: `Ocorrência ${statuses[i]}`,
          exact: true,
        }),
      });
      await expect(card).toHaveClass(new RegExp(expectedClasses[i]));
    }
    const incident = page
      .locator(".incident-card")
      .filter({ hasText: "Ocorrência Pendente" });
    await incident
      .getByRole("button", { name: "Copiar chamado INC0140", exact: true })
      .click();
    await expect(incident.getByRole("status")).toHaveText("Copiado");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `/tmp/ti-diario-v014-cards-${theme}-mobile.png`,
      fullPage: true,
    });
  });
}

test("cópia informa falha e só confirma depois da resposta do clipboard", async ({
  page,
}) => {
  const data = {
    ...initialData(),
    activities: [activity(), { ...activity(1), ticket: "" }],
  };
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("blocked");
        },
      },
    }),
  );
  await boot(page, data);
  await page.getByRole("button", { name: "Atividades", exact: true }).click();
  expect(
    await page.getByRole("button", { name: /^Copiar chamado/ }).count(),
  ).toBe(1);
  const copy = page.getByRole("button", {
    name: "Copiar chamado INC0140",
    exact: true,
  });
  await copy.click();
  await expect(
    page.locator(".ticket-copy-control").getByRole("alert"),
  ).toContainText("Não foi possível copiar");
  await expect(page.getByText("Copiado", { exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    navigator.clipboard.writeText = () =>
      new Promise<void>((resolve) => {
        (window as unknown as { resolveCopy: () => void }).resolveCopy =
          resolve;
      });
  });
  await copy.click();
  await expect(copy).toBeDisabled();
  await expect(page.getByText("Copiado", { exact: true })).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { resolveCopy: () => void }).resolveCopy(),
  );
  await expect(page.getByText("Copiado", { exact: true })).toBeVisible();
  await expect(copy).toBeEnabled();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("título completo de 180 caracteres cabe na prévia, cartões e modal no celular", async ({
  page,
}) => {
  const data = initialData();
  data.titlePresets = [{ id: presetId, name: "X".repeat(100) }];
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page, data);
  await page.getByLabel("Selecionar data").fill("2026-11-11");
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "Nova atividade",
    exact: true,
  });
  await dialog
    .getByLabel("Título padrão", { exact: true })
    .selectOption(presetId);
  await dialog.getByLabel("Complemento do título *").fill("D".repeat(77));
  const preview = dialog.getByRole("status", {
    name: "Título final",
    exact: true,
  });
  expect(
    await preview.evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBeTruthy();
  await dialog
    .getByRole("button", {
      name: "Abrir ocorrência para acompanhar",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Salvar atividade", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const savedTitle = "X".repeat(100) + " - " + "D".repeat(77);
  expect((await stored(page)).activities[0].title).toBe(savedTitle);
  await expect(page.locator(".activity-card h3")).toHaveText(savedTitle);
  await expect(page.locator(".incident-card h3")).toHaveText(savedTitle);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Acompanhar →", exact: true }).click();
  dialog = page.getByRole("dialog", { name: savedTitle, exact: true });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBeTruthy();
  await expect(
    dialog.getByRole("button", { name: "Fechar", exact: true }),
  ).toBeVisible();
});

test("marca TI Diário, ícone e backup mantêm os registros existentes", async ({
  page,
}) => {
  const data = patternedData();
  await boot(page, data);
  await expect(page).toHaveTitle("TI Diário — Diário de atividades");
  await expect(page.locator(".brand")).toContainText("TI Diário");
  await expect(page.locator(".brand svg")).toBeVisible();
  expect(await page.locator(".brand-mark text").count()).toBe(0);
  const iconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(iconHref).toContain("icon.svg?v=0.1.4");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar backup JSON", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("ti-diario-backup.json");
  expect((await stored(page)).activities).toEqual(data.activities);
});
