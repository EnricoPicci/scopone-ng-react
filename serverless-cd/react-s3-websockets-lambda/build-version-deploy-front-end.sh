#!/usr/bin/env bash

# Build React Front End app
echo "************* Build React Front End app *************"
cd ../../client-react 
npm version patch
npm run build

cd ../serverless-cd/react-s3-websockets-lambda
npx serverless client deploy
