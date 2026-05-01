"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

export interface ChatMessage {
  id: string;
  video_id: string;
  author: string;
  message: string;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useVideoChat(videoId: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ["video-chat", videoId],
    queryFn: async () => {
      const { data } = await api.get(`/api/videos/${videoId}/chat`);
      return data.data.messages ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSendChatMessage(videoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.post(`/api/videos/${videoId}/chat`, { message });
      return data.data.message as ChatMessage;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["video-chat", videoId] });
      // optimistic placeholder — will be replaced by SSE/refetch
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["video-chat", videoId] }),
  });
}

export function useSendTyping(videoId: string) {
  return useCallback(async () => {
    try {
      await api.post(`/api/videos/${videoId}/chat/typing`, {});
    } catch {}
  }, [videoId]);
}

export function useChatSSE(videoId: string) {
  const qc = useQueryClient();
  const [typingAuthor, setTypingAuthor] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/stream`, { withCredentials: true });

    es.addEventListener("chat_message", (e) => {
      try {
        const msg: ChatMessage = JSON.parse(e.data);
        if (msg.video_id !== videoId) return;
        qc.setQueryData<ChatMessage[]>(["video-chat", videoId], (old) => {
          if (!old) return [msg];
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        });
      } catch {}
    });

    es.addEventListener("chat_typing", (e) => {
      try {
        const { video_id, author } = JSON.parse(e.data);
        if (video_id !== videoId) return;
        setTypingAuthor(author);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingAuthor(null), 3000);
      } catch {}
    });

    return () => {
      es.close();
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [videoId, qc]);

  return { typingAuthor };
}
