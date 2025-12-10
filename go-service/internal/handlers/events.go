package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func TagSuggest(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "POST tag suggest"})
}

func GetTags(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "GET tags"})
}
