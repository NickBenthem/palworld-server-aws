import { EC2Client, StopInstancesCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const instanceId = process.env.INSTANCE_ID;
const client = new EC2Client({ region: process.env.AWS_REGION });

exports.handler = async function (event: any) {
  console.log("Attempting to stop game server", instanceId);

  const stopCommand = new StopInstancesCommand({ InstanceIds: [instanceId!] });

  try {
    // Stop the instance
    const stopResponse = await client.send(stopCommand);
    console.log(JSON.stringify(stopResponse));

    // Extract and format relevant information from stop response
    const formattedStopResponse = {
      httpStatusCode: stopResponse.$metadata.httpStatusCode,
      requestId: stopResponse.$metadata.requestId,
      attempts: stopResponse.$metadata.attempts,
      totalRetryDelay: stopResponse.$metadata.totalRetryDelay,
      instances: stopResponse.StoppingInstances?.map(instance => ({
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
        message: "Stopped server",
        response: formattedStopResponse,
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
      body: JSON.stringify({ message: "Failed to stop server", response: formattedError }, null, 2)
    };
  }
};
