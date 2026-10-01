export const adminPageSizes = [10, 20, 50] as const;
export const defaultAdminPageSize = 10;
export function paginationState(total: number, page: number, pageSize: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(0, page), pages - 1);
  const start = current * pageSize;
  return { page: current, pages, start, end: Math.min(start + pageSize, total) };
}
export function paginationNumbers(page: number, pages: number): (number | "gap")[] {
  const visible = Array.from(new Set([0, page - 1, page, page + 1, pages - 1])).filter(value => value >= 0 && value < pages).sort((a, b) => a - b);
  return visible.flatMap((value, index) => index && value - visible[index - 1] > 1 ? ["gap", value] : [value]) as (number | "gap")[];
}
