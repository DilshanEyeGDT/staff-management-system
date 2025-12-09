package models

type User struct {
	ID          int    `db:"id" json:"id"`
	DisplayName string `db:"display_name" json:"display_name"`
}
