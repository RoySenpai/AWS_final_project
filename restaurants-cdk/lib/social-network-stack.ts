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

    // Create a Lambda function for user operations (create, get, delete)
    const userHandler = this.createUserLambdaFunction(usersTable, profilePicturesBucket, labRole);

    // Create an API Gateway to expose the Lambda function as a REST API
    const api = this.createApiGateway(userHandler);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });
  }

  private createUserLambdaFunction(usersTable: dynamodb.Table, profilePicturesBucket: s3.Bucket, labRole: iam.IRole): lambda.Function {
    const userHandler = new lambda.Function(this, 'UserHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('../app'),  // Ensure the path to your lambda code is correct
      handler: 'index.handler',
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        BUCKET_NAME: profilePicturesBucket.bucketName,
      },
      role: labRole,  // Assign the labRole to the Lambda function
    });

    // Grant the Lambda function read/write permissions to the DynamoDB table
    usersTable.grantReadWriteData(userHandler);

    // Grant the Lambda function read/write permissions to the S3 bucket
    profilePicturesBucket.grantReadWrite(userHandler);

    return userHandler;
  }

  private createApiGateway(userHandler: lambda.Function): apigateway.RestApi {
    const api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: 'User Service',
      description: 'This service handles user operations for the social network.',
    });

    const users = api.root.addResource('users');
    users.addMethod('POST', new apigateway.LambdaIntegration(userHandler)); // Create a new user
    users.addMethod('GET', new apigateway.LambdaIntegration(userHandler)); // Get a user by ID
    users.addMethod('DELETE', new apigateway.LambdaIntegration(userHandler)); // Delete a user by ID

    const profile = users.addResource('profile');
    profile.addMethod('POST', new apigateway.LambdaIntegration(userHandler)); // Upload profile picture

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
