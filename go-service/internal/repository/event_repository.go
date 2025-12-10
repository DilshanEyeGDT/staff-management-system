package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/database"
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/models"
)

type EventRepository struct{}

// Pagination defaults
const (
	DefaultPage = 1
	DefaultSize = 10
)

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

// GetPagedEvents returns a paged list of events with summary info
func (r *EventRepository) GetPagedEvents(channel string, since *time.Time, page int, size int) ([]models.Event, error) {
	ctx := context.Background()
	if page <= 0 {
		page = DefaultPage
	}
	if size <= 0 {
		size = DefaultSize
	}
	offset := (page - 1) * size

	// Base query
	query := `
	SELECT e.events_id, e.title, e.summary, e.scheduled_at, e.status
	FROM events e
	LEFT JOIN publish_audit p ON e.events_id = p.event_id
	WHERE ($1 = '' OR p.channel = $1 OR p.channel IS NULL)
	`
	args := []interface{}{channel} // $1

	// Add "since" filter only if provided
	if since != nil {
		query += " AND e.scheduled_at >= $2"
		args = append(args, *since)
	}

	// Add LIMIT and OFFSET
	// Need to compute parameter position dynamically
	if since != nil {
		query += " ORDER BY e.scheduled_at DESC LIMIT $3 OFFSET $4"
		args = append(args, size, offset)
	} else {
		query += " ORDER BY e.scheduled_at DESC LIMIT $2 OFFSET $3"
		args = append(args, size, offset)
	}

	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var e models.Event
		if err := rows.Scan(&e.EventsID, &e.Title, &e.Summary, &e.ScheduledAt, &e.Status); err != nil {
			return nil, err
		}
		events = append(events, e)
	}

	return events, nil
}

// GetEventDetails fetches full event details by ID including body, tags, and publish_audit
func (r *EventRepository) GetEventDetails(eventID int) (map[string]interface{}, error) {
	ctx := context.Background()

	// Fetch main event
	var event models.Event
	err := database.DB.QueryRow(ctx,
		`SELECT events_id, title, summary, body_id, created_by, status, scheduled_at, created_at, updated_at
		 FROM events WHERE events_id=$1`, eventID,
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
		return nil, fmt.Errorf("event not found: %w", err)
	}

	// Fetch announcement body
	var body models.AnnouncementBody
	if event.BodyID != nil {
		err := database.DB.QueryRow(ctx,
			`SELECT announcement_bodies_id, content, attachments, created_at FROM announcement_bodies WHERE announcement_bodies_id=$1`,
			*event.BodyID,
		).Scan(&body.ID, &body.Content, &body.Attachments, &body.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch body: %w", err)
		}
	}

	// Fetch tags
	tags := []models.EventTag{}
	tagRows, err := database.DB.Query(ctx, `SELECT event_tags_id, event_id, tag, created_at FROM event_tags WHERE event_id=$1`, eventID)
	if err == nil {
		defer tagRows.Close()
		for tagRows.Next() {
			var t models.EventTag
			if err := tagRows.Scan(&t.ID, &t.EventID, &t.Tag, &t.CreatedAt); err == nil {
				tags = append(tags, t)
			}
		}
	}

	// Fetch publish_audit
	audits := []map[string]interface{}{}
	auditRows, err := database.DB.Query(ctx,
		`SELECT publish_audit_id, action, performed_by, performed_at, channel FROM publish_audit WHERE event_id=$1`,
		eventID,
	)
	if err == nil {
		defer auditRows.Close()
		for auditRows.Next() {
			var paID int
			var action string
			var performedBy int
			var performedAt time.Time
			var channel string
			if err := auditRows.Scan(&paID, &action, &performedBy, &performedAt, &channel); err == nil {
				audits = append(audits, map[string]interface{}{
					"id":           paID,
					"action":       action,
					"performed_by": performedBy,
					"performed_at": performedAt,
					"channel":      channel,
				})
			}
		}
	}

	// Combine into response
	resp := map[string]interface{}{
		"event":         event,
		"announcement":  body,
		"tags":          tags,
		"publish_audit": audits,
	}

	return resp, nil
}

func (r *EventRepository) UpdateEvent(
	eventID int,
	title *string,
	summary *string,
	content *string,
	tags *[]string,
	scheduledAt *string,
) error {
	ctx := context.Background()
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1️⃣ Update main event fields if provided
	updateFields := []string{}
	args := []interface{}{}
	argPos := 1

	if title != nil {
		updateFields = append(updateFields, fmt.Sprintf("title=$%d", argPos))
		args = append(args, *title)
		argPos++
	}
	if summary != nil {
		updateFields = append(updateFields, fmt.Sprintf("summary=$%d", argPos))
		args = append(args, *summary)
		argPos++
	}
	if scheduledAt != nil {
		updateFields = append(updateFields, fmt.Sprintf("scheduled_at=$%d", argPos))
		args = append(args, *scheduledAt)
		argPos++
	}

	if len(updateFields) > 0 {
		query := fmt.Sprintf("UPDATE events SET %s, updated_at=CURRENT_TIMESTAMP WHERE events_id=$%d",
			strJoin(updateFields, ", "), argPos)
		args = append(args, eventID)

		if _, err := tx.Exec(ctx, query, args...); err != nil {
			return err
		}
	}

	// 2️⃣ Update announcement body if content provided
	if content != nil {
		var bodyID int
		err := tx.QueryRow(ctx, "SELECT body_id FROM events WHERE events_id=$1", eventID).Scan(&bodyID)
		if err != nil {
			return fmt.Errorf("failed to get body_id: %w", err)
		}

		if _, err := tx.Exec(ctx, "UPDATE announcement_bodies SET content=$1 WHERE announcement_bodies_id=$2", *content, bodyID); err != nil {
			return fmt.Errorf("failed to update announcement content: %w", err)
		}
	}

	// 3️⃣ Update tags if provided
	if tags != nil {
		// Delete old tags
		if _, err := tx.Exec(ctx, "DELETE FROM event_tags WHERE event_id=$1", eventID); err != nil {
			return err
		}
		// Insert new tags
		for _, t := range *tags {
			if _, err := tx.Exec(ctx, "INSERT INTO event_tags (event_id, tag) VALUES ($1, $2)", eventID, t); err != nil {
				return err
			}
		}
	}

	// 4️⃣ Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}

// Helper function to join strings with separator
func strJoin(arr []string, sep string) string {
	res := ""
	for i, s := range arr {
		if i > 0 {
			res += sep
		}
		res += s
	}
	return res
}

// ModerateEvent updates an event status and writes into publish_audit
func (r *EventRepository) ModerateEvent(eventID string, action string, performedBy int, channel *string) (*models.Event, error) {

	ctx := context.Background()
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var newStatus string
	var auditAction string
	var auditChannel string

	// APPROVED
	if action == "approved" {
		newStatus = "approved"
		auditAction = "broadcast"

		// channel must come from request
		if channel != nil {
			auditChannel = *channel
		} else {
			return nil, fmt.Errorf("channel is required when approving")
		}

	} else if action == "rejected" {
		// REJECTED
		newStatus = "rejected"
		auditAction = "rejected"
		auditChannel = "not sending"

	} else {
		return nil, fmt.Errorf("invalid action: must be 'approved' or 'rejected'")
	}

	// 1️⃣ Update event status
	_, err = tx.Exec(
		ctx,
		`UPDATE events SET status=$1, updated_at=NOW() WHERE events_id=$2`,
		newStatus, eventID,
	)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Insert into publish_audit
	_, err = tx.Exec(
		ctx,
		`INSERT INTO publish_audit (event_id, action, performed_by, channel)
         VALUES ($1, $2, $3, $4)`,
		eventID, auditAction, performedBy, auditChannel,
	)
	if err != nil {
		return nil, err
	}

	// 3️⃣ Commit
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// 4️⃣ Fetch updated event
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

// BroadcastEvent enqueues push/email delivery based on publish_audit channel
func (r *EventRepository) BroadcastEvent(eventID string, performedBy int) (*models.Event, error) {
	ctx := context.Background()
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 1️⃣ Check if event.status = approved
	var status string
	err = tx.QueryRow(ctx, `SELECT status FROM events WHERE events_id=$1`, eventID).Scan(&status)
	if err != nil {
		return nil, err
	}
	if status != "approved" {
		return nil, fmt.Errorf("only approved events can be broadcast")
	}

	// 2️⃣ Get all previous publish_audit channels
	rows, err := tx.Query(ctx, `SELECT DISTINCT channel FROM publish_audit WHERE event_id=$1`, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	channels := []string{}
	for rows.Next() {
		var ch string
		if err := rows.Scan(&ch); err != nil {
			return nil, err
		}
		channels = append(channels, ch)
	}

	// 3️⃣ Send notifications
	for _, ch := range channels {
		switch ch {
		case "push":
			// call your push notification function
			err = SendPushNotification(eventID)
			if err != nil {
				return nil, err
			}
		case "email":
			// call your email function
			err = SendEmailNotification(eventID)
			if err != nil {
				return nil, err
			}
		default:
			// skip unknown channels (Teams for now)
		}

		// 4️⃣ Insert publish_audit for successful broadcast
		_, err := tx.Exec(ctx,
			`INSERT INTO publish_audit (event_id, action, performed_by, channel)
             VALUES ($1, $2, $3, $4)`,
			eventID, "broadcast successful", performedBy, ch)
		if err != nil {
			return nil, err
		}
	}

	// 5️⃣ Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// 6️⃣ Return updated event
	var event models.Event
	err = database.DB.QueryRow(ctx,
		`SELECT events_id, title, summary, body_id, created_by, status, scheduled_at, created_at, updated_at
         FROM events WHERE events_id=$1`, eventID).
		Scan(&event.EventsID, &event.Title, &event.Summary, &event.BodyID,
			&event.CreatedBy, &event.Status, &event.ScheduledAt,
			&event.CreatedAt, &event.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &event, nil
}

func SendPushNotification(eventID string) error {
	// TODO: integrate with FCM or your push service
	fmt.Println("Push notification sent for event:", eventID)
	return nil
}

func SendEmailNotification(eventID string) error {
	// TODO: integrate with SMTP or email service
	fmt.Println("Email sent for event:", eventID)
	return nil
}
