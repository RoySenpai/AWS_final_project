// import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
// import * as AWSMock from 'aws-sdk-mock';
// import * as AWS from 'aws-sdk';
// import { createUser } from '../app/createUse/index.js'; // Corrected path
// import { getUser } from '../getUser/index'; // Corrected path
// import { deleteUser } from '../deleteUser/index'; // Corrected path
// import { generatePresignedUrl } from '../generatePresignedUrl/index'; // Corrected path

// describe('API Tests', () => {

//   // Mock for creating a user
//   describe('Create User API', () => {
//     beforeAll(() => {
//       AWSMock.setSDKInstance(AWS);
//       AWSMock.mock('DynamoDB.DocumentClient', 'put', (params: any, callback: Function) => {
//         callback(null, {});
//       });
//     });

//     afterAll(() => {
//       AWSMock.restore('DynamoDB.DocumentClient');
//     });

//     test('should create a user and return a status code 201', async () => {
//       const event: APIGatewayProxyEvent = {
//         body: JSON.stringify({
//           name: 'Test User',
//           email: 'test@example.com',
//         }),
//       } as any;

//       const result: APIGatewayProxyResult = await createUser(event);

//       expect(result.statusCode).toEqual(201);
//       const body = JSON.parse(result.body);
//       expect(body).toHaveProperty('userId');
//     });

//     test('should return 400 if no name is provided', async () => {
//       const event: APIGatewayProxyEvent = {
//         body: JSON.stringify({
//           email: 'test@example.com',
//         }),
//       } as any;

//       const result: APIGatewayProxyResult = await createUser(event);

//       expect(result.statusCode).toEqual(400);
//     });
//   });

//   // Mock for getting a user by ID
//   describe('Get User API', () => {
//     beforeAll(() => {
//       AWSMock.setSDKInstance(AWS);
//       AWSMock.mock('DynamoDB.DocumentClient', 'get', (params: any, callback: Function) => {
//         if (params.Key.UserID === 'existing-id') {
//           callback(null, { Item: { UserID: 'existing-id', name: 'Test User' } });
//         } else {
//           callback(null, {});
//         }
//       });
//     });

//     afterAll(() => {
//       AWSMock.restore('DynamoDB.DocumentClient');
//     });

//     test('should return the user if the ID exists', async () => {
//       const event: APIGatewayProxyEvent = {
//         pathParameters: {
//           userId: 'existing-id',
//         },
//       } as any;

//       const result: APIGatewayProxyResult = await getUser(event);

//       expect(result.statusCode).toEqual(200);
//       const body = JSON.parse(result.body);
//       expect(body).toHaveProperty('name', 'Test User');
//     });

//     test('should return 404 if the user does not exist', async () => {
//       const event: APIGatewayProxyEvent = {
//         pathParameters: {
//           userId: 'non-existing-id',
//         },
//       } as any;

//       const result: APIGatewayProxyResult = await getUser(event);

//       expect(result.statusCode).toEqual(404);
//     });
//   });

//   // Mock for deleting a user by ID
//   describe('Delete User API', () => {
//     beforeAll(() => {
//       AWSMock.setSDKInstance(AWS);
//       AWSMock.mock('DynamoDB.DocumentClient', 'delete', (params: any, callback: Function) => {
//         if (params.Key.UserID === 'existing-id') {
//           callback(null, {});
//         } else {
//           callback(null, {});
//         }
//       });
//     });

//     afterAll(() => {
//       AWSMock.restore('DynamoDB.DocumentClient');
//     });

//     test('should delete the user if the ID exists', async () => {
//       const event: APIGatewayProxyEvent = {
//         pathParameters: {
//           userId: 'existing-id',
//         },
//       } as any;

//       const result: APIGatewayProxyResult = await deleteUser(event);

//       expect(result.statusCode).toEqual(200);
//     });

//     test('should return 404 if the user does not exist', async () => {
//       const event: APIGatewayProxyEvent = {
//         pathParameters: {
//           userId: 'non-existing-id',
//         },
//       } as any;

//       const result: APIGatewayProxyResult = await deleteUser(event);

//       expect(result.statusCode).toEqual(404);
//     });
//   });

//   // Mock for generating a presigned URL
//   describe('Generate Presigned URL API', () => {
//     beforeAll(() => {
//       AWSMock.setSDKInstance(AWS);
//       AWSMock.mock('S3', 'getSignedUrl', (operation, params, callback) => {
//         callback(null, 'https://presigned-url');
//       });
//     });

//     afterAll(() => {
//       AWSMock.restore('S3');
//     });

//     test('should generate a presigned URL', async () => {
//       const event: APIGatewayProxyEvent = {
//         body: JSON.stringify({
//           userId: 'existing-id',
//           contentType: 'image/jpeg',
//         }),
//       } as any;

//       const result: APIGatewayProxyResult = await generatePresignedUrl(event);

//       expect(result.statusCode).toEqual(200);
//       const body = JSON.parse(result.body);
//       expect(body).toHaveProperty('url', 'https://presigned-url');
//     });

//     test('should return 400 if userId or contentType is missing', async () => {
//       const event: APIGatewayProxyEvent = {
//         body: JSON.stringify({
//           contentType: 'image/jpeg',
//         }),
//       } as any;

//       const result: APIGatewayProxyResult = await generatePresignedUrl(event);

//       expect(result.statusCode).toEqual(400);
//     });
//   });

// });
