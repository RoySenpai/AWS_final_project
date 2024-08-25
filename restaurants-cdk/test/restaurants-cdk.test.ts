
jest.mock('aws-sdk'); // Ensure this is at the top to use the mocked AWS SDK

const { handler: createUserHandler } = require('../../app/createUser/index.js');
const { handler: getUserHandler } = require('../../app/getUser/index.js');
const { handler: deleteUserHandler } = require('../../app/deleteUser/index.js');
const { handler: generatePresignedUrlHandler } = require('../../app/generatePresignedUrl/index.js');


describe('Lambda Function Tests', () => {
  var createdUserId: string | undefined = '1234';

  describe('createUser Tests', () => {
    test('should create a user successfully', async () => {
      const event = {
        body: JSON.stringify({ name: 'John', email: 'john.doe@example.com' }),
      };

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('userId');
      expect(body.name).toBe('John');
      expect(body.email).toBe('john.doe@example.com');

      createdUserId = body.userId; // Store the created user ID for later tests
    });

    test('should return 400 if user data is missing', async () => {
      const event = {
        body: JSON.stringify({}),
      };

      const result = await createUserHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('error', 'Name and email are required');
    });

    test('should return 500 if the input is invalid JSON', async () => {
      const event = {
        body: 'Invalid JSON',
      };


      const result = await createUserHandler(event);

      console.log('result', result);
      const {error} = JSON.parse(result.body);
      expect(error).toBe('Invalid JSON input');
      
    });

    test('should return 400 if the event body is missing', async () => {
      const event = {}; // Missing body

      const result = await createUserHandler(event);

      console.log('result', result);

      expect(result.statusCode).toBe(500);
      const {error} = JSON.parse(result.body);
      expect(error).toBe('Invalid JSON input');
    });

    test('should create a user with additional fields', async () => {
      const event = {
        body: JSON.stringify({
          name: 'John',
          email: 'john.doe@example.com',
        }),
      };

      const result = await createUserHandler(event);

      console.log('result', result);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toHaveProperty('userId');
      
      const {uid, name, email} = JSON.parse(result.body);
      expect(name).toBe('John');
      expect(email).toBe('john.doe@example.com');
    });
  });

  describe('getUser Tests', () => {

    test('should return 404 if user is not found', async () => {
      const event = {
        pathParameters: {
          userId: 'non-existent-user-id',
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
      expect(result.body).toContain('UserID not provided');
    });
  });

  describe('deleteUser Tests', () => {

    test('should return 400 if id is missing', async () => {
      const event = {
        pathParameters: {},
      };

      const result = await deleteUserHandler(event);

      expect(result.statusCode).toBe(400);
      expect(result.body).toContain('UserID is required to delete a user');
    });

    test('should return 404 if user does not exist', async () => {
      const event = {
        pathParameters: {
          userId: 'non-existent-user-id',
        },
      };

      const result = await deleteUserHandler(event);
      expect(result.statusCode).toBe(404);
      expect(result.body).toContain('User not found');
    });
  });

  
  describe('generatePresignedUrl Lambda Function Tests', () => {
  
    describe('Edge Cases and Error Handling', () => {
      describe('Success Cases', () => {
        test('should generate a signed URL successfully', async () => {
          const event = {
            body: JSON.stringify({ userId: createdUserId }),
          };
    
          const result = await generatePresignedUrlHandler(event);
    
          expect(result.statusCode).toBe(200);
        });
      });

      test('should return 400 if userId is missing from the event body', async () => {
        const event = {
          body: JSON.stringify({}),
        };
  
        const result = await generatePresignedUrlHandler(event);
  
        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body).toHaveProperty('error', 'User ID is required');
      });
  
      test('should return 500 if event body is invalid JSON', async () => {
        const event = {
          body: 'Invalid JSON',
        };
  
        const result = await generatePresignedUrlHandler(event);
  
        expect(result.statusCode).toBe(500);
        const body = JSON.parse(result.body);
        expect(body).toHaveProperty('error', 'Invalid JSON input');
      });
  
      test('should return 404 if user does not exist in the database', async () => {
        // Mocking the get operation to simulate user not found

        const event = {
          body: JSON.stringify({ userId: 'non-existent-user-id' }),
        };
  
        const result = await generatePresignedUrlHandler(event);
  
        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body).toHaveProperty('error', 'User not found');
      });
  
    });
  });
});
