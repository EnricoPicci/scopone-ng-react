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

This project is composed by a server and a client.

The Server is a Go application with the server code contained in the `server` folder. The server can be connected to a mongodb to store the state of the games.

The client code is in 2 versions

- Angular (currently at version 9) contained in the `client-ng` folder
- React (currently at version 17) contained in the `client-react` folder

Client and Server use WebSocket protocol to communicate.

There are also other folders at the top of the workspace.

- `scopone-rx-service`: contains the code which implements a service which is shared by both clients, the Angular and the React one
- `serverless-cd`: contains the scripts that implement the CD logic, i.e. the script that allow to build and deploy the entire app, both client and server

## Server

The server is implemented in Go.

Server code is in the `server/src` folder.

The server implements the WebSocket server which clients connect to.

The server can be deployed as either a standard WebSocket server implemented using the [Gorilla](https://www.gorillatoolkit.org) library or as an AWS Lambda function. [This article](https://medium.com/better-programming/websockets-on-demand-with-aws-lambda-serverless-framework-and-go-616bd7ff11c9) describes how WebSockets can work with Lambda.

### Standard Gorilla WebSocket server

When using the server as a standard Gorilla WebSockets server (opposed to a WebSocket server delpoyed as Lambda), it can be launched with and without the support of a Mongo database where details of the games are registered.

If Mongo db is used, the server can be stopped and, when it restarts, all games information will be retrieved and the game can continue from where it was left when the server was stopped.

If Mongo db is not used, then if the server stops, all information will be lost and when it restarts all games and players will have been lost.

The commands to launch the standard Gorilla WebSocket server are the main packages found as subfolders in `server/src/cmd`.

### WebSocket server deployed as AWS Lambda function

In case we deploy the WebSocket server as AWS Lambda function, the entry point of the server application is the `main` function in the `main.go` file in `src/server/srvlambda` folder.

### Unit test the server

To unit test the server move to the `server` folder and run the command `go test ./...`

## Gorilla WebSocket server

### Install and launch the Gorilla WebSocket server

It is possible to install the Server following the Go standards (see https://stackoverflow.com/questions/30612611/what-does-go-build-build-go-build-vs-go-install for more details on installing Go apps).

The `main` packages are organized as subfolders of `server/src/cmd`.

To install the server app of choice (i.e. the one with Mongo db or the one without), open either `server/src/cmd/scopone-in-memory-only/scopone-in-memory-only.go` or `server/src/cmd/scopone-mongo/scopone-mongo.go`, run the go command `install package` from within VSCode (view->command pallette...->`GO: install current package`)

It is possible to install the package of choice launching the `go install` command from withing the folder of the main package (i.e. one of the packages under `src/cmd` folder).

Once installed, the server can be launched with the command `MONGO_CONNECTION="mongoConnectionUrl" ~/go/bin/scopone-mongo` (where the `mongoConnectionUrl` points to the Mongo server - for instance, in case of Mongo Atlas, `mongodb+srv://user:password@my-cluster.mongodb.net/scopone?retryWrites=true&w=majority`).

If we choose the version without Mongo db, the command to launch the server is `~/go/bin/scopone-in-memory-only`.

### BUILD and launch the Gorilla WebSocket server

To build the server app, move to the folder `server` and launch the command `go build -o scopone-app ./src/cmd/scopone-mongo` (or `go build -o scopone-app ./src/cmd/scopone-in-memory-only` for the version which does not use Mongo db).
This command creates the executable `scopone-app` in the `server` folder.

Once built, the server can be launched with the command `MONGO_CONNECTION="mongoConnectionUrl" ./scopone-app`

(`MONGO_CONNECTION` is not required in case the package built is the one that does not use Mongo db).

### Create a Docker image for the Gorilla WebSocket server and launch it with Docker

To build a Docker image for the Scopone server

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

Install the Serverless Framework locally using the command `npm install`. Note that the file `package.json` is present in the `server` forder just to allow install the [Serveless Framework](https://www.serverless.com/).

The url of the mongo database to be used has to be set in the `server/.env`. Copy the file `server/.env-sample` to `server/.env` file and change the value of the `MONGO_CONNECTION` variable to the connection string pointing to the mongo db instance to be used (the form of the connection string should be in this format `mongodb+srv://user:password@my-cluster.mongodb.net/scopone?retryWrites=true&w=majority`).

To deploy the package as AWS Lambda run the command `npx sls deploy`.
The `serverless.yml` can be found in the `server` folder.

If the deployment succeeds, it prints on the console the url for the endpoint of the WebSocket server (in a format similar to `wss://an-id-of-endpoint.execute-api.an-aws-region.amazonaws.com/dev`). Take note of it since it will be used to configure the client.

## Test WebSocket server APIs

### Test the server from VSCode playing an entire game with standalone service (e.g. with the service in "scopone-rx-service" folder)

Start the server in one of the possible ways:

- go to the server folder with `cd server`and launch the server with `~/go/bin/server`
- launch with Docker with the command `docker run -p 8080:8080 scopone-server`
- deploying the server as a Lambda web socket server

If mongodb is used, then make sure the database is clean. i.e. there are no collection related to Scopone app. All tests can be repeated without having to cleanup the DB, but it may happen that for uncontrolled reasons the DB is left in a state which does not allow to complete the tests, so it is convenient to clean up the db to run the first set of tests.

Set the WebSocket server url as value of the property `serverAddress` in the file `scopone-rx-service/src/environments/environment.ts`. If the WebSocket server has been launched locally, then the url is probably something like this `ws://localhost:8080/osteria`. Otherwise specify the url to be used (e.g. in case of Lambda server, the url would look something like this `wss://my-end-point.execute-api.us-east-1.amazonaws.com/dev`).

Go to the scopone-rx-service (`cd scopone-rx-service` from the workspace folder. Open VSCode from there with the command `code .` and from within VSCode, open the file `service.mocha-play-game.ts`. Go to the VSCode Debug window, select "Current TS Tests File" in the Run drop down list and launch.

This test creates a new game and plays an entire hand (i.e. plays all 40 cards) and checks that everything works from a WebSockets API point of view.

### Start the first hand of a game and play 36 cards

Do the same steps described in the "Test the server from VSCode" section, but launch the file `scopone-server.service.play-39-cards.ts`. This test creates a new game and plays the first hand for 36 cards.
This allows a tester to log in the server from the front end and test the end of an hand without having to play all cards.

## Angular Client (client-ng folder)

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
