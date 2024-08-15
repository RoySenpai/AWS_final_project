const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const { name, email } = JSON.parse(event.body);

    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and email are required' }),
      };
    }

    const userId = uuidv4();

    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Item: {
        UserID: userId,
        Username: name,
        UserEmail: email,
      },
    };

    await dynamoDb.put(params).promise();
    
    return {
      statusCode: 201,
      body: JSON.stringify({ userId, name, email }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create user', details: error.message }),
    };
  }
};