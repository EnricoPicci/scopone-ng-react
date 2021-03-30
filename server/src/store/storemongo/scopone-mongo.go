// Package storemongo implements the store usign Mongo
package storemongo

import (
	"context"
	"log"
	"os"
	"time"

	"go-scopone/src/player"
	"go-scopone/src/scopone"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

const dbname = "scopone"

const (
	playerEntriesCollName string = "playerEntries"
	gamesCollName         string = "games"
)

// Store is the mongodb reference
type Store struct {
	db *mongo.Database
}

// Connect to db
func Connect(ctx context.Context) *Store {
	// Database Config
	connString := os.Getenv("MONGO_CONNECTION")
	if connString == "" {
		panic("mongo connection string has not been provided - please set it in the env var MONGO_CONNECTION")
	}
	clientOptions := options.Client().ApplyURI(connString)
	client, err := mongo.NewClient(clientOptions)
	if err != nil {
		log.Fatal("Error creating Mongo Client", err)
	}

	err = client.Connect(ctx)
	if err != nil {
		log.Fatal("Error connecting to Mongo", err)
	}

	err = client.Ping(context.Background(), readpref.Primary())
	if err != nil {
		log.Fatal("Couldn't connect to the database", err)
	} else {
		log.Println("Connected!")
	}
	var store = Store{
		db: client.Database(dbname),
	}
	return &store
}

type playerEntry struct {
	Ts     time.Time
	Player string
}

// AddPlayerEntry adds a record in the entry collection representing the fact that a player has entered the Osteria
func (store *Store) AddPlayerEntry(player *player.Player) error {
	entry := playerEntry{}
	entry.Ts = time.Now()
	entry.Player = player.Name
	collection := store.db.Collection(playerEntriesCollName)
	_, err := collection.InsertOne(context.TODO(), entry)
	return err
}

type mgame struct {
	Ts   time.Time
	Game *scopone.Game `bson:"game"`
	// scopone.Game `bson:",inline"`  this is if I want to have game props at the same level as timestamp
}

// WriteGame saves a game to mongo
func (store *Store) WriteGame(g *scopone.Game) error {
	mg := mgame{time.Now(), g}
	collection := store.db.Collection(gamesCollName)
	opts := options.Update().SetUpsert(true)
	// https://stackoverflow.com/a/54548495/5699993
	filter := bson.D{primitive.E{Key: "game.name", Value: g.Name}}
	// https://stackoverflow.com/a/60946010/5699993
	update := bson.M{
		"$set": mg,
	}
	_, err := collection.UpdateOne(context.TODO(), filter, update, opts)
	return err
}

// ReadOpenGames reads from mongo all the games which are not closed
func (store *Store) ReadOpenGames() (games map[string]*scopone.Game, players map[string]*player.Player, err error) {
	// it is important to initialize games and players because we do not want to retun nils but rather
	// empty maps in case no player or games are found in the db
	games = make(map[string]*scopone.Game)
	players = make(map[string]*player.Player)

	collection := store.db.Collection(gamesCollName)
	findOptions := options.Find()

	// Passing bson.D{{}} as the filter matches all documents in the collection
	filter := bson.M{"game.state": bson.M{"$ne": "closed"}}
	cur, err := collection.Find(context.TODO(), filter, findOptions)
	if err != nil {
		log.Print(err)
		return
	}

	for cur.Next(context.TODO()) {
		var elem mgame
		err = cur.Decode(&elem)
		if err != nil {
			log.Print(err)
			return
		}

		g := elem.Game
		games[elem.Game.Name] = g
		// we need to add the players and the observers of any game restored from db to the scopone.Players mapp
		// moreover we need to make sure that the same intances of players are also stored in the game.Teams slice
		gamePlayers := g.Players
		for pK := range gamePlayers {
			p := gamePlayers[pK]
			p.Status = player.PlayerLeftOsteria
			// set the players in the map returned - this map is going to be set into the scopone struct
			players[p.Name] = p
		}
		gameObservers := g.Observers
		for oK := range gameObservers {
			o := gameObservers[oK]
			o.Status = player.PlayerLeftOsteria
			// set the observers in the map returned - this map is going to be set into the scopone struct
			players[o.Name] = o
		}
		// these 2 nested loops make sure that the same instance of players are shared in the Game.Players a d Game.Team
		// attributes - this is necessary since the Decode from mongo create different instances for the same player
		// one instance is placed in game.Players and one in one of the teams stored in game.Teams
		for tI := range g.Teams {
			t := g.Teams[tI]
			for pI := range t.Players {
				gamePlayer := t.Players[pI]
				// the gamePlayere can be nil - this happens when a Game has been created but not all 4 players have been added yet
				if gamePlayer != nil {
					t.Players[pI] = gamePlayers[gamePlayer.Name]
				}
			}
		}
	}

	if err = cur.Err(); err != nil {
		log.Print(err)
		return
	}

	cur.Close(context.TODO())

	return
}

// GetDb returns the mongo db
func (store *Store) GetDb() *mongo.Database {
	return store.db
}
