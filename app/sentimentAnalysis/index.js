const queueUrl = process.env.SENTIMENT_ANALYSIS_QUEUE_URL;

const Sentiment = require('sentiment');
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sent = new Sentiment();

exports.handler = async (event) => {    
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10, // Adjust to a smaller number for testing
        VisibilityTimeout: 20,  // Time in seconds for which the message will be invisible after receiving
        WaitTimeSeconds: 20      // Adjust if you want long polling
    };

    console.log('Receiving messages from queue:', queueUrl);
    
    try {
        const result = await sqs.receiveMessage(params, function(err, data) {
            if (err) {
                console.error('Error receiving message:', err);
                throw err;
            } else {
                console.log('Received messages:', data.Messages ? data.Messages.length : 0);
                return data;
            }
        }).promise();
        
        if (result.Messages && result.Messages.length > 0) {
            for (const message of result.Messages) {
                // Process the message here
                const messageBody = JSON.parse(message.Body);
                const receiptHandle = message.ReceiptHandle;
                
                // After processing, delete the message from the queue
                await sqs.deleteMessage({
                    QueueUrl: queueUrl,
                    ReceiptHandle: receiptHandle
                }).promise();

                // Break Body into parts
                const { commentId, postId, commentText } = messageBody;

                console.log('Comment ID:', commentId);
                console.log('Post ID:', postId);
                console.log('Comment Text:', commentText);

                const result = sentiment.analyze(commentText);
                console.log('Result:', result);

                const newSentimentScore = calculateNewSentimentScore(post.Item.SentimentScore || 0, result);

                // Store the sentiment in the Comments table
                await dynamoDB.update({
                     TableName: process.env.COMMENTS_TABLE_NAME,
                     Key: { CommentID: commentId, PostID: postId },
                     UpdateExpression: 'set Sentiment = :sentiment',
                     ExpressionAttributeValues: { ':sentiment': result },
                }).promise();

                // Update the running sentiment score in the Posts table
                const post = await dynamoDB.get({
                    TableName: process.env.POSTS_TABLE_NAME,
                    Key: { PostID: postId },
                }).promise();

                await dynamoDB.update({
                    TableName: process.env.POSTS_TABLE_NAME,
                    Key: { PostID: postId },
                    UpdateExpression: 'set SentimentScore = :score',
                    ExpressionAttributeValues: { ':score': newSentimentScore },
                }).promise();

                console.log('Updated sentiment score:', newSentimentScore);
            }
        } else {
            console.log('No messages received, or all messages processed');
        }
        
    } catch (error) {
        console.error('Error receiving message:', error);
        throw error;
    }

    console.log('Finished processing messages');
};

function calculateNewSentimentScore(currentScore, newSentiment, alpha = 0.1) {
    // Calculate the new score using exponential moving average
    const newScore = (1 - alpha) * currentScore + alpha * newSentiment;
    return newScore;
}