import { test, expect, type Locator, type Page } from "@playwright/test";

async function dragSelectionOutside(page: Page, input: Locator) {
  await input.scrollIntoViewIfNeeded();
  const bounds = await input.boundingBox();
  expect(bounds).not.toBeNull();
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(bounds!.x + bounds!.width - 12, y);
  await page.mouse.down();
  await page.mouse.move(4, y, { steps: 12 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Diário de atividades", exact: true }),
  ).toBeVisible();
});

test("selecionar o título e soltar fora preserva a atividade; fechamento intencional e foco continuam funcionando", async ({
  page,
}) => {
  const open = page.getByRole("button", {
    name: "Nova atividade",
    exact: true,
  });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Nova atividade" });
  const title = dialog.getByLabel("Título da atividade *");
  await title.fill("Religamento das TVs do açougue");
  await dragSelectionOutside(page, title);
  await expect(dialog).toBeVisible();
  await expect(title).toHaveValue("Religamento das TVs do açougue");

  await page.mouse.click(4, 4);
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();

  await open.click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();

  await open.click();
  const close = dialog.getByRole("button", { name: "Fechar", exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Salvar atividade", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await close.click();
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
});

test("o mesmo arraste preserva os campos do modelo de checklist", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Checklists", exact: true }).click();
  await page.getByRole("button", { name: "Novo modelo", exact: false }).click();
  const dialog = page.getByRole("dialog", { name: "Novo checklist" });
  const name = dialog.getByLabel("Nome *", { exact: true });
  await name.fill("Verificação de celulares");
  await dialog.getByLabel("Qua", { exact: true }).check();
  await dragSelectionOutside(page, name);
  await expect(dialog).toBeVisible();
  await expect(name).toHaveValue("Verificação de celulares");
  await expect(dialog.getByLabel("Qua", { exact: true })).toBeChecked();

  await page.mouse.click(4, 4);
  await expect(dialog).toHaveCount(0);
});

test("arrastar ou cancelar um gesto de toque no backdrop não fecha o formulário", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Nova atividade", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Nova atividade" });
  const title = dialog.getByLabel("Título da atividade *");
  await title.fill("Suporte ao usuário");
  const backdrop = page.locator(".overlay");
  const pointer = {
    pointerId: 2,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    clientX: 4,
    clientY: 4,
  };
  await backdrop.dispatchEvent("pointerdown", pointer);
  await backdrop.dispatchEvent("pointermove", { ...pointer, clientY: 40 });
  await backdrop.dispatchEvent("pointerup", { ...pointer, clientY: 4 });
  await backdrop.dispatchEvent("click", { clientX: 4, clientY: 4 });
  await expect(dialog).toBeVisible();
  await expect(title).toHaveValue("Suporte ao usuário");

  await backdrop.dispatchEvent("pointerdown", pointer);
  await backdrop.dispatchEvent("pointercancel", pointer);
  await backdrop.dispatchEvent("click", { clientX: 4, clientY: 4 });
  await expect(dialog).toBeVisible();
});
