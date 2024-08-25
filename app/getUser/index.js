const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });


exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const userId = event.pathParameters.userId;

    if (!userId) {
      console.error("UserID not provided");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'UserID not provided' }),
      };
    }
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

};
