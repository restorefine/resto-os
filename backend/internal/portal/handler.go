package portal

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/internal/content"
	"github.com/restorefine/agencyos/internal/invoices"
	"github.com/restorefine/agencyos/internal/videos"
	"github.com/restorefine/agencyos/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil || claims.ClientID == "" {
		response.Forbidden(w, "portal access only")
		return
	}
	client, err := h.svc.GetMyClient(r.Context(), claims.ClientID)
	if err != nil {
		response.NotFound(w, "client not found")
		return
	}
	response.Ok(w, client, "")
}

func (h *Handler) GetInvoices(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil || claims.ClientID == "" {
		response.Forbidden(w, "portal access only")
		return
	}
	list, err := h.svc.GetMyInvoices(r.Context(), claims.ClientID)
	if err != nil {
		response.InternalError(w, "failed to fetch invoices")
		return
	}
	if list == nil {
		list = []invoices.Invoice{}
	}
	response.Ok(w, list, "")
}

func (h *Handler) GetVideos(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil || claims.ClientID == "" {
		response.Forbidden(w, "portal access only")
		return
	}
	list, err := h.svc.GetMyVideos(r.Context(), claims.ClientID)
	if err != nil {
		response.InternalError(w, "failed to fetch videos")
		return
	}
	if list == nil {
		list = []videos.Video{}
	}
	response.Ok(w, list, "")
}

func (h *Handler) ApproveVideo(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}
	videoID := chi.URLParam(r, "id")
	v, err := h.svc.ApproveVideo(r.Context(), videoID, claims.UserID)
	if err != nil {
		response.InternalError(w, "failed to approve video")
		return
	}
	response.Ok(w, v, "video approved")
}

func (h *Handler) GetContent(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil || claims.ClientID == "" {
		response.Forbidden(w, "portal access only")
		return
	}
	list, err := h.svc.GetMyContent(r.Context(), claims.ClientID)
	if err != nil {
		response.InternalError(w, "failed to fetch content")
		return
	}
	if list == nil {
		list = []content.ContentItem{}
	}
	response.Ok(w, list, "")
}
