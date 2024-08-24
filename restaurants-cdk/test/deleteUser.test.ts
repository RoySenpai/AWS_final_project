// test/deleteUser.test.ts
// @ts-ignore
import { handler } from '../../app/deleteUser/index.js';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

describe('Delete User Lambda Function', () => {
  const dynamoMock = mockClient(DynamoDBDocumentClient);

  beforeEach(() => {
    dynamoMock.reset();
  });

  it('should delete a user if user exists', async () => {
    dynamoMock.on(GetCommand).resolves({
      Item: {
        UserID: '123',
      },
    });
    dynamoMock.on(DeleteCommand).resolves({});

    const event = {
      pathParameters: { userId: '123' },
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('User deleted successfully');
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
