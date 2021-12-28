#!/usr/bin/env bash


echo "************* Build and Deploy Server to AWS Lambda *************"

cd ../../server 
# build the server
env GOOS=linux go build -ldflags="-s -w" -o ./bin/handleRequest ./src/server/srvlambda

# $1 is the first argument passed to the script, see https://www.baeldung.com/linux/use-command-line-arguments-in-bash-script
npx serverless deploy
