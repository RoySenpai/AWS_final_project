const express = require('express');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'us-east-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: AWS_REGION });

const port = 3000;

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/user/addUser', async(req, res) => {

    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).send('Name and Email are required');
    }

    // Check if user already exists
    const params = {
        TableName: 'Users',
        Key: {
            username: name,
        }
    };

    try
    {
        const data = await dynamoDB.get(params).promise();

        if (data.Item) {
            return res.status(400).send('User already exists');
        }

        // The user does not exist, add the user, need to be a unique ID
        const params = {
            TableName: 'Users',
            Item: {
                username: name,
                email: email,
            }
        };

        await dynamoDB.put(params).promise();
    }

    catch (err) {
        return res.status(500).send('Internal Server Error: ' + err);
    }
});

app.get('/user/getUser', async(req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).send('Name is required');
    }

    const params = {
        TableName: 'Users',
        Key: {
            username: name,
        }
    };

    try
    {
        const data = await dynamoDB.get(params).promise();

        if (!data.Item) {
            return res.status(404).send('User not found');
        }

        return res.send(data.Item);
    }

    catch (err) {
        return res.status(500).send('Internal Server Error: ' + err);
    }
});

app.delete('/user/deleteUser', async(req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).send('Name is required');
    }

    const params = {
        TableName: 'Users',
        Key: {
            username: name,
        }
    };

    try
    {
        const data = await dynamoDB.get(params).promise();

        if (!data.Item) {
            return res.status(404).send('User not found');
        }

        await dynamoDB.delete(params).promise();
        return res.send('User deleted');
    }

    catch (err) {
        return res.status(500).send('Internal Server Error: ' + err);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app };