// __mocks__/aws-sdk.js

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
  
class S3 {
getSignedUrlPromise = jest.fn(() => {
    return Promise.resolve('https://signed-url-for-upload.com');
});
}

module.exports = {
DynamoDB: {
    DocumentClient,
},
S3,
};
  