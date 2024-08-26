const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
    try {
      console.log("Received event:", JSON.stringify(event, null, 2));
  
      const postId = event.pathParameters.postid;
      console.log("Fetching details for PostID:", postId);
  
      const params = {
        TableName: process.env.POSTS_TABLE_NAME, // Add the TableName here
        Key: { PostID: postId },
      };
  
      console.log("DynamoDB get params:", JSON.stringify(params, null, 2));
      const data = await dynamoDb.get(params).promise();
  
      if (!data.Item) {
        console.error("Post not found for PostID:", postId);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Post not found' }),
        };
      }
  
      console.log("Post found:", JSON.stringify(data.Item, null, 2));
      

      // Now fetch the comments for this post
        const commentsParams = {
            TableName: process.env.COMMENTS_TABLE_NAME,
            KeyConditionExpression: 'PostID = :postid',
            ExpressionAttributeValues: { ':postid': postId },
        };

        const comments = await dynamoDb.query(commentsParams).promise();

        console.log("Comments found:", JSON.stringify(comments.Items, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({
                postid: data.Item.PostID,
                userid: data.Item.UserID,
                title: data.Item.Title,
                content: data.Item.Content,
                comments: comments.Items,
            }),
        };
    } catch (error) {
      console.error("Error in getPost:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Could not retrieve post', details: error.message }),
      };
    }
  };