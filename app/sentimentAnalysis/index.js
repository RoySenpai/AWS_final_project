const queueUrl = process.env.SENTIMENT_ANALYSIS_QUEUE_URL;

const AWS = require('aws-sdk');
const sqs = new AWS.SQS();
const comprehend = new AWS.Comprehend();

exports.handler = async (event) => {    
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10, // Adjust to a smaller number for testing
        VisibilityTimeout: 30,  // Time in seconds for which the message will be invisible after receiving
        WaitTimeSeconds: 20      // Adjust if you want long polling
    };
    
    try {
        const result = await sqs.receiveMessage(params).promise();
        
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

                const params = {
                    LanguageCode: 'en',
                    Text: commentText
                }

                // Perform sentiment analysis
                const sentimentData = await comprehend.detectSentiment(params).promise().then(data => {
                    return data;
                }).catch(err => {
                    console.error('Error:', err);
                    throw err;
                });

                console.log('Sentiment:', sentimentData);
            }
        } else {
            console.log('No messages received, or all messages processed');
        }
        
    } catch (error) {
        console.error('Error receiving message:', error);
        throw error;
    }
};

// const AWS = require('aws-sdk');
// const comprehend = new AWS.Comprehend();
// const dynamoDB = new AWS.DynamoDB.DocumentClient();
// AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


// exports.handler = async (event) => {
//     console.log("Received event:", JSON.stringify(event, null, 2));
//     // const { Records } = event;

//     // for (const record of Records) {
//     //     const { commentId, postId, commentText } = JSON.parse(record.body);

//     //     // Perform sentiment analysis
//     //     const sentimentData = await comprehend.detectSentiment({
//     //         Text: commentText,
//     //         LanguageCode: 'en',
//     //     }).promise();

//     //     const sentiment = sentimentData.Sentiment;

//     //     // Store the sentiment in the Comments table
//     //     await dynamoDB.update({
//     //         TableName: process.env.COMMENTS_TABLE_NAME,
//     //         Key: { CommentID: commentId, PostID: postId },
//     //         UpdateExpression: 'set Sentiment = :sentiment',
//     //         ExpressionAttributeValues: { ':sentiment': sentiment },
//     //     }).promise();

//     //     // Update the running sentiment score in the Posts table
//     //     const post = await dynamoDB.get({
//     //         TableName: process.env.POSTS_TABLE_NAME,
//     //         Key: { PostID: postId },
//     //     }).promise();

//     //     const newSentimentScore = calculateNewSentimentScore(post.Item.SentimentScore, sentiment);

//     //     await dynamoDB.update({
//     //         TableName: process.env.POSTS_TABLE_NAME,
//     //         Key: { PostID: postId },
//     //         UpdateExpression: 'set SentimentScore = :score',
//     //         ExpressionAttributeValues: { ':score': newSentimentScore },
//     //     }).promise();
//     // }
// };

// function calculateNewSentimentScore(currentScore, newSentiment, alpha = 0.1) {
//     // Calculate the new score using exponential moving average
//     const newScore = (1 - alpha) * currentScore + alpha * newSentiment;
//     return newScore;
// }
