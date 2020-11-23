'use strict';

import { APIGatewayProxyHandler } from 'aws-lambda';
import fetch from 'node-fetch';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import assert = require('assert');

assert.ok(process.env.SOURCE_URI, 'No SOURCE_URI env variable!');
assert.ok(process.env.COMPANIES_TABLE, 'Table name is not provided.');

const getUriForCompany = (companyId: number) => {
    return process.env.SOURCE_URI!.replace('{id}', `${companyId}`);
};

const handler: APIGatewayProxyHandler = async event => {
    const id = parseInt(event.pathParameters?.id || '', 10);
    const response = await fetch(getUriForCompany(id));
    const dbClient = new DynamoDB.DocumentClient();
    const lastFetchedAt = (new Date()).toISOString();

    if (response.ok) {
        const companyInfo = await response.json();

        await dbClient.put({
            TableName: process.env.COMPANIES_TABLE!,
            Item: {
                companyId: id,
                lastFetchedAt,
                ...companyInfo,
            }
        }).promise();

        return {
            statusCode: response.status,
            body: JSON.stringify(companyInfo, null, 2),
        };
    } else {
        return {
            statusCode: 502,
            body: JSON.stringify({
                message: 'Temporary data source failure',
            }, null, 2),
        };
    }
};

export default handler;
