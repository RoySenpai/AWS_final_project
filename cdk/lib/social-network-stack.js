const cdk = require('aws-cdk-lib');
const { App, Stack } = cdk;
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const iam = require('aws-cdk-lib/aws-iam');

class SocialNetworkStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Students TODO Account Details: Change to your account id
    const labRole = iam.Role.fromRoleArn(this, 'Role', "arn:aws:iam::492027459158:role/LabRole", { mutable: false });

    // Students TODO Account Details: Change the vpcId to the VPC ID of your existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      vpcId: 'vpc-0bcdf49cb26831a94',
    });

    // DynamoDB table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // Lambda functions
    const createUserLambda = new lambda.Function(this, 'CreateUserLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'createUser.handler',
      code: lambda.Code.fromAsset('../src'),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: labRole,
    });

    const deleteUserLambda = new lambda.Function(this, 'DeleteUserLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'deleteUser.handler',
      code: lambda.Code.fromAsset('../src'),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: labRole,
    });

    const getUserLambda = new lambda.Function(this, 'GetUserLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'getUser.handler',
      code: lambda.Code.fromAsset('../src'),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: labRole,
    });

    // Grant permissions to Lambda functions
    usersTable.grantReadWriteData(createUserLambda);
    usersTable.grantReadWriteData(deleteUserLambda);
    usersTable.grantReadData(getUserLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'social-network-api', {
      restApiName: 'Social Network Service',
    });

    const users = api.root.addResource('users');
    const user = users.addResource('{userId}');

    users.addMethod('POST', new apigateway.LambdaIntegration(createUserLambda));
    user.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserLambda));
    user.addMethod('GET', new apigateway.LambdaIntegration(getUserLambda));
  }
}

const app = new App();
new SocialNetworkStack(app, 'SocialNetworkStack', {
  env: {
    account: '492027459158',
    region: 'us-east-1',
  },
});
app.synth();