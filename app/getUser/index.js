const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { userId } = event.pathParameters;

    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Key: {
        UserID: userId,
      },
    };

    const result = await dynamoDb.get(params).promise();
    
    if (result.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          userId: result.Item.UserID,
          name: result.Item.Username,
          email: result.Item.UserEmail,
        }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve user', details: error.message }),
    };
  }
};