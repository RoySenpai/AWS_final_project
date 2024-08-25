// __mocks__/aws-sdk.js


// ======================= Orel =======================

class DocumentClient {
    put = jest.fn(() => {
      return {
        promise: () => Promise.resolve({}),
      };
    });
  
    get = jest.fn(() => {
      return {
        promise: () =>
          Promise.resolve({
            Item: {
              UserID: 'mock-user-id',
              name: 'John',
              email: 'john.doe@example.com',
            },
          }),
      };
    });
  
    delete = jest.fn(() => {
      return {
        promise: () => Promise.resolve({}),
      };
    });
  }
  
  module.exports = {
    DynamoDB: {
      DocumentClient,
    },
  };
  