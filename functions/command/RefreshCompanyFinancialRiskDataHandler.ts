import { HandlerInterface } from '../bus/HandlerInterface';
import { RefreshCompanyFinancialRiskData } from './RefreshCompanyFinancialRiskData';
import { CompanyDataRepositoryInterface } from '../repository/CompanyDataRepositoryInterface';

export class RefreshCompanyFinancialRiskDataHandler implements HandlerInterface {
    constructor(
        private readonly sourceRepository: CompanyDataRepositoryInterface,
        private readonly targetRepository: CompanyDataRepositoryInterface,
    ) {
    }

    async handle(command: RefreshCompanyFinancialRiskData): Promise<any> {
        const { companyId } = command;
        const newData = await this.sourceRepository.get(companyId);

        if (!newData) {
            throw new Error('Failed to fetch company data from the source.');
        }

        await this.targetRepository.update(companyId, newData);
    }
}
