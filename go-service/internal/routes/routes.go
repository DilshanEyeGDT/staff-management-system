package routes

import (
	"github.com/DilshanEyeGDT/staff_management_system/go-service/internal/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")

	api.GET("/events", handlers.GetPagedEvents)                // done
	api.GET("/events/:id", handlers.GetEventByID)              // done
	api.POST("/events", handlers.CreateEvent)                  // done
	api.PATCH("/events/:event_id", handlers.UpdateEvent)       // done
	api.POST("/events/:id/moderate", handlers.ModerateEvent)   // done
	api.POST("/events/:id/broadcast", handlers.BroadcastEvent) // done
	api.POST("/events/tag-suggest", handlers.TagSuggest)

	api.GET("/tags", handlers.GetTags)

	// New User Endpoint								 		// done
	api.GET("/users", handlers.GetUsers)

	// Health check										 		// done
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
