const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

exports.handler = async (event) => {
    const { postId } = event.Records[0].dynamodb.Keys;

    // Fetch the post's current sentiment score
    const post = await dynamoDB.get({
        TableName: process.env.POSTS_TABLE_NAME,
        Key: { PostID: postId },
    }).promise();

    const sentimentScore = post.Item.SentimentScore;

    // Logic to determine significant sentiment change
    const isSignificantChange = determineSignificantChange(sentimentScore);

    if (isSignificantChange) {
        // Notify the post owner
        await sns.publish({
            TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
            Message: `The sentiment for your post has changed significantly.`,
        }).promise();
    }
};

function determineSignificantChange(sentimentScore) {
    // Implement logic to determine if the sentiment change is significant
    return true; // Placeholder
}
