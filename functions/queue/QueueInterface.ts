export interface QueueInterface {
    publish(message: {}): Promise<void>;
}
