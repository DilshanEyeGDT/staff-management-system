package repository

import (
	"context"
	"encoding/json"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/database"
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/models"
)

type EventRepository struct{}

func NewEventRepository() *EventRepository {
	return &EventRepository{}
}

// CreateEvent creates a new event with announcement body and tags
func (r *EventRepository) CreateEvent(
	title string,
	summary *string,
	content string,
	attachments []string,
	createdBy int,
	status string,
	scheduledAt *string,
	tags []string,
) (*models.Event, error) {

	ctx := context.Background()
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Convert attachments to JSON
	attachmentsJSON, _ := json.Marshal(attachments)

	// 1️⃣ Insert announcement body
	var bodyID int
	err = tx.QueryRow(
		ctx,
		`INSERT INTO announcement_bodies (content, attachments) VALUES ($1, $2) RETURNING announcement_bodies_id`,
		content, attachmentsJSON,
	).Scan(&bodyID)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Insert event
	var eventID int
	var scheduledAtTime interface{}
	if scheduledAt != nil {
		scheduledAtTime = *scheduledAt
	} else {
		scheduledAtTime = nil
	}

	err = tx.QueryRow(
		ctx,
		`INSERT INTO events (title, summary, body_id, created_by, status, scheduled_at)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING events_id`,
		title, summary, bodyID, createdBy, status, scheduledAtTime,
	).Scan(&eventID)
	if err != nil {
		return nil, err
	}

	// 3️⃣ Insert tags
	for _, tag := range tags {
		_, err := tx.Exec(
			ctx,
			`INSERT INTO event_tags (event_id, tag) VALUES ($1, $2)`,
			eventID, tag,
		)
		if err != nil {
			return nil, err
		}
	}

	// 4️⃣ Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// 5️⃣ Fetch full event details to return
	var event models.Event
	err = database.DB.QueryRow(
		ctx,
		`SELECT events_id, title, summary, body_id, created_by, status, scheduled_at, created_at, updated_at
		 FROM events WHERE events_id=$1`,
		eventID,
	).Scan(
		&event.EventsID,
		&event.Title,
		&event.Summary,
		&event.BodyID,
		&event.CreatedBy,
		&event.Status,
		&event.ScheduledAt,
		&event.CreatedAt,
		&event.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &event, nil
}
