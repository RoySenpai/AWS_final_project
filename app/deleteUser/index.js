const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const userId = event.pathParameters.userId;

    if (!userId) {
      console.error("UserID is required to delete a user");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'UserID is required to delete a user' }),
      };
    }
    console.log("Attempting to delete UserID:", userId);

    const getParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId },
    };

    console.log("DynamoDB get params:", JSON.stringify(getParams, null, 2));

    const data = await dynamoDb.get(getParams).promise();

    if (!data.Item) {
      console.error("User not found for UserID:", userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    console.log("User found for UserID:", userId);

    const deleteParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId },
    };

    console.log("DynamoDB delete params:", JSON.stringify(deleteParams, null, 2));

    await dynamoDb.delete(deleteParams).promise();

    // Delete all posts by the user, all his comments and all the comments on his posts
    const userPosts = data.Item.PostIDs || [];

    await Promise.all(userPosts.map(async (postId) => {
      const getPostParams = {
        TableName: process.env.POSTS_TABLE_NAME,
        Key: { PostID: postId },
      };

      const postData = await dynamoDb.get(getPostParams).promise();
      const postComments = postData.Item.CommentIDs || [];

      await Promise.all(postComments.map(async (commentId) => {
        const deleteCommentParams = {
          TableName: process.env.COMMENTS_TABLE_NAME,
          Key: { CommentID: commentId },
        };

        console.log("DynamoDB delete comment params:", JSON.stringify(deleteCommentParams, null, 2));

        await dynamoDb.delete(deleteCommentParams).promise();
      }));

      const deletePostParams = {
        TableName: process.env.POSTS_TABLE_NAME,
        Key: { PostID: postId },
      };

      console.log("DynamoDB delete post params:", JSON.stringify(deletePostParams, null, 2));

      await dynamoDb.delete(deletePostParams).promise();
    }));

    console.log("Successfully deleted user with UserID:", userId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User deleted successfully' }),
    };
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not delete user', details: error.message }),
    };
  }
};
