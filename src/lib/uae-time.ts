export function getDubaiDate(offsetDays: number, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays))
    .toISOString()
    .slice(0, 10);
}

export function isValidUaeMobile(phone: string): boolean {
  return /^\+9715\d{8}$/.test(phone);
}
