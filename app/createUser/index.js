const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const { name, email } = JSON.parse(event.body);

    if (!name || !email) {
      console.error("Validation error: Name or email missing");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and email are required' }),
      };
    }

    const userId = uuidv4();
    console.log("Generated UUID:", userId);

    const params = {
      TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
      Item: {
        UserID: userId,
        Username: name,
        UserEmail: email,
        hasProfilePicture: false,
      },
    };

    console.log("DynamoDB put params:", JSON.stringify(params, null, 2));
    await dynamoDb.put(params).promise();
    
    return {
      statusCode: 201,
      body: JSON.stringify({ userId, name, email }),
    };
  } catch (error) {
    console.error("Error in createUser:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create user', details: error.message }),
    };
  }
};
