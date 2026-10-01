"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/select";
import { adminPageSizes, defaultAdminPageSize, paginationNumbers, paginationState } from "@/lib/admin/pagination";

export function useTablePagination<T>(items: readonly T[], resetKey = "") {
  const [state, setState] = useState({ page: 0, pageSize: defaultAdminPageSize, resetKey });
  const bounds = paginationState(items.length, state.resetKey === resetKey ? state.page : 0, state.pageSize);
  if (state.resetKey !== resetKey || state.page !== bounds.page) setState({ ...state, page: bounds.page, resetKey });
  return {
    rows: items.slice(bounds.start, bounds.end), page: bounds.page, pageSize: state.pageSize, total: items.length,
    onPageChange: (page: number) => setState({ ...state, page, resetKey }),
    onPageSizeChange: (pageSize: number) => setState({ page: 0, pageSize, resetKey }),
  };
}

type Props = { label: string; total: number; page: number; pageSize: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void; disabled?: boolean };
export function AdminPagination({ label, total, page, pageSize, onPageChange, onPageSizeChange, disabled = false }: Props) {
  const bounds = paginationState(total, page, pageSize);
  return <nav className="admin-pagination" aria-label={`${label} pagination`}>
    <div className="admin-pagination-summary"><p aria-live="polite" aria-atomic="true">{total ? `${bounds.start + 1}–${bounds.end} of ${total}` : "0 results"}</p><div className="admin-pagination-size"><span>Rows per page</span><Select label={`${label} rows per page`} value={String(pageSize)} disabled={disabled} onValueChange={value => onPageSizeChange(Number(value))} options={adminPageSizes.map(size => ({ value: String(size), label: String(size) }))}/></div></div>
    <div className="admin-pagination-pages"><button type="button" className="admin-button" disabled={disabled || bounds.page === 0} onClick={() => onPageChange(bounds.page - 1)}><ChevronLeft size={14}/> Previous</button>{paginationNumbers(bounds.page, bounds.pages).map((number, index) => number === "gap" ? <span className="admin-pagination-gap" key={`gap-${index}`} aria-hidden="true">…</span> : <button type="button" className="admin-button admin-pagination-number" key={number} aria-label={`Page ${number + 1}`} aria-current={number === bounds.page ? "page" : undefined} disabled={disabled} onClick={() => onPageChange(number)}>{number + 1}</button>)}<button type="button" className="admin-button" disabled={disabled || bounds.page >= bounds.pages - 1} onClick={() => onPageChange(bounds.page + 1)}>Next <ChevronRight size={14}/></button></div>
  </nav>;
}
