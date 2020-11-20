'use strict';

import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

type FinancialRiskInfo = {
    status: 'legit' | 'debtor',
    lastUpdatedAt: string,
};

const fixedData: { [companyId: number]: FinancialRiskInfo } = {
    123: { status: 'legit', lastUpdatedAt: (new Date('2015-02-24')).toISOString() },
    456: { status: 'debtor', lastUpdatedAt: (new Date('2017-09-12')).toISOString() },
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

const handler: APIGatewayProxyHandler = async event => {
    const id = event.pathParameters?.id;
    const info = id ? fixedData[id] : null;
    const sleepTimeMS = 2e3 + Math.random() * 5e3;

    await wait(sleepTimeMS);

    return {
        statusCode: info ? 200 : 404,
        body: info ? JSON.stringify(info, null, 2) : `Company ${id} not found`,
    };
};

export default handler;
