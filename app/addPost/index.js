const uuid = require('uuid');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { userid, title, content } = JSON.parse(event.body);

        // First check if the user exists
        const userParams = {
            TableName: process.env.USERS_TABLE_NAME,
            Key: { UserID: userid }
        };

        const user = await dynamoDb.get(userParams).promise();
        if (!user.Item) {
            console.error("Validation error: User does not exist");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'User does not exist' }),
            };
        }

        // Add the post
        const postId = uuid.v1();

        const params = {
            TableName: process.env.POSTS_TABLE_NAME,
            Item: {
                PostID: postId,
                UserID: userid,
                Title: title,
                Content: content,
            },
        };

        await dynamoDb.put(params).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({
                postid: postId
            })
        };

    } catch (error) {
        console.error("Error in addPost:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not add post', details: error.message }),
        };
    }
};