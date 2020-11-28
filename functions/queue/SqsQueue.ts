import { QueueInterface } from './QueueInterface';
import * as SQS from 'aws-sdk/clients/sqs';
import assert = require('assert');

const { FETCH_QUEUE_URL } = process.env;

assert.ok(FETCH_QUEUE_URL, 'Queue URL is not provided.');

export class SqsQueue implements QueueInterface {
    private readonly client: SQS;

    constructor(private readonly queueUrl: string = FETCH_QUEUE_URL!) {
        this.client = new SQS();
    }

    async publish(message: {}): Promise<void> {
        await this.client.sendMessage({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(message),
        }).promise();
    }
}
