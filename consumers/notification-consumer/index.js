const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize SQS client
const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const NOTIFICATION_QUEUE_URL = process.env.NOTIFICATION_QUEUE_URL || 'https://sqs.region.amazonaws.com/account-id/NotificationQueue';

// Mock notification service (in a real app, this would send emails, SMS, etc.)
const notificationService = {
  sendOrderConfirmation(orderId, customerId) {
    console.log(`📧 Sending order confirmation email for order ${orderId} to customer ${customerId}`);
    // In a real system, this would use a notification service like Amazon SES, SNS, etc.
  },
  
  sendOrderUpdateNotification(orderId, customerId) {
    console.log(`📧 Sending order update notification for order ${orderId} to customer ${customerId}`);
  },
  
  sendOrderCancellationNotification(orderId, customerId, reason) {
    console.log(`📧 Sending order cancellation notification for order ${orderId} to customer ${customerId}`);
    console.log(`   Reason: ${reason}`);
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
    
    console.log(`Processing notification for event: ${event['detail-type']}`);
    
    const detail = event.detail;
    const customerId = detail.customerId || 'unknown';
    
    switch (event['detail-type']) {
      case 'OrderCreated':
        notificationService.sendOrderConfirmation(detail.orderId, customerId);
        break;
        
      case 'OrderUpdated':
        notificationService.sendOrderUpdateNotification(detail.orderId, customerId);
        break;
        
      case 'OrderCancelled':
        notificationService.sendOrderCancellationNotification(
          detail.orderId, 
          customerId, 
          detail.reason || 'No reason provided'
        );
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
      QueueUrl: NOTIFICATION_QUEUE_URL,
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
          QueueUrl: NOTIFICATION_QUEUE_URL,
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
console.log('Notification consumer started');
pollMessages(); 