const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
S3.config.update({ region: "us-east-1" });
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const { userId } = JSON.parse(event.body);

    if (!userId) {
      console.error("Validation error: User ID is required");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const fileName = `profile-pictures/${userId}.jpg`;
    const bucketName = process.env.BUCKET_NAME;
    console.log("Bucket Name:", bucketName);

    console.log("Fetching user to verify existence with UserID:", userId);
    const userParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId }
    };
    console.log("DynamoDB get params:", JSON.stringify(userParams, null, 2));

    const userResult = await dynamoDb.get(userParams).promise();

    
    if (!userResult.Item) {
      console.error("User not found for UserID:", userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    else {
      console.log("User found for UserID:", userId);
    }

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Expires: 60 * 10, // URL expires in 10 minutes
      ContentType: 'image/jpeg'
    };

    console.log("S3 getSignedUrlPromise params:", JSON.stringify(params, null, 2));

    const signedUrl = await S3.getSignedUrlPromise('putObject', params);

    if (!signedUrl) {
      console.error("Failed to generate signed URL for upload");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate signed URL for upload' }),
      };
    }
    else {
      console.log("Signed URL generated for upload:", signed);
    }

    console.log("Updating user record to indicate profile picture upload");

    const updateParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId },
      UpdateExpression: 'SET hasProfilePicture = :hasProfilePicture',
      ExpressionAttributeValues: { ':hasProfilePicture': true }
    };

    console.log("DynamoDB update params:", JSON.stringify(updateParams, null, 2));

    await dynamoDb.update(updateParams).promise();

    if (!signedUrl) {
      console.error("Failed to update user record to indicate profile picture upload");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update user record to indicate profile picture upload' }),
      };
    }
    
    console.log("Successfully generated signed URL and updated user record for UserID:", userId);
    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: signedUrl }),
    };
  } catch (error) {
    console.error("Error in generatePresignedUrl:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to upload profile picture', details: error.message }),
    };
  }
};
