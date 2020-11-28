import { CommandInterface } from '../bus/CommandInterface';

export class RefreshCompanyFinancialRiskData implements CommandInterface {
    constructor(
        public readonly companyId: number,
    ) {
    }
}
