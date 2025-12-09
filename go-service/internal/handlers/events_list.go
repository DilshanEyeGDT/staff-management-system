package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetPagedEvents(c *gin.Context) {
	channel := c.Query("channel")
	sinceStr := c.Query("since")
	pageStr := c.Query("page")
	sizeStr := c.Query("size")

	var since *time.Time
	if sinceStr != "" {
		t, err := time.Parse(time.RFC3339, sinceStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid since timestamp"})
			return
		}
		since = &t
	}

	page := 1
	size := 10
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil {
			page = p
		}
	}
	if sizeStr != "" {
		if s, err := strconv.Atoi(sizeStr); err == nil {
			size = s
		}
	}

	events, err := eventRepo.GetPagedEvents(channel, since, page, size)
	if err != nil {
		// Log the error for debugging
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "failed to fetch events",
			"detail": err.Error(), // include actual DB error
		})
		return
	}

	c.JSON(http.StatusOK, events)
}

func GetEventByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	eventDetails, err := eventRepo.GetEventDetails(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	c.JSON(http.StatusOK, eventDetails)
}
