package lambdamongo

import (
	"context"
	"log"
	"time"

	"go-scopone/src/store/storemongo"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Store is the mongodb reference
type Store struct {
	*storemongo.Store
}

// Connect to db
func Connect(ctx context.Context) *Store {
	store := storemongo.Connect(ctx)
	return &Store{store}
}

const (
	connectionsCollName = "connections"
	connActive          = "active"
	connClosed          = "closed"
)

type connectionIDEntry struct {
	CreationTs   time.Time
	DisconnectTs time.Time
	ConnectionID string
	Status       string
	PlayerName   string
}

func (store *Store) activeConnections(ctx context.Context) (*mongo.Cursor, error) {
	collection := store.Store.GetDb().Collection(connectionsCollName)
	filter := bson.M{"status": bson.M{"$eq": "active"}}
	cur, err := collection.Find(ctx, filter)
	if err != nil {
		log.Println("Error while opening the curson on the connection collection", err)
		return nil, err
	}
	return cur, nil
}

// ActiveConnectionIDs returns the connectionIDs - waits for the read from DB to be concluded
func (store *Store) ActiveConnectionIDs(ctx context.Context) ([]string, error) {
	cur, err := store.activeConnections(ctx)

	connections := []string{}
	for cur.Next(ctx) {
		var elem connectionIDEntry
		err = cur.Decode(&elem)
		if err != nil {
			log.Println("Error while reading the cursor", err)
			return nil, err
		}

		connections = append(connections, elem.ConnectionID)
	}
	return connections, nil
}

// ConnectedPlayers returns the names of the players who are connected
func (store *Store) ConnectedPlayers(ctx context.Context) ([]string, error) {
	cur, err := store.activeConnections(ctx)

	players := []string{}
	for cur.Next(ctx) {
		var elem connectionIDEntry
		err = cur.Decode(&elem)
		if err != nil {
			log.Println("Error while reading the cursor", err)
			return nil, err
		}

		players = append(players, elem.PlayerName)
	}
	return players, nil

}

// ConnectionIDForPlayer returns the connectionID used buy a certain player at a certain time or error
// if no connectionID is found
func (store *Store) ConnectionIDForPlayer(ctx context.Context, playerName string) (string, error) {
	collection := store.Store.GetDb().Collection(connectionsCollName)
	// https://stackoverflow.com/a/26932712/5699993
	filter := bson.M{
		"$and": []interface{}{
			bson.M{"playername": playerName},
			bson.M{"status": connActive},
		},
	}
	res := collection.FindOne(ctx, filter)
	var elem connectionIDEntry = connectionIDEntry{}
	err := res.Decode(&elem)
	return elem.ConnectionID, err
}

// AddConnectionID adds a record representing a connectionId
func (store *Store) AddConnectionID(ctx context.Context, connectionID string) error {
	entry := connectionIDEntry{}
	entry.CreationTs = time.Now()
	entry.ConnectionID = connectionID
	entry.Status = connActive
	collection := store.Store.GetDb().Collection(connectionsCollName)
	_, err := collection.InsertOne(ctx, entry)
	return err
}

// AddPlayerToConnectionID adds the player info to the connectionID
func (store *Store) AddPlayerToConnectionID(ctx context.Context, connectionID string, playerName string) error {
	collection := store.Store.GetDb().Collection(connectionsCollName)
	// https://stackoverflow.com/a/54548495/5699993
	filter := bson.D{primitive.E{Key: "connectionid", Value: connectionID}}
	// https://stackoverflow.com/a/23583746/5699993
	update := bson.M{
		"$set": bson.M{"playername": playerName},
	}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// MarkConnectionIDDisconnected marks a connectionID as disconnected
func (store *Store) MarkConnectionIDDisconnected(ctx context.Context, connectionID string) error {
	collection := store.Store.GetDb().Collection(connectionsCollName)
	// https://stackoverflow.com/a/54548495/5699993
	filter := bson.D{primitive.E{Key: "connectionid", Value: connectionID}}
	// https://stackoverflow.com/a/23583746/5699993
	update := bson.M{
		"$set": bson.M{"disconnectts": time.Now(), "status": connClosed},
	}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}
