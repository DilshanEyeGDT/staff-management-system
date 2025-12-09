package models

import (
	"encoding/json"
	"time"
)

type AnnouncementBody struct {
	ID          int             `db:"announcement_bodies_id" json:"id"`
	Content     string          `db:"content" json:"content"`
	Attachments json.RawMessage `db:"attachments" json:"attachments"`
	CreatedAt   time.Time       `db:"created_at" json:"created_at"`
}
