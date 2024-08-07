import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2  from 'aws-cdk-lib/aws-ec2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const useCacheFlag = true;

    // Students TODO Account Details: Change to your account id
    const labRole = iam.Role.fromRoleArn(this, 'Role', "arn:aws:iam::492027459158:role/LabRole", { mutable: false });

    // Students TODO Account Details: Change the vpcId to the VPC ID of your existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      vpcId: 'vpc-0bcdf49cb26831a94',
    });

    this.createNatGatewayForPrivateSubnet(vpc);

    //const table = this.createDynamoDBTable();

    // Create an S3 bucket
    const deploymentBucket = this.deployTheApplicationArtifactToS3Bucket(labRole);

    // create a amazon linux 2023 user data from node js app that deploy from bucket, 
    // and pass the elastic cache and dynamodb table name in env to the app
    this.deployApplicationInfrastructure(deploymentBucket, vpc, labRole);
  }

  private createNatGatewayForPrivateSubnet(vpc: cdk.aws_ec2.IVpc) {
    // Note for students: This is for cost reduction purposes. you shold not change this code.

    // create elastic IP for nat gateway
    const cfnEip = new ec2.CfnEIP(this, 'MyCfnEIP', {
      domain: 'vpc',
    });

    // create nat gateway for private subnet
    const cfnNatGateway = new ec2.CfnNatGateway(this, 'MyCfnNatGateway', {
      subnetId: vpc.publicSubnets[0].subnetId,
      allocationId: cfnEip.attrAllocationId,
    });

    // create route table for private subnet
    const cfnRouteTable = new ec2.CfnRouteTable(this, 'MyCfnRouteTable', {
      vpcId: vpc.vpcId,
    });

    // create route for private subnet to the nat in case of internet access
    new ec2.CfnRoute(this, 'MyCfnRoute', {
      routeTableId: cfnRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: cfnNatGateway.ref,
    });

    // associate the route table with the private subnet
    vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetRouteTableAssociation(this, `MyCfnSubnetRouteTableAssociation${index}`, {
        routeTableId: cfnRouteTable.ref,
        subnetId: subnet.subnetId,
      });
    });
  }

  private deployApplicationInfrastructure(deploymentBucket: cdk.aws_s3.Bucket, vpc: cdk.aws_ec2.IVpc, labRole: cdk.aws_iam.IRole) {
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash',
      'export NVM_DIR="$HOME/.nvm"',
      '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"',
      '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"',
      'nvm install node',
      'aws s3 cp s3://' + deploymentBucket.bucketName + ' /home/ec2-user --recursive',
      'cd /home/ec2-user',
      'npm install',
      'node index.js'
    );



    // Create AWS Lambda function
    const lambdaFunction = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./../app')
    });
  }

  private deployTheApplicationArtifactToS3Bucket(labRole: cdk.aws_iam.IRole) {
    // Note for students: This is for deployment purposes. you shold not change this code.
    const bucket = new s3.Bucket(this, 'DeploymentArtifact', {
      removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
    });

    // Deploy the website content to the S3 bucket
    new s3Deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3Deployment.Source.asset('./../app', {
        exclude: ['node_modules', '*.test.js'],
      })],
      destinationBucket: bucket,
      role: labRole,
    });

    // Output the bucket name
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
    });
    return bucket;
  }
}
