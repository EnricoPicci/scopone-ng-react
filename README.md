# Scopone

This application implements Scopone, a traditional italian card game.
It allows 4 players to play the game. It supports running more games at the same time, in other words
"tables" of four players can be active at the same time.

- [Steps for a player to play the game](#steps-for-a-player-to-play-the-game)
- [Project structure](#project-structure)
- [Server](#server)
- [Gorilla WebSocket server](#gorilla-websocket-server)
- [WebSocket server with AWS Lambda function](#websocket-server-with-aws-lambda-function)
- [Test WebSocket server APIs](#test-websocket-server-apis)
- [Client architecture and logical structure](#client-architecture-and-logical-structure)
- [Angular Client](#angular-client)
- [React Client](#react-client)
- [CI/CD scripts](#cicd-scripts)

## Steps for a player to play the game

A player needs to open the web application to start playing. The specific steps are

1. Launch the application from a browser
2. Enter the name of the player
3. Choose the game that the player wants to play or create a new game
4. Once 4 players join the game, the game a button to start the game appears on the screen of each player and the first player who clicks on that button will actually start the game and will be the first player to play a card
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

### Build and launch the Gorilla WebSocket server

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

### Build

To build the package ready to be deployed as AWS Lambda function, from within the folder `server` run the command `env GOOS=linux go build -ldflags="-s -w" -o ./bin/handleRequest ./src/server/srvlambda`.
This command builds an executable named `./bin/handleRequest`.

### Deployment

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

## Client architecture and logical structure

There are 2 different implementations of the client, one built with Angular and one built with React. They are implmemented in the `client-ng` and `client-react` folders respectively.

While Angular and React are different in many ways, they share one important idea: both are **component based** and the views built with them are, or shuold be, built using the composition pattern. In other words the final UI is the result of composing different simpler smaller components and components can be reused throughout different pages of the UI as long as they provide the right level of customization.

The clients are based on the following basic principles:

- The logic is divided into
  - View layer, implemented via Components (Angular or React components)
  - Service layer, implemented by the **ScoponeServerService** whose code can be found in the `scopone-rx-sevice` folder
- Components are light, in other words they are responsible only for
  - Intercept UI generated events and tranform them into commands to be sent to an external service
  - Subscribe to the streams of events, relevant for the specific Component, which are published by the external service
- The service **ScoponeServerService** is the core of the UI logic. It is implemented as pure TypeScript logic, with no dependencies on either Angular or React. The service layer exposes 2 types of APIs
  - Standard APIs, implemented as methods of the service, which can be called by components when the components what to send a command. Usually (\* see below for further explanation of "ususally") the service takes the command invocation parameters and turn it into a command to be sent to the back end server using the web socket channel.
  - Stream APIs, implemented as RxJs Observables. These are streams of events that the service makes available to components for subscription. Components which are interested in specific events can subscribe to the relevant Observable and implement, as side effect of notifications, **_*updates in the UI*_** as results of the notifications received.
- The net division between UI components layers and service layer and the clear responsibility set on the service layer allow to have light components and have the vast majority of the logic implemented in the service layer, which being standard TypeScript code with no dependenciy on either Angular or React becomes much easier to test.

(\*) We say "usually sends the command to the remote service" since this is not mandatory. The key concern of the **ScoponeServerService** is to turn a command received into notifications on the various streams of events that it publishes, and this can be performed also without sending a command to the back end server.

Both clients, the Angular and the React one, share the same service, **ScoponeServerService** implemented in the `scopone-rx-sevice` folder

**ScoponeServerService** is implemented in the folder `scopone-rx-sevice` folder and is imported in both the Angular and the React clients.

## Angular Client

The Client is an Angular application, currently using version 9 of the framework.

The code is stored in the `client-ng` folder,

### Configuration of the connection with the server for the Angular client

The connection with the server is configured using the files contained in the folder `client/src/environments`.

The file `client/src/environments/environment.ts` is used during development.
The file `client/src/environments/environment.prod.ts` is used when building the app for production.

The connection url for the WebSocket server has to be set in the property `serverAddress` of either `client/src/environments/environment.ts` or `client/src/environments/environment.prod.ts`. For instance, in case of a WebSocket server running locally, the configuration would be `serverAddress: 'ws://localhost:8080/osteria'`.

### Launch a development web server

To launch a development web server, with hot reload, run the following command
`ng serve`

### Build the front end app for deployment to production

To build the application for deployment to production, run the command
`ng build --prod`

## React Client

The Client is a React application, currently using version 17 of the library.

The code is store in the `client-react` folder.

The project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Read more details in the `readme.md` file in the folder of the React client.

### Configuration of the connection with the server for the React client

The connection with the server is configured using the mechanism provided by [Create React App to set environment variables](https://create-react-app.dev/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env).

The connection string needs to be set using the `REACT_APP_SERVER_ADDRESS` variable defined in the following files

- .env.development for the development environment
- .env.production for the production environment

These files override what is defined in the `.env` file

For instance, in case a local installation of the server is used, the configuration looks like

`REACT_APP_SERVER_ADDRESS=ws://localhost:8080/osteria`

### Launch a development web server

To launch a development web server, run the following command
`npm run start`

### Build the front end app for deployment to production

To build the application for deployment to production, run the command
`npm run build`

## CI/CD scripts

The scripts to automatically build and deploy the client and the server parts of the app are contained in the `serverless-cd` folder.

### Deploy the server as a Lambda function

To deploy the server as a Lambda function move to the `serverless-cd/server-lambda` folder and run the command

- `bash deploy-server-to-lambda.sh`

At the end of the execution, if successful, the script prints the address of the Lambda server to be used in the configuration of the clients with a message similar to this

`endpoints: wss://abcdef.execute-api.us-east-1.amazonaws.com/dev`

The address `wss://abcdef.execute-api.us-east-1.amazonaws.com/dev` has to be used as the url of the remote server in the configuration of the Angulra and React clients (see above instruction to know how to set this value for the different clients).

### Deploy the Angular client to an S3 bucket and set the bucket for website hosting

To build the Angular client for production and deploy it on an S3 bucket configure to host websites, move to the `serverless-cd/client-ng-s3` folder and run the command

- `bash build-deploy-ng-front-end.sh`

### Deploy the React client to an S3 bucket and set the bucket for website hosting

To build the React client for production and deploy it on an S3 bucket configure to host websites, move to the `serverless-cd/client-react-s3` folder and run the command

- `bash build-deploy-react-front-end.sh`
