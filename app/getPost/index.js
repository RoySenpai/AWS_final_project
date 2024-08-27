const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
    try {
      console.log("Received event:", JSON.stringify(event, null, 2));
  
      const { pathParameters } = event;
      const { postId: PostID } = pathParameters;
      console.log("Fetching details for PostID:", PostID);
  
      const params = {
        TableName: process.env.POSTS_TABLE_NAME, // Add the TableName here
        Key: { PostID },
      };
  
      console.log("DynamoDB get params:", JSON.stringify(params, null, 2));
      const data = await dynamoDb.get(params).promise();
  
      if (!data.Item) {
        console.error("Post not found for PostID:", PostID);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Post not found' }),
        };
      }
  
      console.log("Post found:", JSON.stringify(data.Item, null, 2));

      const { Item } = data;
      const { CommentIDs } = Item;

      const comments = await Promise.all(CommentIDs.map(async (commentId) => {
        const commentParams = {
          TableName: process.env.COMMENTS_TABLE_NAME,
          Key: { CommentID: commentId },
        };
        const commentData = await dynamoDb.get(commentParams).promise();

        return {
          CommentID: commentData.Item.CommentID,
          UserID: commentData.Item.UserID,
          Content: commentData.Item.CommentText
        };
      }));

      console.log("Comments found:", JSON.stringify(comments, null, 2));

      return {
        statusCode: 200,
        body: JSON.stringify({
          PostID: Item.PostID,
          UserID: Item.UserID,
          Title: Item.Title,
          Content: Item.Content,
          SentimentalScore: Item.SentimentScore,
          Comments: comments,
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