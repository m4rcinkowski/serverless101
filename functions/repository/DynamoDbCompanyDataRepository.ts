import { CompanyDataRepositoryInterface } from './CompanyDataRepositoryInterface';
import { CompanyFinancialRiskData } from '../dto/CompanyFinancialRiskData';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import assert = require('assert');

const { COMPANIES_TABLE } = process.env;

assert.ok(COMPANIES_TABLE, 'Table name is not provided.');

export class DynamoDbCompanyDataRepository implements CompanyDataRepositoryInterface {
    private readonly dbClient: DynamoDB.DocumentClient;

    constructor(
        private readonly tableName: string = COMPANIES_TABLE!,
    ) {
        this.dbClient = new DynamoDB.DocumentClient();
    }

    async get(companyId: number): Promise<CompanyFinancialRiskData | null> {
        const getResponse = await this.dbClient.get({
            TableName: this.tableName,
            Key: {
                companyId,
            },
        }).promise();

        return (getResponse.Item as CompanyFinancialRiskData) || null;
    }

    async update(companyId: number, companyData: CompanyFinancialRiskData): Promise<void> {
        await this.dbClient.put({
            TableName: this.tableName,
            Item: {
                companyId,
                ...companyData,
            },
        }).promise();
    }
}
