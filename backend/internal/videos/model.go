package videos

import "time"

type Video struct {
	ID              string     `json:"id"`
	ClientID        string     `json:"client_id"`
	Title           string     `json:"title"`
	Platform        *string    `json:"platform,omitempty"`
	VideoURL        *string    `json:"video_url,omitempty"`
	ThumbnailURL    *string    `json:"thumbnail_url,omitempty"`
	Status          string     `json:"status"`
	ProductionStage string     `json:"production_stage"`
	Feedback        *string    `json:"feedback,omitempty"`
	Version         int        `json:"version"`
	UploadedBy      *string    `json:"uploaded_by,omitempty"`
	ApprovedBy      *string    `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	DueDate         *time.Time `json:"due_date,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

type Comment struct {
	ID        string     `json:"id"`
	VideoID   string     `json:"video_id"`
	AuthorID  string     `json:"author_id"`
	AuthorName string    `json:"author_name"`
	Role      string     `json:"role"`
	Type      string     `json:"type"`
	Message   string     `json:"message"`
	Timecode  *string    `json:"timecode,omitempty"`
	Resolved  bool       `json:"resolved"`
	ParentID  *string    `json:"parent_id,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type CreateVideoRequest struct {
	ClientID     string  `json:"client_id" validate:"required"`
	Title        string  `json:"title" validate:"required"`
	Platform     *string `json:"platform,omitempty"`
	VideoURL     *string `json:"video_url,omitempty"`
	ThumbnailURL *string `json:"thumbnail_url,omitempty"`
	DueDate      *string `json:"due_date,omitempty"`
}

type UpdateVideoRequest struct {
	Title           *string `json:"title,omitempty"`
	Platform        *string `json:"platform,omitempty"`
	VideoURL        *string `json:"video_url,omitempty"`
	ThumbnailURL    *string `json:"thumbnail_url,omitempty"`
	Status          *string `json:"status,omitempty"`
	ProductionStage *string `json:"production_stage,omitempty"`
	Feedback        *string `json:"feedback,omitempty"`
	DueDate         *string `json:"due_date,omitempty"`
}

type AddCommentRequest struct {
	Message  string  `json:"message" validate:"required"`
	Type     string  `json:"type"`
	Timecode *string `json:"timecode,omitempty"`
	ParentID *string `json:"parent_id,omitempty"`
}
