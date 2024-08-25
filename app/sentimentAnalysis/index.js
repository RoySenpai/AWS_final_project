const AWS = require('aws-sdk');
const comprehend = new AWS.Comprehend();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


exports.handler = async (event) => {
    const { Records } = event;

    for (const record of Records) {
        const { commentId, postId, commentText } = JSON.parse(record.body);

        // Perform sentiment analysis
        const sentimentData = await comprehend.detectSentiment({
            Text: commentText,
            LanguageCode: 'en',
        }).promise();

        const sentiment = sentimentData.Sentiment;

        // Store the sentiment in the Comments table
        await dynamoDB.update({
            TableName: process.env.COMMENTS_TABLE_NAME,
            Key: { CommentID: commentId, PostID: postId },
            UpdateExpression: 'set Sentiment = :sentiment',
            ExpressionAttributeValues: { ':sentiment': sentiment },
        }).promise();

        // Update the running sentiment score in the Posts table
        const post = await dynamoDB.get({
            TableName: process.env.POSTS_TABLE_NAME,
            Key: { PostID: postId },
        }).promise();

        const newSentimentScore = calculateNewSentimentScore(post.Item.SentimentScore, sentiment);

        await dynamoDB.update({
            TableName: process.env.POSTS_TABLE_NAME,
            Key: { PostID: postId },
            UpdateExpression: 'set SentimentScore = :score',
            ExpressionAttributeValues: { ':score': newSentimentScore },
        }).promise();
    }
};

function calculateNewSentimentScore(currentScore, newSentiment) {
    // Implement logic to calculate the new sentiment score based on currentScore and newSentiment
    // For simplicity, return a placeholder value
    return 0.75; // Placeholder value
}
