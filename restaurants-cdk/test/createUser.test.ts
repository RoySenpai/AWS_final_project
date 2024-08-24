// test/createUser.test.ts
// @ts-ignore
import { handler } from '../../app/createUser/index.js';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

describe('Create User Lambda Function', () => {
  const dynamoMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    dynamoMock.reset();
  });

  it('should create a user and return the user ID', async () => {
    dynamoMock.on(PutCommand).resolves({});

    const event = {
      body: JSON.stringify({ name: 'John Doe', email: 'john.doe@example.com' }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('userId');
    expect(body.name).toBe('John Doe');
    expect(body.email).toBe('john.doe@example.com');
  });

  it('should return 400 if name or email is missing', async () => {
    const event = {
      body: JSON.stringify({ name: 'John Doe' }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Name and email are required');
  });
});
