package handlers

import (
	"net/http"

	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/repository"
	"github.com/gin-gonic/gin"
)

var tagRepo = repository.NewEventRepository() // reuse EventRepository

func GetTags(c *gin.Context) {
	query := c.Query("query")

	tags, err := tagRepo.GetTagSuggestions(query, 5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestions": tags,
	})
}
