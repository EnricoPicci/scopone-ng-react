# Deployments

## Build and Deploy React app to AWS S3 bucket as static web server

### Build

From within `client-react` folder run the command `npm run build`.

### Deploy to S3

From within `react-s3-websockets-lambda` folder run the command `serverless client deploy`.

The serverless.yml configuration [serverless.yml](/react-s3-websockets-lambda/serverless.yml) contains the details of the confguration.

The redirect configuration should look like this

```[
    {
        "Condition": {
            "HttpErrorCodeReturnedEquals": "404"
        },
        "Redirect": {
            "ReplaceKeyWith": ""
        }
    }
]
```

Please check since this is not currently supported by the `serverless-finch` plugin used to deploy. A PR has been raised but not yet accepted.
