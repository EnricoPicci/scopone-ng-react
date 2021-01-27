package main

import (
	"context"
	"fmt"
	"time"

	"go-scopone/src/server/srvgorilla"
	"go-scopone/src/store/storemongo"
)

func main() {
	fmt.Println("Scopone with Mongo store started")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	store := storemongo.Connect(ctx)

	srvgorilla.Start(store, store)
}
