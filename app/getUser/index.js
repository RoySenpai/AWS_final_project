const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const userId = event.pathParameters.userId;
    console.log("Fetching details for UserID:", userId);

    const params = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId },
    };

    console.log("DynamoDB get params:", JSON.stringify(params, null, 2));
    const data = await dynamoDb.get(params).promise();

    if (!data.Item) {
      console.error("User not found for UserID:", userId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    console.log("User found:", JSON.stringify(data.Item, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify({
        userId: data.Item.UserID,
        name: data.Item.Username,
        email: data.Item.UserEmail,
      }),
    };
  } catch (error) {
    console.error("Error in getUser:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve user', details: error.message }),
    };
  }
};
