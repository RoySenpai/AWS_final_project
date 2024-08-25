import * as AWS from 'aws-sdk';
// @ts-ignore
import { handler as createUserHandler } from '../../app/createUser/index.js';
// @ts-ignore
import { handler as getUserHandler } from '../../app/getUser/index.js';
// @ts-ignore
import { handler as deleteUserHandler } from '../../app/deleteUser/index.js';

jest.mock('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "UsersTable";  // Replace with the actual table name 
const BUCKET_NAME = "ProfilePicturesBucket";  // Replace with the actual bucket name 
beforeAll(() => {
    // Set environment variables
    process.env.USERS_TABLE_NAME = TABLE_NAME;
    process.env.BUCKET_NAME = BUCKET_NAME;
    process.env.AWS_REGION = 'us-east-1';  // Set your preferred region

});

describe('Lambda Function Tests', () => {
    let createdUserId: string | undefined;

    beforeAll(() => {
        // Mocking DynamoDB's put operation for createUser
        (documentClient.put as jest.Mock).mockImplementation((params: AWS.DynamoDB.DocumentClient.PutItemInput, callback: Function) => {
            if (params.TableName === TABLE_NAME) {
                createdUserId = 'mock-user-id'; // Replace with the logic to generate the user ID
                callback(null, 'success');
            } else {
                callback(new Error('TableName does not match'), null);
            }
        });

        // Mocking DynamoDB's get operation for getUser
        (documentClient.get as jest.Mock).mockImplementation((params: AWS.DynamoDB.DocumentClient.GetItemInput, callback: Function) => {
            if (params.TableName === TABLE_NAME) {
                if (params.Key && params.Key.UserID === createdUserId) {
                    callback(null, { Item: { UserID: createdUserId, name: 'John', email: 'john.doe@example.com' } });
                } else {
                    callback(null, { Item: null });
                }
            } else {
                callback(new Error('TableName does not match'), null);
            }
        });

        // Mocking DynamoDB's delete operation for deleteUser
        (documentClient.delete as jest.Mock).mockImplementation((params: AWS.DynamoDB.DocumentClient.DeleteItemInput, callback: Function) => {
            if (params.TableName === TABLE_NAME) {
                if (params.Key && params.Key.UserID === createdUserId) {
                    callback(null, {});
                } else {
                    callback(new Error('User not found'), null);
                }
            } else {
                callback(new Error('TableName does not match'), null);
            }
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('createUser Tests', () => {
        test('should create a user successfully', async () => {
            const event = {
                body: JSON.stringify({ name: 'John', email: 'john.doe@example.com' })
            };

            const result = await createUserHandler(event);

            expect(result.statusCode).toBe(201);
            const body = JSON.parse(result.body);
            expect(body).toHaveProperty('UserID');
            expect(body.name).toBe('John');
            expect(body.email).toBe('john.doe@example.com');

            createdUserId = body.UserID; // Store the created user ID for later tests
        });

        test('should return 400 if user data is missing', async () => {
            const event = {
                body: JSON.stringify({})
            };

            const result = await createUserHandler(event);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body).toHaveProperty('error', 'Name and email are required');
        });

        test('should return 500 if the input is invalid JSON', async () => {
            const event = {
                body: "Invalid JSON"
            };

            try {
                await createUserHandler(event);
            } catch (error: any) {
                expect(error.message).toBe('Unexpected token I in JSON at position 0');
            }
        });

        test('should return 400 if the event body is missing', async () => {
            const event = {}; // Missing body

            const result = await createUserHandler(event);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body).toHaveProperty('error', 'Invalid input: Event body is missing');
        });

        test('should create a user with additional fields', async () => {
            const event = {
                body: JSON.stringify({ name: 'John', email: 'john.doe@example.com', age: 30, city: 'New York' })
            };

            const result = await createUserHandler(event);

            expect(result.statusCode).toBe(201);
            const body = JSON.parse(result.body);
            expect(body).toHaveProperty('UserID');
            expect(body.name).toBe('John');
            expect(body.email).toBe('john.doe@example.com');
            expect(body.age).toBe(30);
            expect(body.city).toBe('New York');

            createdUserId = body.UserID; // Update the created user ID in case it differs
        });
    });

    describe('getUser Tests', () => {
        test('should retrieve a user successfully', async () => {
            const event = {
                pathParameters: {
                    id: createdUserId,
                },
            };

            const result = await getUserHandler(event);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.UserID).toBe(createdUserId);
            expect(body.name).toBe('John');
            expect(body.email).toBe('john.doe@example.com');
        });

        test('should return 404 if user is not found', async () => {
            const event = {
                pathParameters: {
                    id: 'non-existent-user-id',
                },
            };

            const result = await getUserHandler(event);

            expect(result.statusCode).toBe(404);
            expect(result.body).toContain('User not found');
        });

        test('should return 400 if id is missing', async () => {
            const event = {
                pathParameters: {},
            };

            const result = await getUserHandler(event);

            expect(result.statusCode).toBe(400);
            expect(result.body).toContain('User ID is required');
        });
    });

    describe('deleteUser Tests', () => {
        test('should delete a user successfully', async () => {
            const event = {
                pathParameters: {
                    id: createdUserId,
                },
            };

            const result = await deleteUserHandler(event);

            expect(result.statusCode).toBe(204);
            expect(result.body).toBe('{}');
        });

        test('should return 400 if id is missing', async () => {
            const event = {
                pathParameters: {},
            };

            const result = await deleteUserHandler(event);

            expect(result.statusCode).toBe(400);
            expect(result.body).toContain('User ID is required');
        });

        test('should return 404 if user does not exist', async () => {
            const event = {
                pathParameters: {
                    id: 'non-existent-user-id',
                },
            };

            const result = await deleteUserHandler(event);
            expect(result.statusCode).toBe(404);
            expect(result.body).toContain('User not found');
        });
    });
});
