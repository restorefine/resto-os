package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/restorefine/agencyos/pkg/response"
)

type Handler struct {
	svc *Service
	db  *pgxpool.Pool
}

func NewHandler(svc *Service, db *pgxpool.Pool) *Handler {
	return &Handler{svc: svc, db: db}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userRecord struct {
	ID                  string
	Name                string
	Email               string
	PasswordHash        string
	Role                string
	ClientID            *string
	MustChangePassword  bool
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}
	if req.Email == "" || req.Password == "" {
		response.BadRequest(w, "email and password required", "VALIDATION_ERROR")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var u userRecord
	err := h.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, role, client_id, must_change_password FROM users WHERE email = $1`,
		req.Email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.ClientID, &u.MustChangePassword)
	if err != nil {
		response.Unauthorized(w, "invalid credentials")
		return
	}

	if !CheckPassword(u.PasswordHash, req.Password) {
		response.Unauthorized(w, "invalid credentials")
		return
	}

	clientID := ""
	if u.ClientID != nil {
		clientID = *u.ClientID
	}

	accessToken, err := h.svc.GenerateAccessToken(u.ID, u.Email, u.Role, clientID, u.Name)
	if err != nil {
		response.InternalError(w, "token generation failed")
		return
	}

	refreshToken, err := h.svc.GenerateRefreshToken()
	if err != nil {
		response.InternalError(w, "token generation failed")
		return
	}

	if err := h.svc.StoreRefreshToken(r.Context(), u.ID, refreshToken); err != nil {
		response.InternalError(w, "failed to store session")
		return
	}

	// Update last login
	h.db.Exec(ctx, `UPDATE users SET last_login_at = NOW() WHERE id = $1`, u.ID)

	setCookie(w, "access_token", accessToken, 15*time.Minute)
	setCookie(w, "refresh_token", refreshToken, 7*24*time.Hour)

	response.Ok(w, map[string]interface{}{
		"user": map[string]interface{}{
			"id":                  u.ID,
			"name":                u.Name,
			"email":               u.Email,
			"role":                u.Role,
			"client_id":           clientID,
			"must_change_password": u.MustChangePassword,
		},
	}, "login successful")
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		response.Unauthorized(w, "no refresh token")
		return
	}

	userID, err := h.svc.ValidateRefreshToken(r.Context(), cookie.Value)
	if err != nil {
		response.Unauthorized(w, "invalid refresh token")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var u userRecord
	err = h.db.QueryRow(ctx,
		`SELECT id, name, email, role, client_id FROM users WHERE id = $1`,
		userID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.ClientID)
	if err != nil {
		response.Unauthorized(w, "user not found")
		return
	}

	clientID := ""
	if u.ClientID != nil {
		clientID = *u.ClientID
	}

	accessToken, err := h.svc.GenerateAccessToken(u.ID, u.Email, u.Role, clientID, u.Name)
	if err != nil {
		response.InternalError(w, "token generation failed")
		return
	}

	newRefreshToken, err := h.svc.GenerateRefreshToken()
	if err != nil {
		response.InternalError(w, "token generation failed")
		return
	}

	h.svc.DeleteRefreshToken(r.Context(), cookie.Value)
	h.svc.StoreRefreshToken(r.Context(), u.ID, newRefreshToken)

	setCookie(w, "access_token", accessToken, 15*time.Minute)
	setCookie(w, "refresh_token", newRefreshToken, 7*24*time.Hour)

	response.Ok(w, map[string]string{"message": "token refreshed"}, "")
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var u userRecord
	err := h.db.QueryRow(ctx,
		`SELECT id, name, email, password_hash, role, client_id, must_change_password FROM users WHERE id = $1`,
		claims.UserID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role, &u.ClientID, &u.MustChangePassword)
	if err != nil {
		response.NotFound(w, "user not found")
		return
	}

	clientID := ""
	if u.ClientID != nil {
		clientID = *u.ClientID
	}

	response.Ok(w, map[string]interface{}{
		"user": map[string]interface{}{
			"id":                   u.ID,
			"name":                 u.Name,
			"email":                u.Email,
			"role":                 u.Role,
			"client_id":            clientID,
			"must_change_password": u.MustChangePassword,
		},
	}, "")
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("refresh_token"); err == nil {
		h.svc.DeleteRefreshToken(r.Context(), cookie.Value)
	}
	clearCookie(w, "access_token")
	clearCookie(w, "refresh_token")
	response.Ok(w, nil, "logged out")
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims := GetClaims(r)
	if claims == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", "BAD_REQUEST")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var hash string
	err := h.db.QueryRow(ctx,
		`SELECT password_hash FROM users WHERE id = $1`, claims.UserID,
	).Scan(&hash)
	if err != nil {
		response.NotFound(w, "user not found")
		return
	}

	if !CheckPassword(hash, req.OldPassword) {
		response.Unauthorized(w, "incorrect current password")
		return
	}

	newHash, err := HashPassword(req.NewPassword)
	if err != nil {
		response.InternalError(w, "failed to hash password")
		return
	}

	_, err = h.db.Exec(ctx,
		`UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2`,
		newHash, claims.UserID,
	)
	if err != nil {
		response.InternalError(w, "failed to update password")
		return
	}

	response.Ok(w, nil, "password changed successfully")
}

func setCookie(w http.ResponseWriter, name, value string, maxAge time.Duration) {
	isProd := os.Getenv("APP_ENV") == "production"
	sameSite := http.SameSiteLaxMode
	if isProd {
		sameSite = http.SameSiteNoneMode
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:      int(maxAge.Seconds()),
		HttpOnly:    true,
		Secure:      isProd,
		SameSite:    sameSite,
		Partitioned: isProd,
	})
}

func clearCookie(w http.ResponseWriter, name string) {
	isProd := os.Getenv("APP_ENV") == "production"
	sameSite := http.SameSiteLaxMode
	if isProd {
		sameSite = http.SameSiteNoneMode
	}

	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		MaxAge:      -1,
		HttpOnly:    true,
		Secure:      isProd,
		SameSite:    sameSite,
		Partitioned: isProd,
	})
}
