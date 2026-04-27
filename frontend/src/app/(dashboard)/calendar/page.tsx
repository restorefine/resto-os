"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MOCK_CONTENT_ITEMS, CLIENT_COLORS } from "@/lib/mock-data";

let FullCalendar: typeof import("@fullcalendar/react").default;
let dayGridPlugin: typeof import("@fullcalendar/daygrid").default;
let timeGridPlugin: typeof import("@fullcalendar/timegrid").default;
let interactionPlugin: typeof import("@fullcalendar/interaction").default;

const TYPE_ICONS: Record<string, string> = {
  post: "P",
  reel: "R",
  shoot: "S",
  upload: "U",
};

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [Cal, setCal] = useState<typeof FullCalendar | null>(null);

  useEffect(() => {
    Promise.all([
      import("@fullcalendar/react"),
      import("@fullcalendar/daygrid"),
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
    ]).then(([fc, dg, tg, ip]) => {
      FullCalendar = fc.default;
      dayGridPlugin = dg.default;
      timeGridPlugin = tg.default;
      interactionPlugin = ip.default;
      setCal(() => fc.default);
      setMounted(true);
    });
  }, []);

  const events = MOCK_CONTENT_ITEMS.map((item) => ({
    id: item.id,
    title: `[${TYPE_ICONS[item.type]}] ${item.clientName}: ${item.title}`,
    date: item.dueDate,
    backgroundColor: CLIENT_COLORS[item.clientId] ?? "#6B7280",
    borderColor: "transparent",
    textColor: "#ffffff",
    extendedProps: { item },
  }));

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Content Calendar"
        subtitle={`${MOCK_CONTENT_ITEMS.length} items scheduled`}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(CLIENT_COLORS).map(([clientId, color]) => {
          const client = MOCK_CONTENT_ITEMS.find((i) => i.clientId === clientId);
          if (!client) return null;
          return (
            <div key={clientId} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600">{client.clientName}</span>
            </div>
          );
        })}
        <div className="ml-4 flex gap-3 border-l border-gray-200 pl-4">
          {Object.entries(TYPE_ICONS).map(([type, icon]) => (
            <span key={type} className="text-[10px] text-gray-500 uppercase tracking-wide">
              [{icon}] {type}
            </span>
          ))}
        </div>
      </div>

      {!mounted && (
        <div className="h-96 bg-gray-50 border border-gray-200 animate-pulse" />
      )}

      {mounted && Cal && (
        <div className="border border-gray-200 [&_.fc-toolbar-title]:font-black [&_.fc-toolbar-title]:text-black [&_.fc-button]:!bg-black [&_.fc-button]:!border-black [&_.fc-button-active]:!bg-red-600 [&_.fc-button-active]:!border-red-600 [&_.fc-today-button]:!bg-red-600 [&_.fc-today-button]:!border-red-600">
          <Cal
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={events}
            height="auto"
            eventClick={(info) => {
              const { item } = info.event.extendedProps as { item: typeof MOCK_CONTENT_ITEMS[0] };
              alert(`${item.clientName}\n${item.title}\nDue: ${new Date(item.dueDate).toLocaleDateString("en-GB")}\nType: ${item.type}`);
            }}
            eventContent={(arg) => (
              <div className="truncate text-[11px] px-1 py-0.5 font-medium">
                {arg.event.title}
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
