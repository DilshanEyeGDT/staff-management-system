package handlers

import (
	"net/http"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/repository"
	"github.com/gin-gonic/gin"
)

var eventRepo = repository.NewEventRepository()

type CreateEventRequest struct {
	Title       string   `json:"title" binding:"required"`
	Summary     *string  `json:"summary"`
	Content     string   `json:"content" binding:"required"`
	Attachments []string `json:"attachments"`
	CreatedBy   int      `json:"created_by" binding:"required"`
	Status      string   `json:"status" binding:"required"`
	ScheduledAt *string  `json:"scheduled_at"`
	Tags        []string `json:"tags"`
}

func CreateEvent(c *gin.Context) {
	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event, err := eventRepo.CreateEvent(
		req.Title,
		req.Summary,
		req.Content,
		req.Attachments,
		req.CreatedBy,
		req.Status,
		req.ScheduledAt,
		req.Tags,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusOK, event)
}
