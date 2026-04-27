"use client";

import { useState } from "react";
import { Video } from "@/lib/types";
import { useApproveVideo, useRequestEdit } from "@/hooks/useVideos";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApprovalActionsProps {
  video: Video;
}

export function ApprovalActions({ video }: ApprovalActionsProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const approve = useApproveVideo();
  const requestEdit = useRequestEdit();

  const handleApprove = async () => {
    try {
      await approve.mutateAsync(video.id);
      toast.success(`${video.title} approved`);
    } catch {
      toast.error("Failed to approve video");
    }
  };

  const handleRequestEdit = async () => {
    if (!feedback.trim()) return;
    try {
      await requestEdit.mutateAsync({ id: video.id, feedback });
      toast.success("Edit request sent");
      setFeedbackOpen(false);
      setFeedback("");
    } catch {
      toast.error("Failed to send edit request");
    }
  };

  if (video.status === "approved") {
    return (
      <span className="text-xs text-green-600 font-bold uppercase tracking-wide">
        ✓ Approved
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] tracking-[0.14em] uppercase font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Watch
        </a>
        {video.status === "pending" && (
          <>
            <button
              onClick={handleApprove}
              disabled={approve.isPending}
              className="text-[10px] tracking-[0.14em] uppercase font-bold text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Approve
            </button>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="text-[10px] tracking-[0.14em] uppercase font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            >
              Request Edit
            </button>
          </>
        )}
        {video.status === "edit_requested" && (
          <span className="text-xs text-red-600 font-bold uppercase tracking-wide">
            Edit Requested
          </span>
        )}
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black tracking-tight">
              Request Edit
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-3">{video.title}</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe the changes needed..."
            rows={4}
            className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900 resize-none"
          />
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleRequestEdit}
              disabled={!feedback.trim() || requestEdit.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] tracking-[0.18em] uppercase font-bold py-3 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {requestEdit.isPending ? "Sending..." : "Send Request"}
            </button>
            <button
              onClick={() => setFeedbackOpen(false)}
              className="px-4 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
