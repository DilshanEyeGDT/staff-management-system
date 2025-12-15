package handlers

import (
	"net/http"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/repository"
	"github.com/gin-gonic/gin"
)

var moderateRepo = repository.NewEventRepository()

type ModerateEventRequest struct {
	Action      string  `json:"action" binding:"required"`       // "approved" or "rejected"
	PerformedBy int     `json:"performed_by" binding:"required"` // user ID
	Channel     *string `json:"channel"`                         // required only when approved
}

func ModerateEvent(c *gin.Context) {
	eventID := c.Param("id")

	var req ModerateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := moderateRepo.ModerateEvent(eventID, req.Action, req.PerformedBy, req.Channel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Event moderation completed",
		"event":   result,
	})
}
