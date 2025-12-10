package models

import "time"

type PublishAudit struct {
	ID          int       `db:"publish_audit_id" json:"id"`
	EventID     int       `db:"event_id" json:"event_id"`
	Action      string    `db:"action" json:"action"`
	PerformedBy int       `db:"performed_by" json:"performed_by"`
	PerformedAt time.Time `db:"performed_at" json:"performed_at"`
	Channel     string    `db:"channel" json:"channel"`
}
