import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SocialNetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Existing IAM Role (Lab Role)
    const labRole = iam.Role.fromRoleArn(this, 'LabRole', "arn:aws:iam::492027459158:role/LabRole", { mutable: false });

    // Existing S3 Bucket for Profile Pictures
    const profilePicturesBucket = new s3.Bucket(this, 'ProfilePicturesBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Existing DynamoDB Table for users
    const usersTable = this.createDynamoDBTable(labRole);

    // console.log('Table Name: ' + usersTable.tableName);

    // New DynamoDB Tables for Posts and Comments
    const postsTable = new dynamodb.Table(this, 'PostsTable', {
      partitionKey: { name: 'PostID', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const commentsTable = new dynamodb.Table(this, 'CommentsTable', {
      partitionKey: { name: 'CommentID', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PostID', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // New SQS Queue for Sentiment Analysis
    const sentimentAnalysisQueue = new sqs.Queue(this, 'SentimentAnalysisQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(4),
    });

    // New SNS Topic for Sentiment Notifications
    const sentimentNotificationTopic = new sns.Topic(this, 'SentimentNotificationTopic');
    sentimentNotificationTopic.addSubscription(new snsSubscriptions.EmailSubscription('owner@example.com'));

    // Existing Environment variables
    const commonEnv = {
      USERS_TABLE_NAME: usersTable.tableName,
      BUCKET_NAME: profilePicturesBucket.bucketName,
    };

    // New Environment variables for sentiment analysis
    const sentimentEnv = {
      COMMENTS_TABLE_NAME: commentsTable.tableName,
      POSTS_TABLE_NAME: postsTable.tableName,
      SENTIMENT_ANALYSIS_QUEUE_URL: sentimentAnalysisQueue.queueUrl,
      NOTIFICATION_TOPIC_ARN: sentimentNotificationTopic.topicArn,
    };

    // Existing Lambda Functions for User Operations
    const getUserFunction = this.createUserLambdaFunction('getUser.handler', '../app/getUser', commonEnv, labRole);
    const postUserFunction = this.createUserLambdaFunction('createUser.handler', '../app/createUser', commonEnv, labRole);
    const deleteUserFunction = this.createUserLambdaFunction('deleteUser.handler', '../app/deleteUser', commonEnv, labRole);
    const generatePresignedUrlFunction = this.createUserLambdaFunction('generatePresignedUrl.handler', '../app/generatePresignedUrl', commonEnv, labRole);

    // New Lambda Functions for Sentiment Analysis
    const addCommentFunction = this.createUserLambdaFunction('addComment.handler', '../app/addComment', sentimentEnv, labRole);
    const performSentimentAnalysisFunction = this.createUserLambdaFunction('sentimentAnalysis.handler', '../app/sentimentAnalysis', sentimentEnv, labRole);
    const notifyPostOwnerFunction = this.createUserLambdaFunction('notifyOwner.handler', '../app/notifyOwner', sentimentEnv, labRole);

    // Permissions for Sentiment Analysis
    commentsTable.grantReadWriteData(addCommentFunction);
    commentsTable.grantReadWriteData(performSentimentAnalysisFunction);
    postsTable.grantReadWriteData(performSentimentAnalysisFunction);
    postsTable.grantReadWriteData(notifyPostOwnerFunction);
    sentimentAnalysisQueue.grantSendMessages(addCommentFunction);
    sentimentAnalysisQueue.grantConsumeMessages(performSentimentAnalysisFunction);
    sentimentNotificationTopic.grantPublish(notifyPostOwnerFunction);

    // Existing API Gateway setup
    const api = this.createApiGateway(getUserFunction, postUserFunction, deleteUserFunction, generatePresignedUrlFunction);

    // Adding API resource for comments
    const posts = api.root.addResource('posts');
    const postById = posts.addResource('{postId}');
    const comments = postById.addResource('comments');

    // POST /posts/{postId}/comments
    comments.addMethod('POST', new apigateway.LambdaIntegration(addCommentFunction));

    // Output API Gateway URL
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

  private createApiGateway(getUserFunction: lambda.Function, postUserFunction: lambda.Function, deleteUserFunction: lambda.Function, generatePresignedUrlFunction: lambda.Function): apigateway.RestApi {
    const api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: 'User Service',
      description: 'This service handles user operations for the social network.',
    });

    const users = api.root.addResource('users');
    const userById = users.addResource('{userId}');
    const profileUpload = users.addResource('profileupload');

    // Resource for GET /users/{userId}
    userById.addMethod('GET', new apigateway.LambdaIntegration(getUserFunction)); // Get a user by ID

    // Resource for POST /users
    users.addMethod('POST', new apigateway.LambdaIntegration(postUserFunction)); // Create a new user

    // Resource for DELETE /users/{userId}
    userById.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserFunction)); // Delete a user by ID

    // Resource for POST /users/profileupload
    profileUpload.addMethod('POST', new apigateway.LambdaIntegration(generatePresignedUrlFunction)); // Generate a pre-signed URL for uploading a profile picture

    return api;
  }
}
