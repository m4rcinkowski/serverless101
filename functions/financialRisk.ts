'use strict';

import { APIGatewayProxyHandler, SQSHandler } from 'aws-lambda';
import fetch from 'node-fetch';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as SQS from 'aws-sdk/clients/sqs';
import assert = require('assert');

const { SOURCE_URI, COMPANIES_TABLE, FETCH_QUEUE_URL } = process.env;

assert.ok(SOURCE_URI, 'No SOURCE_URI env variable!');
assert.ok(COMPANIES_TABLE, 'Table name is not provided.');
assert.ok(FETCH_QUEUE_URL, 'Queue URL is not provided.');

const getUriForCompany = (companyId: number): string => {
    return SOURCE_URI.replace('{id}', `${companyId}`);
};

type FetchCompanyRiskInfoEventBody = {
    companyId: number;
};

const scheduleAsyncCompanyDataRefresh = async (id: number) => {
    const sqs = new SQS();
    const messageBody = <FetchCompanyRiskInfoEventBody>{
        companyId: id,
    };

    console.log('About to send a message to the queue', { messageBody });

    await sqs.sendMessage({
        QueueUrl: FETCH_QUEUE_URL,
        MessageBody: JSON.stringify(messageBody),
    }).promise();
};

const DATA_FRESHNESS_THRESHOLD_MS = 3600e3;

const isFreshEnough = (item: { lastFetchedAt: string}, referenceDate: Date) => {
    const itemDate = new Date(item.lastFetchedAt as string);
    const itemTimestamp = itemDate.getTime();
    const referenceTimestamp = referenceDate.getTime();

    console.log({ itemTimestamp, referenceTimestamp });

    return itemTimestamp >= referenceTimestamp - DATA_FRESHNESS_THRESHOLD_MS;
}
const needsToRefreshCompanyData = (data, referenceDate) => !data || !data.Item || !isFreshEnough(data.Item as any, referenceDate);

export const apiCheckCompany: APIGatewayProxyHandler = async event => {
    const id = parseInt(event.pathParameters?.id || '', 10);
    const referenceDate = new Date(event.requestContext.requestTimeEpoch);

    const dbClient = new DynamoDB.DocumentClient();
    const companyData = await dbClient.get({
        TableName: COMPANIES_TABLE,
        Key: {
            companyId: id,
        },
    }).promise();

    if (needsToRefreshCompanyData(companyData, referenceDate)) {
        await scheduleAsyncCompanyDataRefresh(id);

        return {
            statusCode: 502,
            body: JSON.stringify({
                message: 'Temporary companyData source failure',
            }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(companyData.Item),
    };
};

export const queueFetchCompany: SQSHandler = async event => {
    //fixme: critical bug ahead - only the first event from a batch is being handled here
    const body: FetchCompanyRiskInfoEventBody = JSON.parse((event.Records.shift() || {}).body || '{}');
    const id = parseInt((body.companyId || '') as any, 10);

    console.debug(`Processing a message with company id to fetch: ${id}`);

    const response = await fetch(getUriForCompany(id));

    if (!response.ok) {
        throw new Error('Failed to fetch company data from the API');
    }

    const companyInfo = await response.json();

    const dbClient = new DynamoDB.DocumentClient();
    const lastFetchedAt = (new Date()).toISOString();
    await dbClient.put({
        TableName: COMPANIES_TABLE,
        Item: {
            companyId: id,
            lastFetchedAt,
            ...companyInfo,
        }
    }).promise();
};
