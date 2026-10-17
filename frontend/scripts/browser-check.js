async (page) => {
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const results = [];
  const pass = (name) => results.push(name);
  const close = async () => {
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  };
  const open = async () => {
    await page.locator('.care-card').first().click();
  };
  const role = async (value) => {
    if (await page.locator('dialog[open]').count()) await close();
    await page.getByRole('combobox', { name: 'Demo role' }).selectOption(value);
  };
  if (await page.locator('dialog[open]').count()) await close();
  await page.getByRole('button', { name: 'Reset fictional demo' }).click();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  const action = 'Record how you are feeling in your recovery journal.';
  await page.getByRole('button', { name: `Report complete: ${action}`, exact: true }).click();
  assert(
    (await page
      .getByRole('button', { name: `Correct report: ${action}`, exact: true })
      .getAttribute('aria-pressed')) === 'true',
    'Completion not saved',
  );
  await page.getByRole('button', { name: `Correct report: ${action}`, exact: true }).click();
  await page.getByRole('button', { name: `Report complete: ${action}`, exact: true }).click();
  await page.reload();
  assert(
    (await page.getByRole('button', { name: `Correct report: ${action}`, exact: true }).count()) ===
      1,
    'Re-report/reload failed',
  );
  pass('Checklist save, correction, re-report and reload persistence');
  await open();
  await page
    .getByRole('textbox', { name: 'Message Recovery companion' })
    .fill('What does my plan say about my journal?');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  assert((await page.getByText(/Approved-plan excerpt/).count()) > 0, 'Source reply absent');
  await page.getByRole('button', { name: 'View approved source', exact: true }).click();
  assert(
    (await page.getByRole('heading', { name: 'Supporting instruction' }).count()) === 1,
    'Source absent',
  );
  pass('Companion quotes approved source with visible provenance');
  await page.getByRole('button', { name: 'Conversations', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Message Recovery companion' })
    .fill('Can you change my dose?');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await page.getByRole('button', { name: 'Contact care team', exact: true }).last().click();
  await page.getByRole('button', { name: 'Prepare summary from this AI conversation' }).click();
  const summary = page.getByRole('textbox', {
    name: 'Review and edit exactly what will be shared',
  });
  assert(
    (await summary.inputValue()).includes('Can you change my dose?'),
    'Summary missing patient excerpt',
  );
  await summary.fill('Please clarify the approved recovery plan. I reviewed this request.');
  const send = page.getByRole('button', { name: 'Approve & send request' });
  assert(await send.isDisabled(), 'Handoff sent without consent');
  await page.getByRole('checkbox').check();
  await send.click();
  assert(
    (await page.getByText('Saved in demo inbox', { exact: true }).count()) === 1,
    'Handoff missing',
  );
  pass('Outside-plan fallback, editable summary and explicit handoff consent');
  await role('doctor');
  await open();
  await page.getByRole('button', { name: 'Care-team inbox', exact: true }).click();
  await page.getByRole('button', { name: 'Acknowledge request' }).click();
  assert(
    (await page.getByText('Acknowledged in demo', { exact: true }).count()) === 1,
    'Acknowledgment absent',
  );
  pass('Doctor sees only approved handoff and records acknowledgement');
  await page.getByRole('button', { name: 'Conversations', exact: true }).click();
  await page.getByRole('button', { name: 'Jamie & Dr. Chen Private conversation' }).click();
  await page
    .getByRole('textbox', { name: 'Message Jamie & Dr. Chen' })
    .fill('PRIVATE-DOCTOR-PATIENT-ONLY');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await role('family');
  await open();
  assert(
    (await page.getByRole('button', { name: 'Jamie & Dr. Chen Private conversation' }).count()) ===
      0,
    'Family sees private doctor conversation',
  );
  assert(
    (await page.getByText('PRIVATE-DOCTOR-PATIENT-ONLY', { exact: true }).count()) === 0,
    'Family sees private content',
  );
  assert(
    (await page.getByRole('button', { name: 'Contact care team', exact: true }).count()) === 0,
    'Family sees patient handoff',
  );
  pass('Family private-conversation and handoff exclusion');
  await close();
  await page
    .getByRole('button', {
      name: 'Report complete: Record any questions about meals for your care team.',
      exact: true,
    })
    .click();
  assert(
    (await page.getByText(/Reported by Alex Morgan/).count()) > 0,
    'Family report attribution absent',
  );
  pass('Family completion attribution');
  for (const level of ['Basic', 'Support', 'Full']) {
    await role('doctor');
    await open();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'People & access', exact: true })
      .click();
    await page.getByLabel('Access for Alex Morgan').selectOption(level);
    const save = page.getByRole('button', { name: 'Save access', exact: true });
    if (await save.isEnabled()) await save.click();
    await role('family');
    await open();
    await page.getByRole('button', { name: 'Care plan', exact: true }).click();
    assert(
      ((await page.getByText('Shared plan requires Full access').count()) === 0) ===
        (level === 'Full'),
      `${level} plan visibility wrong`,
    );
    await page.getByRole('button', { name: 'Documents', exact: true }).click();
    assert(
      ((await page.getByText('Documents require Full access').count()) === 0) ===
        (level === 'Full'),
      `${level} document visibility wrong`,
    );
    await close();
    const checklist = await page
      .getByRole('button', { name: `Correct report: ${action}`, exact: true })
      .count();
    assert(checklist > 0 === (level !== 'Basic'), `${level} checklist visibility wrong`);
  }
  pass('Basic, Support and Full shared plan/document/checklist visibility');
  await role('patient');
  await open();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'People & access', exact: true })
    .click();
  await page.getByRole('button', { name: 'Revoke access', exact: true }).click();
  await role('family');
  assert(
    (await page.getByRole('button', { name: /^Everyday recovery Jamie/ }).count()) === 0,
    'Revocation failed',
  );
  pass('Patient has equal grant authority and family revocation removes space');
  await role('doctor');
  await open();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'People & access', exact: true })
    .click();
  await page.getByLabel('Access for Alex Morgan').selectOption('Full');
  await page.getByRole('button', { name: 'Restore selected access' }).click();
  await close();
  await page.getByRole('button', { name: 'Create care space', exact: true }).click();
  await page.getByLabel('Care-space name').fill('Personal recovery goals');
  await page.getByLabel('Recovery context').fill('Fictional demo of clinician-created guidance');
  await page.getByRole('button', { name: 'Create care space', exact: true }).last().click();
  await page.getByRole('button', { name: 'Build care plan' }).click();
  return { passed: results, next: 'Builder opened', url: page.url() };
}
