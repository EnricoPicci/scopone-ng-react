# Scopone

This application implements Scopone, a traditional italian card game.
It allows 4 players to play the game. It supports running more games at the same time, in other words
"tables" of four players can be active at the same time.

## Steps for a player to play the game

A player needs to open the web application to start playing. The specific steps are

1. Launch the application from a browser
2. Enter the name of the player
3. Choose the game that the player wants to play or create a new game
4. Once 4 players join the game, the game actually starts
5. The server shuffles a deck of cards and distribute 10 cards to each player to start a new hand
6. Players play in sequence untill all cards are played
7. When all cards of an hand are played, the hand is closed and the result is shown to each player
8. Player can continue the game with the next hand or stop playing
9. If a player exit the game at any time, maybe by just closing the browser, the game is interrupted
10. The game restart from where it was left once all players are connected again

## Project structure

This project is composed by a client and a server.
Server code is in the `server` folder, while client code is contained in the `client` folder.
The client is an Angular application, currently on version 9.
The Server is a Go application.
Client and Server use WebSocket protocol to communicate.

## Server

The server is implemented in Go.
Server code is in the `src` folder.
The server implements the WebSocket server which clients connect to.
The server can be deployed as either a standard WebSocket server implemented using the [Gorilla](https://www.gorillatoolkit.org) library or as an AWS Lambda function. [This article](https://medium.com/better-programming/websockets-on-demand-with-aws-lambda-serverless-framework-and-go-616bd7ff11c9) describes how WebSockets can work with Lambda.

### Standard Gorilla WebSocket server

When using the server as a standard Gorilla WebSockets server (opposed to a WebSocket server delpoyed as Lambda), it can be launched with and without the support of a Mongo database where details of the games are registered.
If Mongo db is used, the server can be stopped and, when it restarts, all games information will be retrieved and the game can continue from where it was left when the server stopped.
If Mongo db is not used, then if the server stops, all information will be lost and when it restarts all games and players will have been lost.

The entry points of the standard Gorilla WebSocket server are the main packages found as subfolders in `server/src/cmd`.

### WebSocket server deployed as AWS Lambda function

In case we deploy the WebSocket server as AWS Lambda function, the entry point of the application is the `main` function in the `main.go` file in `src/server/srvlambda` folder.

### Unit test the server

To unit test the server move to the `server` folder and run the command `go test ./...`

## Gorilla WebSocket server

### Install and launch the Gorilla WebSocket server

It is possible to install the Server following the Go standards (see https://stackoverflow.com/questions/30612611/what-does-go-build-build-go-build-vs-go-install for more details on installing Go apps).
The `main` packages are organized as subfolders of `server/src/cmd`.

To install the server app of choice (i.e. the one with Mongo db or the one without), open either `server/src/cmd/scopone-in-memory-only/scopone-in-memory-only.go` or `server/src/cmd/scopone-mongo/scopone-mongo.go`, run the go command `install package` from within VSCode (view->command pallette...->`GO: install current package`)
It is possible to install the package of choice launching the `go install` command from withing the folder of the main package (i.e. one of the packages under `src/cdm` folder).

Once installed, the server can be launched with the command `MONGO_CONNECTION="mongoConnectionUrl" ~/go/bin/scopone-mongo` (wherthee `mongoConnectionUrl` points to the Mongo server - for instance, in case of Mongo Atlas, `mongodb+srv://user:password@my-cluster.mongodb.net/scopone?retryWrites=true&w=majority`).
If the version without Mongo db, the command to launch the server is `~/go/bin/scopone-in-memory-only`.

### BUILD and launch the Gorilla WebSocket server

To build the server app, move to the folder `server` and launch the command `go build -o scopone-app ./src/cmd/scopone-mongo` (or `go build -o scopone-app ./src/cmd/scopone-in-memory-only` for the version which does not use Mongo db).
This command creates the executable `scopone-app` in the `server` folder.

Once built, the server can be launched with the command `MONGO_CONNECTION="mongoConnectionUrl" ./mongo-app` (`MONGO_CONNECTION` is not required in case the package built is the one that does not use Mongo db).

### Create a Docker image for the Gorilla WebSocket server and launch it with Docker

To build a pretty optimized Docker image for the Scopone server

1. Edit the file `server/Dockerfile-minimal-mongo` to set the environmnet variable `MONGO_CONNECTION` with the value of the mongo connection url
2. run the following command `docker build -t scopone-server -f Dockerfile-minimal-mongo .`

To start the WebSocket server with Docker run the command
`docker run -p 8080:8080 scopone-server`

### Deploy the Gorilla WebSocket server on Google Application Engine (GAE)

It is possible to deploy the WebSocket server on GAE. Follow the instructions described in the file `command-gcloud.md`.
At the time of writing, GAE supports WebSockets only with its "flexible" offering which does not have any free-plan, so the server, any time is active, is going to cost money. So remember to STOP the WebSocket server if not used.

### Ping the Gorilla WebSocket server

Once the server is launched, it is possible to ping it from a browser invoking the url `https://myhost/` (in case of local installation of the server use the url `http://localhost:8080/`).
If the server is up and running, it responds with a simple "Home page" that should appear on the browser.

## WebSocket server with AWS Lambda function

### BUILD

To build the package ready to be deployed as AWS Lambda function, from within the folder `server` run the command `env GOOS=linux go build -ldflags="-s -w" -o ./bin/handleRequest ./src/server/srvlambda`.
This command builds an executable named `./bin/handleRequest`.

### DEPLOYMENT

To deploy the package as AWS Lambda function, the [Serveless Framework](https://www.serverless.com/) is used.
Install the Serverless Framework if not already installed (see https://www.serverless.com/framework/docs/getting-started/ for instruction on how to install it).
To deploy the package as AWS Lambda run the command `sls deploy --mongo_connection "mongoConnectionUrl" --mongo_database scopone_lambda`.
The `serverless.yml` can be found in the `server` folder.

If the deployment succeeds, it prints on the console the url for the endpoint of the WebSocket server (in a format similar to `wss://an-id-of-endpoint.execute-api.an-aws-region.amazonaws.com/dev`). Take note of it since it will be used to configure the client.

## Test WebSocket server APIs

### Test the server from VSCode playing an entire game

Go to the server folder with `cd server`.
Launch the server with `~/go/bin/server`.
Set the WebSocket server url as value of the property `serverAddress` in the file `client/src/environments/environment.ts`. If the WebSocket server has been launched locally, then the url is `ws://localhost:8080/osteria`. Otherwise specify the url to be used.

From within VSCode, open the file `client/src/app/scopone/scopone-server.service.mocha-play-game.ts`. Go to the VSCode Debug window, select "Current TS Tests File (client)" in the Run drop down list and launch.

This test creates a new game and plays an entire hand (i.e. plays all 40 cards) and checks that everything works from a WebSockets API point of view.

### Start the first hand of a game and play 36 cards

Do the same steps described in the "Test the server from VSCode" section, but launch the file `scopone-server.service.play-39-cards.ts`. This test creates a new game and plays the first hand for 36 cards.
This allows a tester to log in the server from the front end and test the end of an hand without having to play all cards.

## Client

The Client is an Angular application, currently using version 9 of the framework.

### Configuration of the connection with the server

The connection with the server is configured using the files contained in the folder `client/src/environments`.

The file `client/src/environments/environment.ts` is used during development.
The file `client/src/environments/environment.prod.ts` is used when building the app for production.

The connection url for the WebSocket server has to be set in the property `serverAddress` of either `client/src/environments/environment.ts` or `client/src/environments/environment.prod.ts`. For instance, in case of a WebSocket server running locally, the configuration would be `serverAddress: 'ws://localhost:8080/osteria'`.

### Launch development web server

To launch a development web server, with hot reload, launch the following command
`ng serve`

### Build the front end app for deployment to production

To build the application for deployment to production, run the command
`ng build --prod`
