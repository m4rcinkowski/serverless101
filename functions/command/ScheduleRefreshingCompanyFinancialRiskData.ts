import { CommandInterface } from '../bus/CommandInterface';

export class ScheduleRefreshingCompanyFinancialRiskData implements CommandInterface {
    constructor(
        public readonly companyId: number,
    ) {
    }
}
