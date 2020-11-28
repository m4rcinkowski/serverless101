import { CompanyDataRepositoryInterface } from './CompanyDataRepositoryInterface';
import { CompanyFinancialRiskData } from '../dto/CompanyFinancialRiskData';
import fetch from 'node-fetch';
import assert = require('assert');

const { SOURCE_URI } = process.env;

assert.ok(SOURCE_URI, 'No SOURCE_URI env variable!');

export class LegacyApiServiceCompanyDataRepository implements CompanyDataRepositoryInterface {
    constructor(private readonly sourceUri: string = SOURCE_URI!) {
    }

    async get(companyId: number): Promise<CompanyFinancialRiskData | null> {
        const response = await fetch(this.getUriForCompany(companyId));

        if (!response.ok) {
            console.debug({
                status: `${response.status} ${response.statusText}`,
                content: await response.text(),
            });

            throw new Error('Failed to fetch company data from the API');
        }

        const companyInfo = await response.json();
        const lastFetchedAt = (new Date()).toISOString();

        return {
            ...companyInfo,
            lastFetchedAt,
        };
    }

    public update(companyId: number, companyData: CompanyFinancialRiskData): Promise<void> {
        throw new Error('Not implemented - a read only repository');
    }

    private getUriForCompany(companyId: number): string {
        return this.sourceUri.replace('{id}', `${companyId}`);
    };
}
