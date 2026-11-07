const CHECKLIST_PRIORITIES = [0.1, 1, 1.5, 2];

export function normalizeChecklistPriority (value) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 1;

  const match = CHECKLIST_PRIORITIES.find(priority => Math.abs(priority - parsed) < 0.001);
  return match === undefined ? 1 : match;
}

export { CHECKLIST_PRIORITIES };
