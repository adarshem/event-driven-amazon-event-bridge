const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize SQS client
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ANALYTICS_QUEUE_URL = process.env.ANALYTICS_QUEUE_URL || 'https://sqs.region.amazonaws.com/account-id/AnalyticsQueue';

// In-memory analytics store (would be a real database in production)
const analytics = {
  orderCounts: {
    created: 0,
    updated: 0,
    cancelled: 0
  },
  
  totalRevenue: 0,
  
  recordOrderCreated(orderDetail) {
    this.orderCounts.created++;
    this.totalRevenue += orderDetail.total || 0;
    this.logStats();
  },
  
  recordOrderUpdated(orderDetail) {
    this.orderCounts.updated++;
    // In a real system, you'd need to track the difference in totals
    this.logStats();
  },
  
  recordOrderCancelled(orderDetail) {
    this.orderCounts.cancelled++;
    // In a real system, you'd subtract the order total from revenue
    this.logStats();
  },
  
  logStats() {
    console.log('\n--- Analytics Metrics ---');
    console.log(`Orders Created: ${this.orderCounts.created}`);
    console.log(`Orders Updated: ${this.orderCounts.updated}`);
    console.log(`Orders Cancelled: ${this.orderCounts.cancelled}`);
    console.log(`Total Revenue: $${this.totalRevenue.toFixed(2)}`);
    console.log('------------------------\n');
  }
};

/**
 * Process a message from the queue
 * @param {Object} message - The SQS message
 */
function processMessage(message) {
  try {
    const body = JSON.parse(message.Body);
    const event = JSON.parse(body.Message);
    
    console.log(`Analyzing event: ${event['detail-type']} for order ${event.detail.orderId}`);
    
    switch (event['detail-type']) {
      case 'OrderCreated':
        analytics.recordOrderCreated(event.detail);
        break;
      case 'OrderUpdated':
        analytics.recordOrderUpdated(event.detail);
        break;
      case 'OrderCancelled':
        analytics.recordOrderCancelled(event.detail);
        break;
      default:
        console.log(`Unknown event type: ${event['detail-type']}`);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

/**
 * Poll for messages from SQS
 */
async function pollMessages() {
  try {
    const params = {
      QueueUrl: ANALYTICS_QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20 // Long polling
    };
    
    const command = new ReceiveMessageCommand(params);
    const data = await sqsClient.send(command);
    
    if (data.Messages && data.Messages.length > 0) {
      console.log(`Received ${data.Messages.length} messages`);
      
      for (const message of data.Messages) {
        processMessage(message);
        
        // Delete the message from the queue
        const deleteCommand = new DeleteMessageCommand({
          QueueUrl: ANALYTICS_QUEUE_URL,
          ReceiptHandle: message.ReceiptHandle
        });
        await sqsClient.send(deleteCommand);
      }
    }
  } catch (error) {
    console.error('Error polling messages:', error);
  }
  
  // Continue polling
  setTimeout(pollMessages, 100);
}

// Start polling for messages
console.log('Analytics consumer started');
pollMessages(); 