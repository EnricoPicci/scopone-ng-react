#!/usr/bin/env bash

# Build React Front End app
echo "************* Build React Front End app *************"
cd ../../client-react 
npm run build
npm version patch

