const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const userId = uuidv4();
  const { name, email } = JSON.parse(event.body);

  const params = {
    TableName: process.env.USERS_TABLE,
    Item: {
      userId,
      name,
      email,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ userId, name, email }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create user' }),
    };
  }
};
