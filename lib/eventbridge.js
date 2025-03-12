const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

// Initialize EventBridge client
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

/**
 * Publishes an event to EventBridge
 * @param {string} detailType - The detail type of the event
 * @param {string} source - The source of the event
 * @param {Object} detail - The event details
 * @returns {Promise} - The response from EventBridge
 */
async function publishEvent(detailType, source, detail) {
  const params = {
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        Time: new Date()
      }
    ]
  };

  try {
    const command = new PutEventsCommand(params);
    const response = await eventBridgeClient.send(command);
    console.log(`Event published successfully: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    console.error('Error publishing event:', error);
    throw error;
  }
}

module.exports = {
  publishEvent
}; 