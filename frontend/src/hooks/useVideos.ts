"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Video, VideoComment, VideoProductionStage } from "@/lib/types";
import { MOCK_VIDEOS, MOCK_VIDEO_COMMENTS } from "@/lib/mock-data";

async function fetchVideos(): Promise<Video[]> {
  const { data } = await api.get<{ videos: Video[] }>("/api/videos");
  return data.videos;
}

async function approveVideo(id: string): Promise<Video> {
  const { data } = await api.post<{ video: Video }>(`/api/videos/${id}/approve`);
  return data.video;
}

async function requestEdit(id: string, feedback: string): Promise<Video> {
  const { data } = await api.post<{ video: Video }>(`/api/videos/${id}/request-edit`, { feedback });
  return data.video;
}

export function useVideos() {
  return useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    initialData: MOCK_VIDEOS,
    initialDataUpdatedAt: 0,
  });
}

export function useVideo(id: string) {
  const { data: videos } = useVideos();
  return videos?.find((v) => v.id === id) ?? null;
}

export function useVideoComments(videoId: string) {
  return useQuery<VideoComment[]>({
    queryKey: ["video-comments", videoId],
    queryFn: async () => MOCK_VIDEO_COMMENTS[videoId] ?? [],
    initialData: MOCK_VIDEO_COMMENTS[videoId] ?? [],
    initialDataUpdatedAt: 0,
  });
}

export function useAddVideoComment(videoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      comment: Omit<VideoComment, "id" | "videoId" | "createdAt">
    ): Promise<VideoComment> => ({
      id: `vc_${Math.random().toString(36).slice(2)}`,
      videoId,
      createdAt: new Date().toISOString(),
      ...comment,
    }),
    onSuccess: (newComment) => {
      qc.setQueryData<VideoComment[]>(["video-comments", videoId], (old) => [
        ...(old ?? []),
        newComment,
      ]);
    },
  });
}

export function useUpdateVideoStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      stage,
    }: {
      id: string;
      stage: VideoProductionStage;
    }) => ({ id, stage }),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["videos"] });
      const prev = qc.getQueryData<Video[]>(["videos"]);
      qc.setQueryData<Video[]>(["videos"], (old) =>
        old?.map((v) => (v.id === id ? { ...v, productionStage: stage } : v))
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["videos"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });
}

export function useApproveVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: approveVideo,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["videos"] });
      const prev = qc.getQueryData<Video[]>(["videos"]);
      qc.setQueryData<Video[]>(["videos"], (old) =>
        old?.map((v) =>
          v.id === id ? { ...v, status: "approved", productionStage: "approved" } : v
        )
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["videos"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });
}

export function useRequestEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
      requestEdit(id, feedback),
    onMutate: async ({ id, feedback }) => {
      await qc.cancelQueries({ queryKey: ["videos"] });
      const prev = qc.getQueryData<Video[]>(["videos"]);
      qc.setQueryData<Video[]>(["videos"], (old) =>
        old?.map((v) =>
          v.id === id ? { ...v, status: "edit_requested", feedback } : v
        )
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["videos"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["videos"] }),
  });
}
