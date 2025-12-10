package models

import "time"

type Event struct {
	EventsID    int        `db:"events_id" json:"id"`
	Title       string     `db:"title" json:"title"`
	Summary     *string    `db:"summary" json:"summary,omitempty"`
	BodyID      *int       `db:"body_id" json:"body_id,omitempty"`
	CreatedBy   int        `db:"created_by" json:"created_by"`
	Status      string     `db:"status" json:"status"`
	ScheduledAt *time.Time `db:"scheduled_at" json:"scheduled_at,omitempty"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at" json:"updated_at"`
}
