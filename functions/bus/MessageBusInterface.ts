import { MessageInterface } from '../bus/MessageInterface';

export interface MessageBusInterface {
    dispatch(message: MessageInterface): Promise<any>;
}
