const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { userId } = event.pathParameters;

    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        UserID: userId,
      },
    };

    const result = await dynamoDb.get(params).promise();

    if (result.Item) {

      if (result.Item.hasProfilePicture) {

        // First check if the user has a profile picture and if so, generate a signed URL
        const s3 = new AWS.S3();
        s3.config.update({ region: "us-east-1" });

        const obj = s3.getObject({
          Bucket: process.env.BUCKET_NAME,
          Key: `profile-pictures/${userId}.jpg`,
        });

        if (obj) {
          const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.BUCKET_NAME,
            Key: `profile-pictures/${userId}.jpg`,
            Expires: 60 * 5,
          });

          return {
            statusCode: 200,
            body: JSON.stringify({
              userId: result.Item.UserID,
              name: result.Item.Username,
              email: result.Item.UserEmail,
              profilePictureUrl: signedUrl,
            }),
          }
        }
      }

      else {
        return {
          statusCode: 200,
          body: JSON.stringify({
            userId: result.Item.UserID,
            name: result.Item.Username,
            email: result.Item.UserEmail,
            profilePictureUrl: "No profile picture",
          }),
        }
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve user', details: error.message }),
    };
  }
};