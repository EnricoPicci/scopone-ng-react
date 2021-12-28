#!/usr/bin/env bash

# Build React Front End app
echo "************* Build React Front End app and deploy it to an S3 bucket as a web app *************"
cd ../../client-ng 
npm version patch
npm run build --prod

cd ../serverless-cd/client-ng-s3
npx serverless client deploy --no-confirm
