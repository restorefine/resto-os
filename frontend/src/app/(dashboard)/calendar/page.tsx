"use client";

import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { Client } from "@/lib/types";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import { PageHeader } from "@/components/layout/PageHeader";

function AddClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const createClient = useCreateClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pkg, setPkg] = useState("Social Growth");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = await createClient.mutateAsync({
      name,
      email,
      package: pkg,
      monthlyValue: 0,
      invoiceDay: 1,
      assignedTo: "",
    });
    onCreated(client);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Add New Client</h2>
          <p className="text-sm text-gray-400 mt-0.5">Create a client and start planning their content</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Client Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Kelvin Kitchen"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E01E1E] focus:ring-2 focus:ring-[#E01E1E]/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E01E1E] focus:ring-2 focus:ring-[#E01E1E]/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Package</label>
            <input
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
              placeholder="Social Growth"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#E01E1E] focus:ring-2 focus:ring-[#E01E1E]/20 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClient.isPending}
              className="flex-1 rounded-lg bg-[#E01E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B01515] disabled:opacity-60 transition-colors"
            >
              {createClient.isPending ? "Creating…" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { data: clients = [], isLoading } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Content Calendar"
        subtitle={selectedClient ? `Viewing: ${selectedClient.name}` : "Select a client to view their calendar"}
      />

      <div className="flex flex-1 gap-6 min-h-0 mt-2">
        {/* Left: Client list */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-[#E01E1E] focus:ring-2 focus:ring-[#E01E1E]/20 transition-all"
            />
          </div>

          {/* Add client button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-500 hover:border-[#E01E1E] hover:text-[#E01E1E] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Client
          </button>

          {/* Client list */}
          <div className="flex flex-col gap-1 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No clients found</p>
              </div>
            ) : (
              filtered.map((client) => {
                const active = client.id === selectedClientId;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={[
                      "w-full flex flex-col items-start rounded-xl px-3 py-3 text-left transition-all",
                      active
                        ? "bg-[#E01E1E] text-white shadow-sm"
                        : "bg-white border border-gray-100 text-gray-800 hover:border-gray-200 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <span className="text-sm font-semibold leading-tight">{client.name}</span>
                    <span className={`text-[11px] mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>
                      {client.package}
                    </span>
                    <span
                      className={[
                        "mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                        active
                          ? "bg-white/20 text-white"
                          : client.status === "active"
                            ? "bg-green-100 text-green-700"
                            : client.status === "paused"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {client.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Calendar */}
        <div className="flex-1 min-w-0 overflow-y-auto pb-6">
          {!selectedClientId ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">No client selected</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Choose a client from the list on the left to view and plan their content calendar.
              </p>
            </div>
          ) : (
            <CalendarGrid key={selectedClientId} initialPosts={[]} clientId={selectedClientId} />
          )}
        </div>
      </div>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onCreated={(client) => setSelectedClientId(client.id)}
        />
      )}
    </div>
  );
}
