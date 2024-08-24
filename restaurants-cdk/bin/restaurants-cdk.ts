#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SocialNetworkStack } from '../lib/social-network-stack';  // Adjust this path if necessary

import { DefaultStackSynthesizer } from 'aws-cdk-lib';

// Customize the synthesizer for deployment
const defaultStackSynthesizer = new DefaultStackSynthesizer({
  fileAssetsBucketName: "cdk-${Qualifier}-assets-${AWS::AccountId}-${AWS::Region}", // S3 bucket for file assets
  bucketPrefix: "",

  imageAssetsRepositoryName: "cdk-${Qualifier}-container-assets-${AWS::AccountId}-${AWS::Region}", // ECR repository for Docker images

  deployRoleArn: "arn:${AWS::Partition}:iam::492027459158:role/LabRole", // Role for deployment
  deployRoleExternalId: "",

  fileAssetPublishingRoleArn: "arn:${AWS::Partition}:iam::492027459158:role/LabRole", // Role for publishing file assets
  fileAssetPublishingExternalId: "",

  imageAssetPublishingRoleArn: "arn:${AWS::Partition}:iam::492027459158:role/LabRole", // Role for publishing image assets
  imageAssetPublishingExternalId: "",

  cloudFormationExecutionRole: "arn:${AWS::Partition}:iam::492027459158:role/LabRole", // Role for CloudFormation execution

  lookupRoleArn: "arn:${AWS::Partition}:iam::492027459158:role/LabRole", // Role for context lookups
  lookupRoleExternalId: "",

  bootstrapStackVersionSsmParameter: "/cdk-bootstrap/${Qualifier}/version", // SSM parameter for bootstrap stack version

  generateBootstrapVersionRule: true, // Enforce the required bootstrap stack version
});

// Initialize the CDK app
const app = new cdk.App();
new SocialNetworkStack(app, 'SocialNetworkStack', {
  synthesizer: defaultStackSynthesizer, // Use the custom synthesizer
  
  // Specify the AWS account and region explicitly
  env: { account: '492027459158', region: 'us-east-1' },
});
