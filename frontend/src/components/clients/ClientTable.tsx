"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { Client, ClientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ArrowRight } from "lucide-react";

const STATUS_STYLES: Record<ClientStatus, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  churned: "bg-red-100 text-red-700",
};

const PROGRESS_BAR_FILL: Record<ClientStatus, string> = {
  active: "bg-green-500",
  paused: "bg-yellow-400",
  churned: "bg-gray-300",
};


function MonthlyProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: ClientStatus;
}) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", PROGRESS_BAR_FILL[status])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-bold tabular-nums w-[28px] text-right shrink-0",
        status === "active" ? "text-green-600" :
        status === "paused" ? "text-yellow-600" :
        "text-gray-400"
      )}>
        {pct}%
      </span>
    </div>
  );
}

interface ClientTableProps {
  clients: Client[];
}

export function ClientTable({ clients }: ClientTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [monthLabel, setMonthLabel] = useState("");
  useEffect(() => {
    setMonthLabel(new Date().toLocaleString("en-GB", { month: "short", year: "numeric" }));
  }, []);

  const staff = useMemo(
    () => ["all", ...Array.from(new Set(clients.map((c) => c.assignedTo)))],
    [clients]
  );

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (staffFilter !== "all" && c.assignedTo !== staffFilter) return false;
        if (globalFilter && !c.name.toLowerCase().includes(globalFilter.toLowerCase())) return false;
        return true;
      }),
    [clients, statusFilter, staffFilter, globalFilter]
  );

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => (
          <span className="flex items-baseline gap-2">
            Client
            <span className="text-[9px] font-normal normal-case tracking-normal text-gray-300">
              {monthLabel} progress
            </span>
          </span>
        ),
        cell: ({ row }) => {
          const ob = row.original.onboardingProgress ?? 0;
          const onboardingDone = ob >= 100;
          const stepLabel = row.original.currentStepLabel;
          return (
            <div className="min-w-[200px]">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{row.original.name}</p>
                {onboardingDone ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-[9px] font-bold text-green-600 uppercase tracking-wide shrink-0">
                    ✓ Ready
                  </span>
                ) : stepLabel ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-600 tracking-wide shrink-0">
                    {stepLabel}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-600 uppercase tracking-wide shrink-0">
                    Onboarding
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{row.original.email}</p>
              <MonthlyProgressBar
                progress={row.original.monthlyProgress}
                status={row.original.status}
              />
              <div className="mt-1.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", onboardingDone ? "bg-green-500" : "bg-amber-400")}
                    style={{ width: `${ob}%` }}
                  />
                </div>
                <span className={cn("text-[10px] font-bold tabular-nums w-[28px] text-right shrink-0", onboardingDone ? "text-green-500" : "text-amber-500")}>
                  {ob}%
                </span>
              </div>
            </div>
          );
        },
      },
      { accessorKey: "package", header: "Package", cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.package}</span>
      )},
      {
        accessorKey: "monthlyValue",
        header: "Monthly",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-gray-900">
            £{row.original.monthlyValue.toLocaleString("en-GB")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className={cn("inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-full", STATUS_STYLES[row.original.status])}>
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "invoiceDay",
        header: "Invoice Day",
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">Day {row.original.invoiceDay}</span>
        ),
      },
      {
        accessorKey: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600">
              {row.original.assignedTo[0]}
            </div>
            <span className="text-sm text-gray-700">{row.original.assignedTo}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/clients/${row.original.id}`); }}
            className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight size={14} />
          </button>
        ),
      },
    ],
    [router]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search clients..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-56 bg-white transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClientStatus | "all")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white text-gray-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
        <select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white text-gray-700"
        >
          {staff.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Team" : s}</option>
          ))}
        </select>
        <span className="ml-auto self-center text-xs text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-100 bg-gray-50/70">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "px-5 py-3 text-left text-[11px] tracking-widest uppercase text-gray-400 font-semibold select-none",
                      header.column.getCanSort() && "cursor-pointer hover:text-gray-700"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ChevronUp size={11} />}
                      {header.column.getIsSorted() === "desc" && <ChevronDown size={11} />}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/clients/${row.original.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4 text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-gray-400">
                  No clients match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
