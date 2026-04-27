"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Lead, PipelineStage } from "@/lib/types";
import { LeadCard } from "./LeadCard";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  stage: PipelineStage;
  label: string;
  leads: Lead[];
  onAddLead: (stage: PipelineStage) => void;
  onLeadClick: (lead: Lead) => void;
}

const STAGE_COLORS: Record<PipelineStage, string> = {
  outreach: "bg-gray-400",
  meeting: "bg-blue-400",
  proposal: "bg-yellow-400",
  negotiation: "bg-orange-400",
  signed: "bg-green-400",
};

export function KanbanColumn({ stage, label, leads, onAddLead, onLeadClick }: KanbanColumnProps) {
  const total = leads.reduce((s, l) => s + l.value, 0);

  return (
    <div className="flex flex-col w-[270px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600">{label}</p>
          <span className="text-xs text-gray-400 font-semibold">{leads.length}</span>
        </div>
        {total > 0 && (
          <span className="text-xs font-bold text-gray-700 font-mono">
            £{total.toLocaleString("en-GB")}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[400px] space-y-2.5 rounded-xl p-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-red-50 border-2 border-dashed border-red-200" : "bg-gray-100/50"
            }`}
          >
            {leads.map((lead, i) => (
              <LeadCard key={lead.id} lead={lead} index={i} onClick={onLeadClick} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add button */}
      <button
        onClick={() => onAddLead(stage)}
        className="mt-2.5 flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
      >
        <Plus size={13} />
        Add lead
      </button>
    </div>
  );
}
