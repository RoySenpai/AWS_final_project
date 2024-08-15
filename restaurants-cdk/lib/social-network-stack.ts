import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';

export class SocialNetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use the labRole provided to the stack
    const labRole = iam.Role.fromRoleArn(this, 'LabRole', "arn:aws:iam::492027459158:role/LabRole", { mutable: false });

    // Create an S3 bucket for profile pictures
    const profilePicturesBucket = new s3.Bucket(this, 'ProfilePicturesBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a DynamoDB table for users
    const usersTable = this.createDynamoDBTable(labRole);

    // Create an S3 bucket for deployment artifacts using the labRole
    const deploymentBucket = this.deployTheApplicationArtifactToS3Bucket(labRole);

    // Environment variables common to all functions
    const commonEnv = {
      USERS_TABLE_NAME: usersTable.tableName,
      BUCKET_NAME: profilePicturesBucket.bucketName,
    };

    // Create Lambda functions for different API operations
    const getUserFunction = this.createUserLambdaFunction('getUser.handler', '../app/getUser', commonEnv, labRole);
    const postUserFunction = this.createUserLambdaFunction('createUser.handler', '../app/createUser', commonEnv, labRole);
    const deleteUserFunction = this.createUserLambdaFunction('deleteUser.handler', '../app/deleteUser', commonEnv, labRole);

    // Create an API Gateway to expose the Lambda functions as a REST API
    const api = this.createApiGateway(getUserFunction, postUserFunction, deleteUserFunction);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });
  }

  private createUserLambdaFunction(handlerName: string, filePath: string, environment: { [key: string]: string }, labRole: iam.IRole): lambda.Function {
    const userHandler = new lambda.Function(this, handlerName, {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(filePath),  // Path to the specific Lambda code file
      handler: 'index.handler',  // Use the handler name passed as an argument
      environment: environment,  // Use the environment variables passed as an argument
      role: labRole,  // Assign the labRole to the Lambda function
    });

    return userHandler;
  }

  private createApiGateway(getUserFunction: lambda.Function, postUserFunction: lambda.Function, deleteUserFunction: lambda.Function): apigateway.RestApi {
    const api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: 'User Service',
      description: 'This service handles user operations for the social network.',
    });

    const users = api.root.addResource('users');

    // Resource for GET /users/{userId}
    const userById = users.addResource('{userId}');
    userById.addMethod('GET', new apigateway.LambdaIntegration(getUserFunction)); // Get a user by ID

    // Resource for POST /users
    users.addMethod('POST', new apigateway.LambdaIntegration(postUserFunction)); // Create a new user

    // Resource for DELETE /users/{userId}
    userById.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserFunction)); // Delete a user by ID

    return api;
  }

  private deployTheApplicationArtifactToS3Bucket(labRole: iam.IRole): s3.Bucket {
    const bucket = new s3.Bucket(this, 'DeploymentArtifact', {
      removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
    });

    new s3Deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3Deployment.Source.asset('./../app', {
        exclude: ['node_modules'],
      })],
      destinationBucket: bucket,
      role: labRole,  // Use labRole for deployment
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
    });

    return bucket;
  }

  private createDynamoDBTable(labRole: iam.IRole): dynamodb.Table {
    const table = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'UserID', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
    });

    return table;
  }
}
