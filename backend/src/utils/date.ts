/**
 * Date handling strategy for MiniLedger:
 * - All loan due dates are normalized and stored as UTC calendar dates (midnight: 00:00:00.000Z).
 * - A loan is classified as "OVERDUE" if and only if:
 *     status === 'PENDING' AND dueDate < startOfTodayUTC
 * - A loan due on today's calendar date is considered pending/due today, NOT overdue.
 * - This provides deterministic, timezone-safe calendar date comparisons.
 */

export function getStartOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export function parseDueDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
  }

  // Handle YYYY-MM-DD or ISO strings
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date format');
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0));
}

export function isLoanOverdue(dueDate: Date | string, status: string): boolean {
  if (status === 'REPAID') {
    return false;
  }
  const dateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const startOfToday = getStartOfTodayUTC();
  return dateObj.getTime() < startOfToday.getTime();
}

export function formatDateReadable(dateInput: Date | string): string {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
