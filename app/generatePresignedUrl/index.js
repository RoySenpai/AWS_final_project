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

    console.log("Fetching user to verify existence with UserID:", userId);
    const userParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId }
    };

    const userResult = await dynamoDb.get(userParams).promise();

    if (!userResult.Item) {
      console.error("User not found for UserID:", userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Expires: 60 * 10, // URL expires in 10 minutes
      ContentType: 'image/jpeg'
    };

    console.log("S3 getSignedUrlPromise params:", JSON.stringify(params, null, 2));
    const signedUrl = await S3.getSignedUrlPromise('putObject', params);

    console.log("Updating user record to indicate profile picture upload");
    const updateParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId },
      UpdateExpression: 'SET hasProfilePicture = :hasProfilePicture',
      ExpressionAttributeValues: { ':hasProfilePicture': true }
    };

    await dynamoDb.update(updateParams).promise();

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
