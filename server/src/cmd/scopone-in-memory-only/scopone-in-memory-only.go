package main

import (
	"fmt"

	"go-scopone/src/scopone"
	"go-scopone/src/server/srvgorilla"
)

func main() {
	fmt.Println("Scopone in memory (no database) started")

	srvgorilla.Start(&scopone.DoNothingStore{}, &scopone.DoNothingStore{})
}
