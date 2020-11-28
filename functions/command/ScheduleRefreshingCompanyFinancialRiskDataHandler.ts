import { HandlerInterface } from '../bus/HandlerInterface';
import { QueueInterface } from '../queue/QueueInterface';
import { ScheduleRefreshingCompanyFinancialRiskData } from './ScheduleRefreshingCompanyFinancialRiskData';
import { FetchCompanyRiskInfoEventBody } from '../queue/event/FetchCompanyRiskInfoEventBody';

export class ScheduleRefreshingCompanyFinancialRiskDataHandler implements HandlerInterface {
    constructor(private readonly queue: QueueInterface) {
    }

    async handle(command: ScheduleRefreshingCompanyFinancialRiskData): Promise<any> {
        const message = <FetchCompanyRiskInfoEventBody>{
            companyId: command.companyId,
        };

        console.log('About to send a message to the queue', { message });

        await this.queue.publish(message);
    }
}
