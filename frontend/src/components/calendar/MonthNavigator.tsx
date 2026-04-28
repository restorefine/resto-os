"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Props {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({ currentDate, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        aria-label="Previous month"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <h2 className="min-w-[160px] text-center text-lg font-bold text-gray-900">
        {format(currentDate, "MMMM yyyy")}
      </h2>

      <button
        onClick={onNext}
        aria-label="Next month"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
