package main

import (
	"log"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	log.Println("main starts")
	lambda.Start(handleRequest)
	log.Println("main ends - this line seems not to be written in the log")
}
