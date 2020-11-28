'use strict';

import { APIGatewayProxyHandler, SQSHandler } from 'aws-lambda';
import { GetCompanyFinancialRiskData } from './query/GetCompanyFinancialRiskData';
import { MyMessageBus } from './bus/MyMessageBus';
import { RefreshCompanyFinancialRiskData } from './command/RefreshCompanyFinancialRiskData';
import { FetchCompanyRiskInfoEventBody } from './queue/event/FetchCompanyRiskInfoEventBody';
import { CompanyFinancialRiskData } from './dto/CompanyFinancialRiskData';

export const apiCheckCompany: APIGatewayProxyHandler = async event => {
    const id = parseInt(event.pathParameters?.id || '', 10);
    const referenceDate = new Date(event.requestContext.requestTimeEpoch);

    const companyData: CompanyFinancialRiskData | null = await MyMessageBus.dispatch(
        new GetCompanyFinancialRiskData(id, referenceDate),
    );

    if (!companyData) {
        return {
            statusCode: 502,
            body: JSON.stringify({
                message: 'Temporary companyData source failure',
            }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(companyData),
    };
};

export const queueFetchCompany: SQSHandler = async event => {
    //fixme: critical bug ahead - only the first event from a batch is being handled here
    const body: FetchCompanyRiskInfoEventBody = JSON.parse((event.Records.shift() || {}).body || '{}');
    const id = parseInt((body.companyId || '') as any, 10);

    console.debug(`Processing a message with company id to fetch: ${id}`);

    await MyMessageBus.dispatch(
        new RefreshCompanyFinancialRiskData(id),
    );
};
