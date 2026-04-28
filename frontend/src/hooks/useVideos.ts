"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Video, VideoComment, VideoProductionStage } from "@/lib/types";
import { MOCK_VIDEOS, MOCK_VIDEO_COMMENTS } from "@/lib/mock-data";

type W<T> = { data: T; message: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVideo(r: any): Video {
  return {
    id: r.id,
    clientId: r.client_id ?? r.clientId ?? "",
    clientName: r.client_name ?? r.clientName ?? "",
    title: r.title ?? "",
    platform: r.platform ?? "instagram",
    videoUrl: r.video_url ?? r.videoUrl ?? "#",
    status: r.status ?? "pending",
    productionStage: r.production_stage ?? r.productionStage ?? "scripting",
    dueDate: r.due_date ?? r.dueDate ?? "",
    feedback: r.feedback,
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
}

async function fetchVideos(): Promise<Video[]> {
  const { data } = await api.get<W<{ videos: unknown[] }>>("/api/videos");
  return (data.data.videos ?? []).map(mapVideo);
}

async function approveVideo(id: string): Promise<Video> {
  const { data } = await api.post<W<{ video: unknown }>>(`/api/videos/${id}/approve`);
  return mapVideo(data.data.video);
}

async function requestEdit(id: string, feedback: string): Promise<Video> {
  const { data } = await api.post<W<{ video: unknown }>>(`/api/videos/${id}/request-edit`, { feedback });
  return mapVideo(data.data.video);
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
