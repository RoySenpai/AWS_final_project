const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
S3.config.update({ region: "us-east-1" });

exports.handler = async (event) => {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'User ID is required' }),
        };
    }
    const fileName = `profile-pictures/${userId}.jpg`;
    const bucketName = process.env.BUCKET_NAME;

    const params = {
        Bucket: bucketName,
        Key: fileName,
        Expires: 60 * 10, // URL expires in 10 minutes
        ContentType: 'image/jpeg' // Set the expected content type
    };

    try {
        // Check if the user even exists

        const userParams = {
            TableName: process.env.USERS_TABLE_NAME,
            Key: {
                UserID: userId
            }
        };

        const userResult = await dynamoDb.get(userParams).promise();

        if (!userResult.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User not found' }),
            };
        }
        
        const signedUrl = await S3.getSignedUrlPromise('putObject', params);

        // Update the user's record in the database
        const updateParams = {
            TableName: process.env.USERS_TABLE_NAME,
            Key: {
                UserID: userId
            },
            UpdateExpression: 'SET hasProfilePicture = :hasProfilePicture',
            ExpressionAttributeValues: {
                ':hasProfilePicture': true
            }
        };
        
        await dynamoDb.update(updateParams).promise();

        // Return the signed URL
        return {
            statusCode: 200,
            body: JSON.stringify(
                {
                    uploadUrl: signedUrl
                }
            ),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to upload profile picture', details: error.message }),
        };
    }
};