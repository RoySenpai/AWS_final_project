const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  for (const record of event.Records) {
    console.log('DynamoDB Record:', JSON.stringify(record, null, 2));

    // Your logic to process the stream event
    if (record.eventName === 'INSERT') {
      const newItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      console.log('New item added:', newItem);

      // Add any additional processing logic here, such as sending an SQS message or triggering another action
    }
  }

  return `Successfully processed ${event.Records.length} records.`;
};
