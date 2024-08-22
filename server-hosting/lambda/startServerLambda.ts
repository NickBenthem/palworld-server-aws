import { EC2Client, StartInstancesCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const instanceId = process.env.INSTANCE_ID;
const client = new EC2Client({ region: process.env.AWS_REGION });

exports.handler = async function (event: any) {
  console.log("Attempting to start game server", instanceId);

  const startCommand = new StartInstancesCommand({ InstanceIds: [instanceId!] });

  try {
    // Start the instance
    const startResponse = await client.send(startCommand);
    console.log(JSON.stringify(startResponse));

    // Extract and format relevant information from start response
    const formattedStartResponse = {
      httpStatusCode: startResponse.$metadata.httpStatusCode,
      requestId: startResponse.$metadata.requestId,
      attempts: startResponse.$metadata.attempts,
      totalRetryDelay: startResponse.$metadata.totalRetryDelay,
      instances: startResponse.StartingInstances?.map(instance => ({
        instanceId: instance.InstanceId,
        currentState: instance.CurrentState?.Name,
        previousState: instance.PreviousState?.Name
      }))
    };

    // Get the public IP address of the instance
    const describeCommand = new DescribeInstancesCommand({ InstanceIds: [instanceId!] });
    const describeResponse = await client.send(describeCommand);
    const publicIpAddress = describeResponse.Reservations?.[0].Instances?.[0].PublicIpAddress ||
        "IP Address not available yet. Please refresh the page in a few minutes." +
        " AWS IP addresses can take a few minutes to appear after instance start.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Started server",
        response: formattedStartResponse,
        publicIpAddress: publicIpAddress
      }, null, 2)
    };
  } catch (err) {
    console.log(JSON.stringify(err));

    // Extract and format error information
    const formattedError = {
      message: err.message,
      code: err.code,
      time: err.time,
      requestId: err.requestId,
      statusCode: err.statusCode,
      retryable: err.retryable,
      retryDelay: err.retryDelay
    };

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Failed to start server", response: formattedError }, null, 2)
    };
  }
};
