import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import {Config} from "../config";
import {Duration, Stack} from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigw from "aws-cdk-lib/aws-apigateway";

function createLambdaFunction(
    awsStack: Stack,
    id: string,
    entry: string,
    description: string,
    instanceId: string,
    actions: string[]): lambda_nodejs.NodejsFunction {
    const lambdaFunction = new lambda_nodejs.NodejsFunction(awsStack, id, {
        entry,
        description,
        timeout: Duration.seconds(10),
        environment: {
            INSTANCE_ID: instanceId
        }
    });

    /* DescribeInstances requires utilizing a * access policy. */
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
        actions: [...actions, 'ec2:DescribeInstances'],
        resources: [
            `*`,
        ]
    }));

    return lambdaFunction;
}

function createApiGateway(awsStack: Stack, id: string, handler: lambda_nodejs.NodejsFunction, description: string): apigw.LambdaRestApi {
    return new apigw.LambdaRestApi(awsStack, id, {
        handler,
        description
    });
}

export function addStopServerAPI(awsStack: Stack, server: ec2.Instance) {
    const stopServerLambda = createLambdaFunction(
        awsStack,
        `${Config.prefix}StopServerLambda`,
        './server-hosting/lambda/stopServerLambda.ts',
        "Stop game server",
        server.instanceId,
        ['ec2:StopInstances']
    );

    createApiGateway(awsStack, `${Config.prefix}StopServerApi`, stopServerLambda, "Trigger lambda function to stop server");
}

export function addStartServerAPI(awsStack: Stack, server: ec2.Instance) {
    const startServerLambda = createLambdaFunction(
        awsStack,
        `${Config.prefix}StartServerLambda`,
        './server-hosting/lambda/startServerLambda.ts',
        "Start game server",
        server.instanceId,
        ['ec2:StartInstances']
    );

    createApiGateway(awsStack, `${Config.prefix}StartServerApi`, startServerLambda, "Trigger lambda function to start server");
}
