package videochat

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ db *pgxpool.Pool }

func NewRepository(db *pgxpool.Pool) *Repository { return &Repository{db: db} }

func (r *Repository) List(ctx context.Context, videoID string) ([]Message, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	rows, err := r.db.Query(ctx,
		`SELECT id, video_id, author, message, created_at FROM video_chat_messages
		 WHERE video_id = $1 ORDER BY created_at ASC LIMIT 200`, videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Message
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.VideoID, &m.Author, &m.Message, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *Repository) Create(ctx context.Context, videoID, author, message string) (*Message, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var m Message
	err := r.db.QueryRow(ctx,
		`INSERT INTO video_chat_messages (video_id, author, message) VALUES ($1, $2, $3)
		 RETURNING id, video_id, author, message, created_at`,
		videoID, author, message,
	).Scan(&m.ID, &m.VideoID, &m.Author, &m.Message, &m.CreatedAt)
	return &m, err
}
