import { MessageInterface } from './MessageInterface';

export interface HandlerInterface {
    handle(message: MessageInterface): Promise<any>;
}
