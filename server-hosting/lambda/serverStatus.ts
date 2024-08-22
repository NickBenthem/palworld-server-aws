import { EC2Client, SendCommandCommand } from "@aws-sdk/client-ec2";
import { SSMClient } from "@aws-sdk/client-ssm";

const instanceId = process.env.INSTANCE_ID;
const region = process.env.AWS_REGION;
const ec2Client = new EC2Client({ region });
const ssmClient = new SSMClient({ region });

exports.handler = async function (event: any) {
    console.log("Attempting to cat file on server", instanceId);

    const filePath = event.queryStringParameters?.filePath;

    if (!filePath) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Missing filePath parameter" })
        };
    }

    try {
        const command = new SendCommandCommand({
            InstanceIds: [instanceId!],
            DocumentName: "AWS-RunShellScript",
            Parameters: {
                commands: [`cat ${filePath}`]
            }
        });

        const response = await ssmClient.send(command);

        // Extract and format relevant information from the response
        const formattedResponse = {
            commandId: response.Command?.CommandId,
            status: response.Command?.Status,
            responseCode: response.Command?.ResponseCode,
            output: response.Command?.Output
        };

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "File contents retrieved",
                response: formattedResponse
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
            body: JSON.stringify({ message: "Failed to retrieve file contents", response: formattedError }, null, 2)
        };
    }
};