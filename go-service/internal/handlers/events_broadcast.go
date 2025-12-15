package handlers

import (
	"net/http"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/repository"
	"github.com/gin-gonic/gin"
)

var broadcastRepo = repository.NewEventRepository()

type BroadcastEventRequest struct {
	PerformedBy int `json:"performed_by" binding:"required"`
}

func BroadcastEvent(c *gin.Context) {
	eventID := c.Param("id")

	var req BroadcastEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := broadcastRepo.BroadcastEvent(eventID, req.PerformedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Event broadcast completed",
		"event":   result,
	})
}
