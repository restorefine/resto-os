package videochat

import "time"

type Message struct {
	ID        string    `json:"id"`
	VideoID   string    `json:"video_id"`
	Author    string    `json:"author"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type SendRequest struct {
	Message string `json:"message"`
}
