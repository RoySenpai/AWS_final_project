// test/generatePresignedUrl.test.ts
// @ts-ignore
import { handler } from '../../app/generatePresignedUrl/index.js';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

describe('Generate Pre-signed URL Lambda Function', () => {
  const dynamoMock = mockClient(DynamoDBDocumentClient);
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    dynamoMock.reset();
    s3Mock.reset();
  });

  it('should generate a pre-signed URL for a valid user', async () => {
    dynamoMock.on(GetCommand).resolves({
      Item: {
        UserID: '123',
      },
    });

    s3Mock.on(GetObjectCommand).resolves({});

    const event = {
      body: JSON.stringify({ userId: '123' }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('uploadUrl');
  });

  it('should return 404 if user does not exist', async () => {
    dynamoMock.on(GetCommand).resolves({});

    const event = {
      body: JSON.stringify({ userId: '123' }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('User not found');
  });
});
