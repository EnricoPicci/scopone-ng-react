#!/usr/bin/env bash

# Build React Front End app
echo "************* Build React Front End app and deploy it to an S3 bucket as a web app *************"
cd ../../client-react 
npm version patch
npm run build

cd ../serverless-cd/client-react-s3
npx serverless client deploy --no-confirm
