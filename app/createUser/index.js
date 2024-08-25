// // const { v4: uuidv4 } = require('uuid');
// // const AWS = require('aws-sdk');
// // AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
// // const dynamoDb = new AWS.DynamoDB.DocumentClient();

// // exports.handler = async (event) => {
// //   try {
// //     console.log("Received event:", JSON.stringify(event, null, 2));

// //     const { name, email } = JSON.parse(event.body);

// //     if (!name || !email) {
// //       console.error("Validation error: Name or email missing");
// //       return {
// //         statusCode: 400,
// //         body: JSON.stringify({ error: 'Name and email are required' }),
// //       };
// //     }

// //     const userId = uuidv4();
// //     console.log("Generated UUID:", userId);

// //     const params = {
// //       TableName: process.env.USERS_TABLE_NAME, // Add the TableName here
// //       Item: {
// //         UserID: userId,
// //         Username: name,
// //         UserEmail: email,
// //         hasProfilePicture: false,
// //       },
// //     };

// //     console.log("DynamoDB put params:", JSON.stringify(params, null, 2));
// //     await dynamoDb.put(params).promise();
    
// //     return {
// //       statusCode: 201,
// //       body: JSON.stringify({ userId, name, email }),
// //     };
// //   } catch (error) {
// //     console.error("Error in createUser:", error);
// //     return {
// //       statusCode: 500,
// //       body: JSON.stringify({ error: 'Could not create user', details: error.message }),
// //     };
// //   }
// // };


// const { v4: uuidv4 } = require('uuid');
// const AWS = require('aws-sdk');

// // Set the AWS region
// AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
// const dynamoDb = new AWS.DynamoDB.DocumentClient();

// // Set the correct DynamoDB table name
// process.env.USERS_TABLE_NAME = 'SocialNetworkStack-UsersTable9725E9C8-1BHPF7OXFJNY9';

// exports.handler = async (event) => {
//   try {
//     console.log("Received event:", JSON.stringify(event, null, 2));
//     console.log("Received event:", event.body);

//     console.log("Table Name from ENV:", process.env.USERS_TABLE_NAME);
//     console.log("AWS Region:", AWS.config.region);

//     const { name, email } = JSON.parse(event.body);

//     if (!name || !email) {
//       console.error("Validation error: Name or email missing");
//       return {
//         statusCode: 400,
//         body: JSON.stringify({ error: 'Name and email are required' }),
//       };
//     }

//     const userId = uuidv4();
//     console.log("Generated UUID:", userId);

//     const params = {
//       TableName: process.env.USERS_TABLE_NAME,
//       Item: {
//         UserID: userId,
//         Username: name,
//         UserEmail: email,
//         hasProfilePicture: false,
//       },
//     };

//     console.log("DynamoDB put params:", JSON.stringify(params, null, 2));
//     console.log("DynamoDB Table Name:", params.TableName);
    
//     // Perform the put operation
//     await dynamoDb.put(params).promise();
    
//     return {
//       statusCode: 201,
//       body: JSON.stringify({ userId, name, email }),
//     };
//   } catch (error) {
//     console.error("Error in createUser:", error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: 'Could not create user', details: error.message }),
//     };
//   }
// };




// ======================= Orel =======================


const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

// Set the AWS region
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Set the correct DynamoDB table name
process.env.USERS_TABLE_NAME = 'SocialNetworkStack-UsersTable9725E9C8-UO0SP5LJ0DX8';

exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));
    console.log("Table Name from ENV:", process.env.USERS_TABLE_NAME);
    console.log("AWS Region:", AWS.config.region);

    let name, email;

    // Handle invalid JSON input
    try {
        const requestBody = JSON.parse(event.body);
        name = requestBody.name;
        email = requestBody.email;

        if (!name || !email) {
            console.error("Validation error: Name or email missing");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name and email are required' }),
            };
        }
    } catch (error) {
        console.error("Invalid JSON!");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Invalid JSON input' }),
        };
    }

    console.log("Name:", name);
    console.log("Email:", email);

    const userId = uuidv4();
    console.log("Generated UUID:", userId);

    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Item: {
        UserID: userId,
        Username: name,
        UserEmail: email,
        hasProfilePicture: false,
      },
    };

    console.log("DynamoDB put params:", JSON.stringify(params, null, 2));
    
    // Perform the put operation

    try {
      result = await dynamoDb.put(params).promise()
      return {
        statusCode: 201,
        body: JSON.stringify({ userId, name, email }),
      };
    }
    catch(error) {
      console.error("Error in createUser:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Could not create user', details: error.message }),
      };
    };

};
