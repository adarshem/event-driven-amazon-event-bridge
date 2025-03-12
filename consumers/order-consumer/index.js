const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize SQS client
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ORDER_PROCESSING_QUEUE_URL = process.env.ORDER_PROCESSING_QUEUE_URL || 'https://sqs.region.amazonaws.com/account-id/OrderProcessingQueue';

// Database operations would normally be here
const orderDb = {
  orders: new Map(),
  
  createOrder(orderData) {
    this.orders.set(orderData.orderId, orderData);
    console.log(`[DB] Order ${orderData.orderId} created in database`);
  },
  
  updateOrder(orderId, changes) {
    const order = this.orders.get(orderId);
    if (order) {
      const updatedOrder = { 
        ...order, 
        ...changes,
        items: changes.items || order.items,
        status: 'UPDATED'
      };
      this.orders.set(orderId, updatedOrder);
      console.log(`[DB] Order ${orderId} updated in database`);
    } else {
      console.error(`[DB] Order ${orderId} not found for update`);
    }
  },
  
  cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = 'CANCELLED';
      console.log(`[DB] Order ${orderId} marked as cancelled in database`);
    } else {
      console.error(`[DB] Order ${orderId} not found for cancellation`);
    }
  },
  
  getOrder(orderId) {
    return this.orders.get(orderId);
  }
};

/**
 * Process an order created event
 * @param {Object} detail - The event detail
 */
function processOrderCreated(detail) {
  console.log(`Processing order created: ${detail.orderId}`);
  orderDb.createOrder(detail);
}

/**
 * Process an order updated event
 * @param {Object} detail - The event detail
 */
function processOrderUpdated(detail) {
  console.log(`Processing order updated: ${detail.orderId}`);
  orderDb.updateOrder(detail.orderId, detail.changes);
}

/**
 * Process an order cancelled event
 * @param {Object} detail - The event detail
 */
function processOrderCancelled(detail) {
  console.log(`Processing order cancelled: ${detail.orderId}`);
  orderDb.cancelOrder(detail.orderId);
}

/**
 * Process a message from the queue
 * @param {Object} message - The SQS message
 */
function processMessage(message) {
  try {
    const body = JSON.parse(message.Body);
    const event = JSON.parse(body.Message);
    
    console.log(`Processing event: ${event.detail-type} from ${event.source}`);
    
    switch (event['detail-type']) {
      case 'OrderCreated':
        processOrderCreated(event.detail);
        break;
      case 'OrderUpdated':
        processOrderUpdated(event.detail);
        break;
      case 'OrderCancelled':
        processOrderCancelled(event.detail);
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
      QueueUrl: ORDER_PROCESSING_QUEUE_URL,
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
          QueueUrl: ORDER_PROCESSING_QUEUE_URL,
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
console.log('Order consumer started');
pollMessages(); 