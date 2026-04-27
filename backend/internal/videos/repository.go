package videos

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, clientID string) ([]Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	query := `SELECT id, client_id, title, platform, video_url, thumbnail_url, status,
	                 production_stage, feedback, version, uploaded_by, approved_by,
	                 approved_at, due_date, created_at FROM videos`
	args := []interface{}{}
	if clientID != "" {
		query += ` WHERE client_id = $1`
		args = append(args, clientID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Video
	for rows.Next() {
		var v Video
		if err := rows.Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
			&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
			&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, v)
	}
	return list, nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var v Video
	err := r.db.QueryRow(ctx,
		`SELECT id, client_id, title, platform, video_url, thumbnail_url, status,
		        production_stage, feedback, version, uploaded_by, approved_by,
		        approved_at, due_date, created_at FROM videos WHERE id = $1`, id,
	).Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
		&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
		&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *Repository) Create(ctx context.Context, req CreateVideoRequest, uploadedBy string, dueDate *time.Time) (*Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var v Video
	err := r.db.QueryRow(ctx,
		`INSERT INTO videos (client_id, title, platform, video_url, thumbnail_url, uploaded_by, due_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, client_id, title, platform, video_url, thumbnail_url, status,
		           production_stage, feedback, version, uploaded_by, approved_by,
		           approved_at, due_date, created_at`,
		req.ClientID, req.Title, req.Platform, req.VideoURL, req.ThumbnailURL, uploadedBy, dueDate,
	).Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
		&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
		&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt)
	return &v, err
}

func (r *Repository) Update(ctx context.Context, id string, req UpdateVideoRequest, dueDate *time.Time) (*Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var v Video
	err := r.db.QueryRow(ctx,
		`UPDATE videos SET
		   title            = COALESCE($2, title),
		   platform         = COALESCE($3, platform),
		   video_url        = COALESCE($4, video_url),
		   thumbnail_url    = COALESCE($5, thumbnail_url),
		   status           = COALESCE($6, status),
		   production_stage = COALESCE($7, production_stage),
		   feedback         = COALESCE($8, feedback),
		   due_date         = COALESCE($9, due_date)
		 WHERE id = $1
		 RETURNING id, client_id, title, platform, video_url, thumbnail_url, status,
		           production_stage, feedback, version, uploaded_by, approved_by,
		           approved_at, due_date, created_at`,
		id, req.Title, req.Platform, req.VideoURL, req.ThumbnailURL,
		req.Status, req.ProductionStage, req.Feedback, dueDate,
	).Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
		&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
		&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt)
	return &v, err
}

func (r *Repository) Approve(ctx context.Context, id, approverID string) (*Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var v Video
	err := r.db.QueryRow(ctx,
		`UPDATE videos SET status = 'approved', approved_by = $2, approved_at = NOW()
		 WHERE id = $1
		 RETURNING id, client_id, title, platform, video_url, thumbnail_url, status,
		           production_stage, feedback, version, uploaded_by, approved_by,
		           approved_at, due_date, created_at`,
		id, approverID,
	).Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
		&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
		&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt)
	return &v, err
}

func (r *Repository) RequestEdit(ctx context.Context, id, feedback string) (*Video, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var v Video
	err := r.db.QueryRow(ctx,
		`UPDATE videos SET status = 'revision_requested', feedback = $2
		 WHERE id = $1
		 RETURNING id, client_id, title, platform, video_url, thumbnail_url, status,
		           production_stage, feedback, version, uploaded_by, approved_by,
		           approved_at, due_date, created_at`,
		id, feedback,
	).Scan(&v.ID, &v.ClientID, &v.Title, &v.Platform, &v.VideoURL,
		&v.ThumbnailURL, &v.Status, &v.ProductionStage, &v.Feedback, &v.Version,
		&v.UploadedBy, &v.ApprovedBy, &v.ApprovedAt, &v.DueDate, &v.CreatedAt)
	return &v, err
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(ctx, `DELETE FROM videos WHERE id = $1`, id)
	return err
}

func (r *Repository) ListComments(ctx context.Context, videoID string) ([]Comment, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.db.Query(ctx,
		`SELECT id, video_id, author_id, author_name, role, type, message, timecode, resolved, parent_id, created_at
		 FROM video_comments WHERE video_id = $1 ORDER BY created_at ASC`, videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Comment
	for rows.Next() {
		var c Comment
		if err := rows.Scan(&c.ID, &c.VideoID, &c.AuthorID, &c.AuthorName, &c.Role,
			&c.Type, &c.Message, &c.Timecode, &c.Resolved, &c.ParentID, &c.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) AddComment(ctx context.Context, videoID, authorID, authorName, role string, req AddCommentRequest) (*Comment, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	commentType := req.Type
	if commentType == "" {
		commentType = "general"
	}

	var c Comment
	err := r.db.QueryRow(ctx,
		`INSERT INTO video_comments (video_id, author_id, author_name, role, type, message, timecode, parent_id)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING id, video_id, author_id, author_name, role, type, message, timecode, resolved, parent_id, created_at`,
		videoID, authorID, authorName, role, commentType, req.Message, req.Timecode, req.ParentID,
	).Scan(&c.ID, &c.VideoID, &c.AuthorID, &c.AuthorName, &c.Role,
		&c.Type, &c.Message, &c.Timecode, &c.Resolved, &c.ParentID, &c.CreatedAt)
	return &c, err
}
