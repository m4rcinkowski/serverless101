'use strict';

import { APIGatewayProxyHandler } from 'aws-lambda';
import fetch from 'node-fetch';

const getUriForCompany = (companyId: number) => {
    if (!process.env.SOURCE_URI) {
        throw new Error('No SOURCE_URI env variable!');
    }

    return process.env.SOURCE_URI.replace('{id}', `${companyId}`);
};

const handler: APIGatewayProxyHandler = async event => {
    const id = parseInt(event.pathParameters?.id || '', 10);
    const response = await fetch(getUriForCompany(id));

    if (response.ok) {
        return {
            statusCode: response.status,
            body: JSON.stringify(await response.json(), null, 2),
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
