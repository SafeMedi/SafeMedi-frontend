const DATE_FORMAT_OPTIONS = { year: "numeric", month: "2-digit", day: "2-digit" } as const;

function normalizeDatePart(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = normalizeDatePart(date.getMonth() + 1);
  const day = normalizeDatePart(date.getDate());
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsedDate = new Date(year, month, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }
  return parsedDate;
}

export function formatDateLabel(value: string): string {
  const parsedDate = parseIsoDate(value);
  if (!parsedDate) {
    return "날짜를 선택해주세요";
  }
  return parsedDate.toLocaleDateString("ko-KR", DATE_FORMAT_OPTIONS);
}
