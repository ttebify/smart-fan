import { expect, test } from '@playwright/test';

test('desktop renders and supports keyboard controls and object dragging', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas[data-engine]')).toBeVisible();
  await expect(page.locator('.tag')).toHaveCount(6);
  const person = page.getByRole('button', { name: 'Person', exact: true });
  await person.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.tag')).toHaveCount(7);
  await page.keyboard.press('Space');
  await expect(page.locator('.tag')).toHaveCount(8);
  const box = await person.boundingBox();
  if (!box) throw new Error('Person button has no bounds');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(640, 400, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.tag')).toHaveCount(9);
  for (const name of ['Turn faster through empty spaces', 'Show air direction']) {
    const control = page.getByRole('switch', { name });
    await expect(control).toBeChecked();
    await control.focus();
    await page.keyboard.press('Space');
    await expect(control).not.toBeChecked();
  }
  const slider = page.getByRole('slider', { name: 'How sure it must be' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('0.71');
  await page.getByRole('button', { name: 'Hide controls' }).click();
  await page.getByRole('button', { name: '+ Controls' }).click();
  await expect(slider).toBeVisible();
  expect(errors).toEqual([]);
});

test('phone controls open, operate and close without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('canvas[data-engine]')).toBeVisible();
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  const control = page.getByRole('switch', { name: 'Show air direction' });
  await expect(control).toBeVisible();
  await control.click();
  await expect(control).not.toBeChecked();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(control).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
