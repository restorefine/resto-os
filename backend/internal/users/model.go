package users

import "time"

type User struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	Email              string     `json:"email"`
	Role               string     `json:"role"`
	ClientID           *string    `json:"client_id,omitempty"`
	MustChangePassword bool       `json:"must_change_password"`
	PortalActivatedAt  *time.Time `json:"portal_activated_at,omitempty"`
	LastLoginAt        *time.Time `json:"last_login_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
}

type CreateUserRequest struct {
	Name     string  `json:"name" validate:"required"`
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=8"`
	Role     string  `json:"role" validate:"required,oneof=admin staff client"`
	ClientID *string `json:"client_id,omitempty"`
}

type UpdateUserRequest struct {
	Name     *string `json:"name,omitempty"`
	Email    *string `json:"email,omitempty"`
	Role     *string `json:"role,omitempty"`
	ClientID *string `json:"client_id,omitempty"`
}
