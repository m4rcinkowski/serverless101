import { QueryInterface } from '../bus/QueryInterface';

export class GetCompanyFinancialRiskData implements QueryInterface {
    constructor(public readonly companyId: number, public readonly referenceDate: Date) {
    }
}
