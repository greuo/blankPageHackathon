async (page) => {
  const opening = page.getByRole('button', { name: 'Skip intro', exact: true });
  if (await opening.isVisible()) await opening.click();
  await page.getByRole('combobox', { name: 'Demo role' }).waitFor({ state: 'visible' });

  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const passed = [];
  await page
    .locator('input[name=sourceFile]')
    .setInputFiles({
      name: 'unsupported.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Not a PDF'),
    });
  assert((await page.getByRole('alert').count()) > 0, 'Unsupported document was accepted');
  await page
    .locator('input[name=sourceFile]')
    .setInputFiles({
      name: 'fictional-source.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Record a question for the next fictional visit.'),
    });
  await page.getByLabel('Plan title', { exact: true }).fill('A personalized recovery companion');
  await page.getByRole('button', { name: 'Create line drafts' }).click();
  await page.getByRole('button', { name: 'Review instructions', exact: true }).click();
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T09:00`;
  });
  await page.getByLabel('Date and time', { exact: true }).fill(today);
  await page.getByRole('button', { name: 'Save draft & preview' }).click();
  assert(
    await page.getByRole('button', { name: 'Approve & publish v1' }).isDisabled(),
    'Publish does not require approval',
  );
  assert(
    (await page
      .locator('#checklist')
      .getByText('Record a question for the next fictional visit.', { exact: true })
      .count()) === 0,
    'Draft leaked to checklist',
  );
  await page.getByRole('checkbox', { name: /I have reviewed every instruction/ }).check();
  await page.getByRole('button', { name: 'Approve & publish v1' }).click();
  assert(
    (await page.getByText('1 approved instruction, with timing and sources preserved.').count()) ===
      1,
    'Publication failed',
  );
  passed.push(
    'Create care space, supported upload and rejected PDF, draft isolation, explicit clinician publication',
  );
  await page.getByRole('button', { name: 'Return to care space' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('combobox', { name: 'Demo role' }).selectOption('patient');
  assert(
    (await page
      .getByRole('button', {
        name: 'Report complete: Record a question for the next fictional visit.',
        exact: true,
      })
      .count()) === 1,
    'Patient checklist lacks published item',
  );
  passed.push('Published personalized instruction reaches patient checklist');
  await page.getByRole('button', { name: /^Personal recovery goals Fictional/ }).click();
  await page.getByRole('button', { name: 'Documents', exact: true }).click();
  assert(
    (await page.getByText('fictional-source.txt', { exact: true }).count()) === 1,
    'Source document absent',
  );
  await page.getByRole('button', { name: 'Read source', exact: true }).click();
  assert(
    (await page.locator('.document-text').textContent()) ===
      'Record a question for the next fictional visit.',
    'Document text incorrect',
  );
  passed.push('Uploaded document is scoped to its care space');
  await page.getByRole('button', { name: 'Conversations', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Message Recovery companion' });
  await input.fill('Retry this fictional question once');
  await page.evaluate(() => {
    window.__saveStorage = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException('Injected storage failure', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  assert(
    (await input.inputValue()) === 'Retry this fictional question once',
    'Message lost on save failure',
  );
  assert(
    (await page.getByRole('button', { name: 'Retry message' }).count()) === 1,
    'Retry state missing',
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = window.__saveStorage;
    delete window.__saveStorage;
  });
  await page.getByRole('button', { name: 'Retry message' }).click();
  assert(
    (await page
      .locator('.bubble')
      .getByText('Retry this fictional question once', { exact: true })
      .count()) === 1,
    'Message duplicated on retry',
  );
  passed.push('Failed message save preserves input and retries once');
  await page.keyboard.press('Escape');
  assert((await page.locator('dialog[open]').count()) === 0, 'Escape did not close dialog');
  passed.push('Native dialog Escape behavior');
  await page.getByRole('button', { name: 'Reset fictional demo' }).click();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  return { passed };
}
