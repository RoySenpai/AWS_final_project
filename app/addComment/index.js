const uuid = require('uuid');
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


exports.handler = async (event) => {
    const { pathParameters } = event;
    const { postId: PostID } = pathParameters;
    const { userId: UserID, commentText:CommentText } = JSON.parse(event.body);

    if (!UserID) {
        console.error("Validation error: UserID missing");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'UserID is required' }),
        };
    }

    if (!CommentText) {
        console.error("Validation error: CommentText missing");
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'CommentText is required' }),
        };
    }

    const commentId = uuid.v1();

    try
    {
        // Add the comment to the Comments table
        await dynamoDB.put({
            TableName: process.env.COMMENTS_TABLE_NAME,
            Item: {
                CommentID: commentId,
                PostID,
                UserID,
                CommentText,
            },
        }).promise();

        await dynamoDB.update({
            TableName: process.env.POSTS_TABLE_NAME,
            Key: { PostID },
            UpdateExpression: 'SET CommentIDs = list_append(if_not_exists(CommentIDs, :empty_list), :comment_id)',
            ExpressionAttributeValues: {
                ':comment_id': [commentId],
                ':empty_list': [],
            },
        }).promise();

        // Send the comment text to SQS for sentiment analysis
        await sqs.sendMessage({
            QueueUrl: process.env.SENTIMENT_ANALYSIS_QUEUE_URL,
            MessageBody: JSON.stringify({ commentId, postId: PostID, commentText: CommentText }),
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Comment added and sentiment analysis triggered.' }),
        };
    }

    catch(error)
    {
        console.error("Error in addComment:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not add comment', details: error.message }),
        };
    }
};
