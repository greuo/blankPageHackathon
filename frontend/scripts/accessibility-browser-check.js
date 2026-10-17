async (page) => {
  const opening = page.getByRole('button', { name: 'Open my companion', exact: true });
  if (await opening.isVisible()) await opening.click();

  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const checks = [];
  const violations = [];
  if (await page.locator('dialog[open]').count())
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Reset fictional demo' }).click();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.addScriptTag({ path: 'frontend/node_modules/axe-core/axe.min.js' });
  for (const width of [1440, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    const geometry = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert(geometry.scroll <= geometry.viewport, `Horizontal overflow at ${width}`);
    const scan = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
      });
      return result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
      }));
    });
    violations.push(...scan.map((v) => ({ width, ...v })));
    checks.push(`${width}px: no page overflow; axe scan executed`);
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    if (width === 1440 || width === 375)
      await page.screenshot({
        path: `frontend/output/playwright/${width === 1440 ? 'desktop' : 'mobile'}.png`,
        fullPage: true,
      });
  }
  await page.getByRole('button', { name: /^Everyday recovery Jamie/ }).click();
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('Tab');
    assert(
      await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)),
      'Keyboard focus escaped dialog',
    );
  }
  checks.push('Native dialog trapped 18 Tab presses');
  const modalOverflow = await page
    .getByRole('dialog')
    .evaluate((e) => ({ scroll: e.scrollWidth, width: e.clientWidth }));
  assert(modalOverflow.scroll <= modalOverflow.width, 'Dialog overflow at mobile');
  const modalScan = await page.evaluate(async () => {
    const r = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
    }));
  });
  violations.push(...modalScan.map((v) => ({ width: '375 modal', ...v })));
  await page.screenshot({
    path: 'frontend/output/playwright/conversation-mobile.png',
    fullPage: true,
  });
  await page.keyboard.press('Escape');
  assert((await page.locator('dialog[open]').count()) === 0, 'Dialog escape failed');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert(
    await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    'Reduced motion not emulated',
  );
  await page
    .getByRole('button', {
      name: 'Report complete: Record how you are feeling in your recovery journal.',
      exact: true,
    })
    .click();
  const motion = await page
    .locator('.check-control.checked')
    .first()
    .evaluate((e) => ({
      pressed: e.getAttribute('aria-pressed'),
      strokes: Array.from(e.querySelectorAll('i')).map((i) => getComputedStyle(i).opacity),
      animation: getComputedStyle(e).animationName,
    }));
  assert(
    motion.pressed === 'true' && motion.strokes.every((x) => x === '0'),
    'Reduced-motion static state incorrect',
  );
  checks.push('Reduced motion: static check visible, no accent-stroke motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page
    .getByRole('button', {
      name: 'Correct report: Record how you are feeling in your recovery journal.',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', {
      name: 'Report complete: Record how you are feeling in your recovery journal.',
      exact: true,
    })
    .click();
  checks.push('Standard completion sequence exercised');
  return { checks, violations };
}
