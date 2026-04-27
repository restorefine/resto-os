package videos

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/restorefine/agencyos/internal/auth"
	"github.com/restorefine/agencyos/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	clientID := r.URL.Query().Get("client_id")
	list, err := h.svc.List(r.Context(), clientID)
	if err != nil {
		response.InternalError(w, "failed to list videos")
		return
	}
	if list == nil {
		list = []Video{}
	}
	response.Ok(w, list, "")
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req CreateVideoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	v, err := h.svc.Create(r.Context(), req, claims.UserID)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Created(w, v, "video created")
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req UpdateVideoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	v, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		response.InternalError(w, "failed to update video")
		return
	}
	response.Ok(w, v, "video updated")
}

func (h *Handler) Approve(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}
	v, err := h.svc.Approve(r.Context(), id, claims.UserID)
	if err != nil {
		response.InternalError(w, "failed to approve video")
		return
	}
	response.Ok(w, v, "video approved")
}

type requestEditBody struct {
	Feedback string `json:"feedback"`
}

func (h *Handler) RequestEdit(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body requestEditBody
	json.NewDecoder(r.Body).Decode(&body)
	v, err := h.svc.RequestEdit(r.Context(), id, body.Feedback)
	if err != nil {
		response.InternalError(w, "failed to request edit")
		return
	}
	response.Ok(w, v, "edit requested")
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.InternalError(w, "failed to delete video")
		return
	}
	response.Ok(w, nil, "video deleted")
}

func (h *Handler) ListComments(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "id")
	list, err := h.svc.ListComments(r.Context(), videoID)
	if err != nil {
		response.InternalError(w, "failed to list comments")
		return
	}
	if list == nil {
		list = []Comment{}
	}
	response.Ok(w, list, "")
}

func (h *Handler) AddComment(w http.ResponseWriter, r *http.Request) {
	videoID := chi.URLParam(r, "id")
	claims := auth.GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req AddCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}

	comment, err := h.svc.AddComment(r.Context(), videoID, claims.UserID, claims.Email, claims.Role, req)
	if err != nil {
		response.BadRequest(w, err.Error(), "VALIDATION_ERROR")
		return
	}
	response.Created(w, comment, "comment added")
}
