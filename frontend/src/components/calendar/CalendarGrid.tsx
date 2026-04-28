"use client";

import { useState, useCallback } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, addMonths, subMonths,
} from "date-fns";
import CalendarCell from "./CalendarCell";
import PostDialog from "./PostDialog";
import MonthNavigator from "./MonthNavigator";
import MonthStats from "./MonthStats";
import MonthPlanList from "./MonthPlanList";
import { CalendarPost } from "@/types/calendar";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  initialPosts: CalendarPost[];
  clientId: string;
}

export default function CalendarGrid({ initialPosts, clientId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>(initialPosts);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function getPostForDate(date: Date) {
    return posts.find((p) => isSameDay(new Date(p.date), date));
  }

  async function fetchPosts(date: Date) {
    setLoading(true);
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const res = await fetch(`/api/calendar/posts?clientId=${clientId}&month=${m}&year=${y}`);
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  function handlePrev() {
    const prev = subMonths(currentDate, 1);
    setCurrentDate(prev);
    fetchPosts(prev);
  }

  function handleNext() {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    fetchPosts(next);
  }

  const handleSave = useCallback((saved: CalendarPost) => {
    setPosts((prev) => {
      const exists = prev.find((p) => isSameDay(new Date(p.date), new Date(saved.date)));
      if (exists) return prev.map((p) => (p.id === exists.id ? saved : p));
      return [...prev, saved];
    });
  }, []);

  const handleDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const selectedPost = selectedDate ? getPostForDate(selectedDate) : undefined;

  return (
    <div className={loading ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
      <div className="mb-5 flex items-center justify-between">
        <MonthNavigator currentDate={currentDate} onPrev={handlePrev} onNext={handleNext} />
        {loading && <span className="text-xs animate-pulse text-gray-400">Loading…</span>}
      </div>

      {/* Calendar card */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/60">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isLastRow = i >= days.length - 7;
            const isLastCol = i % 7 === 6;
            return (
              <CalendarCell
                key={day.toISOString()}
                date={day}
                currentMonth={currentDate}
                post={getPostForDate(day)}
                onClick={() => setSelectedDate(day)}
                noBorderBottom={isLastRow}
                noBorderRight={isLastCol}
              />
            );
          })}
        </div>
      </div>

      <MonthStats posts={posts} />
      <MonthPlanList posts={posts} currentDate={currentDate} onSelectDate={setSelectedDate} />

      {selectedDate && (
        <PostDialog
          date={selectedDate}
          post={selectedPost}
          clientId={clientId}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
