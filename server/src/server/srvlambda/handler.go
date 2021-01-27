package main

import (
	"context"
	"log"
	"net/http"

	"go-scopone/src/scopone"
	"go-scopone/src/server/srvlambda/lambdamongo"

	"github.com/aws/aws-lambda-go/events"
)

type connectionStorer interface {
	ActiveConnectionIDs(ctx context.Context) ([]string, error)
	ConnectedPlayers(ctx context.Context) ([]string, error)
	ConnectionIDForPlayer(ctx context.Context, playerName string) (string, error)
	AddConnectionID(ctx context.Context, connectionID string) error
	AddPlayerToConnectionID(ctx context.Context, connectionID string, playerName string) error
	MarkConnectionIDDisconnected(ctx context.Context, connectionID string) error
}

var connectionStore connectionStorer
var playerStore scopone.PlayerWriter
var gameStore scopone.GameReadWriter

func handleRequest(ctx context.Context, event events.APIGatewayWebsocketProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Println("Lambda Handle Request started")

	if connectionStore == nil {
		store := lambdamongo.Connect(ctx)
		connectionStore = store
		playerStore = store
		gameStore = store
	}

	rc := event.RequestContext
	switch rk := rc.RouteKey; rk {
	case "$connect":
		log.Println("Connect", rc.ConnectionID)
		err := connectionStore.AddConnectionID(ctx, rc.ConnectionID)
		if err != nil {
			return events.APIGatewayProxyResponse{
				StatusCode: http.StatusInternalServerError,
			}, err
		}
		break
	case "$disconnect":
		log.Println("Disconnect", rc.ConnectionID)
		err := connectionStore.MarkConnectionIDDisconnected(ctx, rc.ConnectionID)
		if err != nil {
			return events.APIGatewayProxyResponse{
				StatusCode: http.StatusInternalServerError,
			}, err
		}
		break
	case "$default":
		log.Println("Default - Handle Commands", rc.ConnectionID, event.Body)
		err := handleCommand(ctx, event, connectionStore, playerStore, gameStore)
		if err != nil {
			return events.APIGatewayProxyResponse{
				StatusCode: http.StatusInternalServerError,
			}, err
		}
		break
	default:
		log.Fatalf("Unknown RouteKey %v", rk)
	}

	return events.APIGatewayProxyResponse{
		StatusCode: http.StatusOK,
	}, nil
}
