# Event-Driven Order Processing with Amazon EventBridge

This project demonstrates an event-driven architecture using Amazon EventBridge and SQS for processing orders in a decoupled system.

## Architecture Overview

![Architecture Diagram](https://mermaid.ink/img/pako:eNp9VNuOmzAQ_RXkfWklVuKipAsrVeL61KbZoqpSYR8c7ARrwY5ss1G62X-vA4E4iK0fLGbOmTPjGZs3UDKEgQ-2NTuUFeTS-PazoIZaot3sONxXxrrd1ERUmPf-81rnPzjC_Ao99ximqKCT8OB3lhdA7UZUsxYV4Pmqk4R50MC_jBrJK6Yy5ATtsIZnT5k9pOKsxEIQujOeWtxOWE4eUFgfJSnFHOzmKybJlpRQEpVMZ8yVHDEq2gZzcRWJhjoGTEsQ6dnn8En6CWWugpgdqJAcw0b17moY2VFI3IibJsZh_qmrTRgxlHADBf6swYFWXAxFtWGQIw1f3RaXYf5KypnurI37-6-nAnSpIlWNxKgoaGf-2iPdjCAtcV0rBzipGffx_Z6EnUw3bnHqBvwR4HwEuLrgWaEjfFe3A-6wokT2CDlTyBkhdwrdyEa9aH8whcaXU0SDouSqoScjuLh7tUz1SzlXQ8_KGgoR460BD8LYkrr279LU8yzLVPNkL9i_c1wndROzZDXjg_U4Cd4Pr-wiYVne8uFhlLCsL94yvEgcKiLxVKC8XLhLvJsu7HAxxruWm3rp_-LR9QL2ColnJ0t3VIgc-2ExV4Gmo-Zonmd13hyz679qip5J3bDxpDf-yDYjx1QtHs5xg8ahGZgrrcZHYAJFaiBB6sf2duYWQFa4wQXw1SeC_KUABX1XPNhKlh1pCXzJW2wCztpdBfwtrIWy2m76MYHqUTajdw_pH8aaCStBRDLe67z_Axpgr1c)

The system follows a publisher-subscriber pattern with these components:

- **Order Publisher**: Creates, updates, and cancels orders, publishing events to EventBridge
- **EventBridge**: Routes events to appropriate SQS queues
- **SQS Queues**: Buffer events for each consumer service
- **Consumers**:
  - **Order Consumer**: Processes order business logic and updates database
  - **Analytics Consumer**: Tracks metrics about orders
  - **Notification Consumer**: Sends notifications based on order events

## Prerequisites

- Node.js (v14+)
- AWS account with appropriate permissions
- AWS CLI configured with credentials

## Setup

1. **Clone the repository and install dependencies**
```bash
git clone <repository-url>
cd event-driven-orders
npm install
```
2. **Set up AWS resources**

You'll need to create the following AWS resources:

- **EventBridge Event Bus** (or use the default bus)
- **Three SQS Queues**:
  - OrderProcessingQueue
  - AnalyticsQueue
  - NotificationQueue

3. **Create EventBridge Rules**

Create rules to route events from the event bus to each SQS queue:

- Rule 1: Route all order events (source: "com.example.orders") to OrderProcessingQueue
- Rule 2: Route all order events (source: "com.example.orders") to AnalyticsQueue
- Rule 3: Route all order events (source: "com.example.orders") to NotificationQueue

You can do this via AWS Console or using AWS CDK/CloudFormation.

4. **Configure environment variables**

Create a `.env` file in the project root:
```
AWS_REGION=us-east-1
EVENT_BUS_NAME=default
ORDER_PROCESSING_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account-id>/OrderProcessingQueue
ANALYTICS_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account-id>/AnalyticsQueue
NOTIFICATION_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account-id>/NotificationQueue
```
Replace `<region>` and `<account-id>` with your AWS region and account ID.

## Running the Application

1. **Start the consumers (in separate terminal windows)**

```bash
Terminal 1 - Order Consumer
pnpm run order-consumer
Terminal 2 - Analytics Consumer
pnpm run analytics-consumer
Terminal 3 - Notification Consumer
pnpm run notification-consumer
```

2. **Run the publisher to generate events**
```bash
pnpm run publisher
```

The publisher will:
1. Create a new order
2. Wait 2 seconds
3. Update the order
4. Wait 2 seconds
5. Cancel the order

Each consumer will process these events according to its responsibilities.

## Benefits of This Architecture

1. **Loose Coupling**: Services don't depend on each other directly
2. **Scalability**: Each consumer can scale independently
3. **Resilience**: If one consumer fails, others continue working
4. **Extensibility**: Easy to add new consumers without modifying existing code
5. **Audit Trail**: Events provide a complete history of all activities

## Local Development vs. Production

For local development, this example uses in-memory data structures. In a production environment, you would:

1. Use a real database like DynamoDB or RDS
2. Implement proper error handling and retries
3. Add logging and monitoring
4. Implement authentication and authorization
5. Consider using AWS Lambda for the consumers
6. Use Infrastructure as Code (CloudFormation, CDK, etc.) to define resources

## Troubleshooting

- **No events received**: Verify EventBridge rules are correctly configured and check IAM permissions
- **Events not processed**: Check SQS queue permissions and visibility timeout settings
- **Errors in processing**: Review consumer logs for specific error messages

## Further Improvements

- Add unit and integration tests
- Implement dead-letter queues for failed messages
- Add validation for event schemas
- Implement idempotent event processing
- Add monitoring and alerting# event-driven-amazon-event-bridge
