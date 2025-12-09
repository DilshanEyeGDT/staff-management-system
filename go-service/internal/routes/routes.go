package routes

import (
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")

	api.GET("/events", handlers.GetEvents)
	api.GET("/events/:id", handlers.GetEventByID)
	api.POST("/events", handlers.CreateEvent) // done
	api.PATCH("/events/:id", handlers.UpdateEvent)
	api.POST("/events/:id/moderate", handlers.ModerateEvent)
	api.POST("/events/:id/broadcast", handlers.BroadcastEvent)
	api.POST("/events/tag-suggest", handlers.TagSuggest)

	api.GET("/tags", handlers.GetTags)

	// New User Endpoint
	api.GET("/users", handlers.GetUsers)

	// Health check
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
