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
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export class SocialNetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Existing IAM Role (Lab Role)
    const labRole = iam.Role.fromRoleArn(this, 'LabRole', "arn:aws:iam::492027459158:role/LabRole", { mutable: false });

    // Existing S3 Bucket for Profile Pictures
    const profilePicturesBucket = this.createS3Bucket('ProfilePicturesBucket');

    // Existing DynamoDB Table for users
    const usersTable = this.createDynamoDBTable('UsersTable', 'UserID', null, labRole);

    // New DynamoDB Tables for Posts and Comments
    const postsTable = this.createDynamoDBTable('PostsTable', 'PostID', null, labRole);
    const commentsTable = this.createDynamoDBTable('CommentTable', 'CommentID', null, labRole);

    // New SQS Queue for Sentiment Analysis
    const sentimentAnalysisQueue = this.createSQSQueue('SentimentAnalysisQueue', cdk.Duration.seconds(300), cdk.Duration.days(4));

    // New Environment variables for sentiment analysis
    const sentimentEnv = {
      COMMENTS_TABLE_NAME: commentsTable.tableName,
      POSTS_TABLE_NAME: postsTable.tableName,
      SENTIMENT_ANALYSIS_QUEUE_URL: sentimentAnalysisQueue.queueUrl,
    };

    // Add SQS event source to performSentimentAnalysisFunction
    const sentimentAnalysisEventSource = new lambdaEventSources.SqsEventSource(sentimentAnalysisQueue);
    const performSentimentAnalysisFunction = this.createUserLambdaFunction('sentimentAnalysis.handler', '../app/sentimentAnalysis', sentimentEnv, labRole);
    performSentimentAnalysisFunction.addEventSource(sentimentAnalysisEventSource);

    // Existing Environment variables
    const commonEnv = {
      USERS_TABLE_NAME: usersTable.tableName,
      POSTS_TABLE_NAME: postsTable.tableName,
      COMMENTS_TABLE_NAME: commentsTable.tableName,
      BUCKET_NAME: profilePicturesBucket.bucketName,
      SENTIMENT_ANALYSIS_QUEUE_URL: sentimentAnalysisQueue.queueUrl,
    };

    // Existing Lambda Functions for User Operations
    const getUserFunction = this.createUserLambdaFunction('getUser.handler', '../app/getUser', commonEnv, labRole);
    const postUserFunction = this.createUserLambdaFunction('createUser.handler', '../app/createUser', commonEnv, labRole);
    const deleteUserFunction = this.createUserLambdaFunction('deleteUser.handler', '../app/deleteUser', commonEnv, labRole);
    const generatePresignedUrlFunction = this.createUserLambdaFunction('generatePresignedUrl.handler', '../app/generatePresignedUrl', commonEnv, labRole);

    const addNewPostFunction = this.createUserLambdaFunction('addPost.handler', '../app/addPost', commonEnv, labRole);
    const getNewPostFunction = this.createUserLambdaFunction('getPost.handler', '../app/getPost', commonEnv, labRole);

    // New Lambda Functions for Sentiment Analysis
    const addCommentFunction = this.createUserLambdaFunction('addComment.handler', '../app/addComment', sentimentEnv, labRole);
    const notifyPostOwnerFunction = this.createUserLambdaFunction('notifyOwner.handler', '../app/notifyOwner', sentimentEnv, labRole);

    // Permissions for Sentiment Analysis
    commentsTable.grantReadWriteData(addCommentFunction);
    commentsTable.grantReadWriteData(performSentimentAnalysisFunction);
    postsTable.grantReadWriteData(performSentimentAnalysisFunction);
    postsTable.grantReadWriteData(notifyPostOwnerFunction);
    sentimentAnalysisQueue.grantSendMessages(addCommentFunction);
    sentimentAnalysisQueue.grantConsumeMessages(performSentimentAnalysisFunction);

    // Existing API Gateway setup
    const api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: 'User Service',
      description: 'This service handles user operations for the social network.',
    });

    const usersResource = api.root.addResource('users');
    const userByIdResource = usersResource.addResource('{userId}');
    const profileUploadResource = usersResource.addResource('profileupload');
    const postsResource = api.root.addResource('posts');
    const postGetResource = postsResource.addResource('{postId}');
    const commentsResource = postGetResource.addResource('comments');

    // Resource for GET /users/{userId}
    userByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getUserFunction)); // Get a user by ID

    // Resource for POST /users
    usersResource.addMethod('POST', new apigateway.LambdaIntegration(postUserFunction)); // Create a new user

    // Resource for DELETE /users/{userId}
    userByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserFunction)); // Delete a user by ID

    // Resource for POST /users/profileupload
    profileUploadResource.addMethod('POST', new apigateway.LambdaIntegration(generatePresignedUrlFunction)); // Generate a pre-signed URL for uploading a profile picture

    // Resource for POST /posts
    postsResource.addMethod('POST', new apigateway.LambdaIntegration(addNewPostFunction)); // Add a new post

    // Resource for GET /posts/{postId}
    postGetResource.addMethod('GET', new apigateway.LambdaIntegration(getNewPostFunction)); // Get a post by ID

    // Resource for POST /posts/{postId}/comments
    commentsResource.addMethod('POST', new apigateway.LambdaIntegration(addCommentFunction)); // Add a comment to a post

    

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

  private createDynamoDBTable(tableName: string, pKey: string, sKey: string | null, labRole: iam.IRole): dynamodb.Table {
    var tableProps: dynamodb.TableProps = {
      partitionKey: { name: pKey, type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    };
    
    // Check if sKey is not null, then create a new TableProps object with the sortKey
    if (sKey) {
      tableProps = {
        ...tableProps,
        sortKey: { name: sKey, type: dynamodb.AttributeType.STRING },
      };
    }
    
    const table = new dynamodb.Table(this, tableName, tableProps);
  
    new cdk.CfnOutput(this, `${tableName}Name`, {
      value: table.tableName,
    });
  
    return table;
  }

  private createS3Bucket(bucketName: string): s3.Bucket {
    const bucket = new s3.Bucket(this, bucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, `${bucketName}Name`, {
      value: bucket.bucketName,
    });

    return bucket;
  }

  private createSQSQueue(queueName: string, visibilityTimeout: cdk.Duration, retentionPeriod: cdk.Duration): sqs.Queue {
    const queue = new sqs.Queue(this, queueName, {
      visibilityTimeout: visibilityTimeout,
      retentionPeriod: retentionPeriod,
    });

    new cdk.CfnOutput(this, 'QueueURL', {
      value: queue.queueUrl,
    });

    return queue;
  }
}
