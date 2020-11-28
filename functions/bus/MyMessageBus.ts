import { MessageBusInterface } from './MessageBusInterface';
import { MessageInterface } from './MessageInterface';
import { HandlerInterface } from './HandlerInterface';
import { GetCompanyFinancialRiskData } from '../query/GetCompanyFinancialRiskData';
import { GetCompanyFinancialRiskDataHandler } from '../query/GetCompanyFinancialRiskDataHandler';
import { DynamoDbCompanyDataRepository } from '../repository/DynamoDbCompanyDataRepository';
import { ScheduleRefreshingCompanyFinancialRiskData } from '../command/ScheduleRefreshingCompanyFinancialRiskData';
import { ScheduleRefreshingCompanyFinancialRiskDataHandler } from '../command/ScheduleRefreshingCompanyFinancialRiskDataHandler';
import { SqsQueue } from '../queue/SqsQueue';
import { RefreshCompanyFinancialRiskData } from '../command/RefreshCompanyFinancialRiskData';
import { RefreshCompanyFinancialRiskDataHandler } from '../command/RefreshCompanyFinancialRiskDataHandler';
import { LegacyApiServiceCompanyDataRepository } from '../repository/LegacyApiServiceCompanyDataRepository';

class MessageBus implements MessageBusInterface {
    private readonly messageHandlerMap: Map<Symbol, HandlerInterface> = new Map();

    add(message: Function, handler: HandlerInterface): this {
        this.messageHandlerMap.set(Symbol.for(message.name), handler);

        return this;
    }

    async dispatch(message: MessageInterface): Promise<any> {
        const key = Symbol.for(message.constructor.name);

        if (!this.messageHandlerMap.has(key)) {
            console.debug({ map: this.messageHandlerMap });

            throw new Error(`No handler for message: ${message.constructor.name}`);
        }

        return this.messageHandlerMap.get(key)!.handle(message);
    }
}

const MyMessageBus = new MessageBus();
MyMessageBus
    .add(
        GetCompanyFinancialRiskData,
        new GetCompanyFinancialRiskDataHandler(new DynamoDbCompanyDataRepository(), MyMessageBus),
    )
    .add(
        ScheduleRefreshingCompanyFinancialRiskData,
        new ScheduleRefreshingCompanyFinancialRiskDataHandler(new SqsQueue()),
    )
    .add(
        RefreshCompanyFinancialRiskData,
        new RefreshCompanyFinancialRiskDataHandler(
            new LegacyApiServiceCompanyDataRepository(),
            new DynamoDbCompanyDataRepository(),
        ),
    );

export { MyMessageBus };
