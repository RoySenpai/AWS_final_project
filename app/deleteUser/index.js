const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const userId = event.pathParameters.userId;
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

    const deleteParams = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Key: { UserID: userId },
    };

    console.log("DynamoDB delete params:", JSON.stringify(deleteParams, null, 2));
    await dynamoDb.delete(deleteParams).promise();
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
