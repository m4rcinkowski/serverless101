import { CompanyDataRepositoryInterface } from '../repository/CompanyDataRepositoryInterface';
import { HandlerInterface } from '../bus/HandlerInterface';
import { GetCompanyFinancialRiskData } from './GetCompanyFinancialRiskData';
import { CompanyFinancialRiskData } from '../dto/CompanyFinancialRiskData';
import { MessageBusInterface } from '../bus/MessageBusInterface';
import { ScheduleRefreshingCompanyFinancialRiskData } from '../command/ScheduleRefreshingCompanyFinancialRiskData';

const DATA_FRESHNESS_THRESHOLD_MS = 3600e3;

export class GetCompanyFinancialRiskDataHandler implements HandlerInterface {
    constructor(
        private readonly repository: CompanyDataRepositoryInterface,
        private readonly messageBus: MessageBusInterface,
    ) {
    }

    async handle(message: GetCompanyFinancialRiskData): Promise<any> {
        const { companyId } = message;
        const companyData = await this.repository.get(companyId);

        if (this.needsToRefreshCompanyData(companyData, message.referenceDate)) {
            await this.messageBus.dispatch(new ScheduleRefreshingCompanyFinancialRiskData(companyId));
        }

        return companyData;
    }

    private isFreshEnough(item: CompanyFinancialRiskData, referenceDate: Date): boolean {
        const itemDate = new Date(item.lastFetchedAt as string);
        const itemTimestamp = itemDate.getTime();
        const referenceTimestamp = referenceDate.getTime();

        console.log({ itemTimestamp, referenceTimestamp });

        return itemTimestamp >= referenceTimestamp - DATA_FRESHNESS_THRESHOLD_MS;
    }

    private needsToRefreshCompanyData(data: CompanyFinancialRiskData | null, referenceDate): boolean {
        return !data || !this.isFreshEnough(data, referenceDate);
    };
}
