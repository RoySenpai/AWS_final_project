// test/getUser.test.ts
// @ts-ignore
import { handler } from '../../app/getUser/index.js';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

describe('Get User Lambda Function', () => {
  const dynamoMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    dynamoMock.reset();
  });

  it('should return user details if user exists', async () => {
    dynamoMock.on(GetCommand).resolves({
      Item: {
        UserID: '123',
        Username: 'John Doe',
        UserEmail: 'john.doe@example.com',
        hasProfilePicture: false,
      },
    });

    const event = {
      pathParameters: { userId: '123' },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe('123');
    expect(body.name).toBe('John Doe');
    expect(body.email).toBe('john.doe@example.com');
  });

  it('should return 404 if user does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({});

    const event = {
      pathParameters: { userId: '123' },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('User not found');
  });
});
