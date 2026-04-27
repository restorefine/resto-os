package dashboard

import (
	"net/http"

	"github.com/restorefine/agencyos/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetStats(r.Context())
	if err != nil {
		response.InternalError(w, "failed to fetch dashboard stats")
		return
	}
	response.Ok(w, stats, "")
}
