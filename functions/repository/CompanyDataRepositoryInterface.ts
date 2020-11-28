import { CompanyFinancialRiskData } from '../dto/CompanyFinancialRiskData';

export interface CompanyDataRepositoryInterface {
    get(companyId: number): Promise<CompanyFinancialRiskData | null>;

    update(companyId: number, companyData: CompanyFinancialRiskData): Promise<void>;
}
