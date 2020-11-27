'use strict';

import { APIGatewayProxyHandler, SQSHandler } from 'aws-lambda';
import fetch from 'node-fetch';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import * as SQS from 'aws-sdk/clients/sqs';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError } from 'aws-sdk/lib/error';
import assert = require('assert');

assert.ok(process.env.SOURCE_URI, 'No SOURCE_URI env variable!');
assert.ok(process.env.COMPANIES_TABLE, 'Table name is not provided.');
assert.ok(process.env.FETCH_QUEUE, 'Queue name is not provided.');
assert.ok(process.env.AWS_ACCOUNT_ID, 'AWS account ID is not provided.');

const { SOURCE_URI, COMPANIES_TABLE, FETCH_QUEUE, AWS_ACCOUNT_ID } = process.env;

const getUriForCompany = (companyId: number) => {
    return SOURCE_URI.replace('{id}', `${companyId}`);
};

type FetchCompanyRiskInfoEventBody = {
    companyId: number;
};

const getQueueUrl = async (sqsClient: SQS): Promise<string | undefined> => {
    let queueUrlResponse: PromiseResult<SQS.GetQueueUrlResult, AWSError> | undefined;

    try {
        queueUrlResponse = await sqsClient.getQueueUrl({
            QueueName: FETCH_QUEUE,
            QueueOwnerAWSAccountId: `${AWS_ACCOUNT_ID}`,
        }).promise();

        if (!queueUrlResponse.QueueUrl) {
            console.log(`Queue url not found - ${queueUrlResponse.$response.httpResponse}`);
        }
    } catch (e) {
        console.log(`Queue url fetching failed - ${e}`);
    }

    return queueUrlResponse?.QueueUrl;
};

const scheduleAsyncCompanyDataRefresh = async (id: number) => {
    const sqs = new SQS();
    const queueUrl = await getQueueUrl(sqs);

    if (queueUrl) {
        const messageBody = <FetchCompanyRiskInfoEventBody>{
            companyId: id,
        };
        console.log('About to send a message to the queue', { messageBody });
        await sqs.sendMessage({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(messageBody),
        }).promise();
    } else {
        console.error('No queue url found?', { queueUrl });
    }
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
