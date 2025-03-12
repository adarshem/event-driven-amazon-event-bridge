const { v4: uuidv4 } = require('uuid');
const { publishEvent } = require('../lib/eventbridge');

// Source for all order events
const EVENT_SOURCE = 'com.example.orders';

/**
 * Create a new order and publish the event
 * @param {Object} orderData - The order details
 * @returns {string} - The new order ID
 */
async function createOrder(orderData) {
  const orderId = uuidv4();
  
  const orderDetails = {
    orderId,
    status: 'CREATED',
    timestamp: new Date().toISOString(),
    ...orderData
  };
  
  await publishEvent('OrderCreated', EVENT_SOURCE, orderDetails);
  console.log(`Order created: ${orderId}`);
  return orderId;
}

/**
 * Update an existing order and publish the event
 * @param {string} orderId - The ID of the order to update
 * @param {Object} updateData - The data to update
 */
async function updateOrder(orderId, updateData) {
  const orderDetails = {
    orderId,
    status: 'UPDATED',
    timestamp: new Date().toISOString(),
    changes: updateData
  };
  
  await publishEvent('OrderUpdated', EVENT_SOURCE, orderDetails);
  console.log(`Order updated: ${orderId}`);
}

/**
 * Cancel an order and publish the event
 * @param {string} orderId - The ID of the order to cancel
 * @param {string} reason - The reason for cancellation
 */
async function cancelOrder(orderId, reason) {
  const orderDetails = {
    orderId,
    status: 'CANCELLED',
    timestamp: new Date().toISOString(),
    reason
  };
  
  await publishEvent('OrderCancelled', EVENT_SOURCE, orderDetails);
  console.log(`Order cancelled: ${orderId}`);
}

// Example usage
async function runExample() {
  try {
    // Create a new order
    const orderId = await createOrder({
      customerId: 'cust123',
      items: [
        { productId: 'prod1', quantity: 2, price: 19.99 },
        { productId: 'prod2', quantity: 1, price: 29.99 }
      ],
      total: 69.97
    });
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update the order
    await updateOrder(orderId, {
      items: [
        { productId: 'prod1', quantity: 3, price: 19.99 },
        { productId: 'prod2', quantity: 1, price: 29.99 }
      ],
      total: 89.96
    });
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Cancel the order
    await cancelOrder(orderId, 'Customer requested cancellation');
    
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// If this file is run directly, run the example
if (require.main === module) {
  runExample();
}

module.exports = {
  createOrder,
  updateOrder,
  cancelOrder
}; 