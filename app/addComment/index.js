const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
    const { commentId, postId, userId, commentText } = JSON.parse(event.body);

    // Add the comment to the Comments table
    await dynamoDB.put({
        TableName: process.env.COMMENTS_TABLE_NAME,
        Item: {
            CommentID: commentId,
            PostID: postId,
            UserID: userId,
            CommentText: commentText,
        },
    }).promise();

    // Send the comment text to SQS for sentiment analysis
    await sqs.sendMessage({
        QueueUrl: process.env.SENTIMENT_ANALYSIS_QUEUE_URL,
        MessageBody: JSON.stringify({ commentId, postId, commentText }),
    }).promise();

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Comment added and sentiment analysis triggered.' }),
    };
};
