"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Lead } from "@/lib/types";
import { ArrowRight, User } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  index: number;
  onClick: (lead: Lead) => void;
}

export function LeadCard({ lead, index, onClick }: LeadCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(lead)}
          className={`bg-white rounded-xl border cursor-pointer transition-all select-none p-4 group ${
            snapshot.isDragging
              ? "border-red-300 shadow-lg rotate-1 scale-[1.02]"
              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <p className="text-sm font-bold text-gray-900 leading-tight">{lead.companyName}</p>
            <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" />
          </div>
          <p className="text-xl font-black text-gray-900 font-mono mb-3">
            £{lead.value.toLocaleString("en-GB")}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-500 leading-tight truncate max-w-[130px]">
              {lead.nextAction}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-black text-gray-600">
                {lead.assignedTo[0]}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
