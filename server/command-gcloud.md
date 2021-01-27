# Scopone Gorilla WebSocket server deployed on Google Applicatoin Engine (GAE)

It is possible to deploy the Scopone Gorilla WebSocket server on the fully managed cluster provided by GAE.

## Careful with COSTS

At the time of writing, GAE supports WebSockets only with its "flexible" offering which does not have any free-plan, so the server, any time is active, is going to cost money. So remember to STOP the WebSocket server if not used.

# Before you start

If not already familiar with Google Application Engine, read
https://cloud.google.com/appengine/docs/flexible/go/quickstart#before-you-begin

# Create GAE project

Install the Google Application Engine CLI and create the project launching in sequence the following commands

`gcloud projects create scopone-server`
`gcloud projects describe scopone-server`
`gcloud app create --project=scopone-server`

This last command will respond with a message similar to this
`Creating App Engine application in project [scopone-server] and region [europe-west6]....done.`

Conclude the creation of the project with the following command
`gcloud components install app-engine-go`

# DEPLOY the app to Google Application Engine

## Copy all source files to "server/src/go-scopone/src"

Copy all the local packages (i.e. server, deck, game, team, osteria) from `server/src` to `server/src/go-scopone/src`.
This seems to be a bug in app deployment for google app engine flexible (see https://blog.cubieserver.de/2019/go-modules-with-app-engine-flexible/).

## Launch the deployment

Open a terminal window and run the following commands
`export GOPATH="your-path-to/scopone/server"`
`cd src/cmd/scopone-mongo` (or any other 'main' package you want to deploy)

Edit the yaml file (`scopone-mongo.yaml` in the folder `src/cmd/scopone-mongo`) and enter the Mongo db connection url, if the version of the app using Mongo is chosen.

To create a specific version of the application launch the following command
`gcloud app deploy scopone-mongo.yaml --version v2 --project=scopone-server` (in this case we create version v2 - version v2 has not to be already created)
To control the status of the applications deployed use the GCP console (https://console.cloud.google.com/appengine/versions?project=scopone-server&serviceId=default&versionssize=50).
If the application is stopped, the deployment may fail. In which case just start the service from the GCP console and run the deployment command again.

To deploy a new version and stop the previous one, run the following command
`gcloud app deploy scopone-mongo-prod.yaml --stop-previous-version --version v8 --project=scopone-server`

At the end of the deployment, if no errors are encountered, a message is printed on the console with the following format
`Deployed service [default] to [https://scopone-server.xx.y.appspot.com]`

From this message it is possible to derive the url of the Web Socket server deployed on GAE. The WebSocket server address will be serverAddress: `ws://scopone-server.xx.y.appspot.com/osteria`.
