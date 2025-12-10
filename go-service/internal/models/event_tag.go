package models

import "time"

type EventTag struct {
	ID        int       `db:"event_tags_id" json:"id"`
	EventID   int       `db:"event_id" json:"event_id"`
	Tag       string    `db:"tag" json:"tag"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
