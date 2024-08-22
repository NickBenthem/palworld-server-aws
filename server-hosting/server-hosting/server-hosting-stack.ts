import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Config } from '../config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_assets from 'aws-cdk-lib/aws-s3-assets';
import * as cdk from 'aws-cdk-lib/core';
import * as lambda_nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import {Instance} from "@aws-sdk/client-ec2";
import { setupSaveBucket } from './s3';
import {setupSecurity} from "./vpc";
import {addStartServerAPI, addStopServerAPI} from "./lambda";

export class ServerHostingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // prefix for all resources in this stack
    const prefix = Config.prefix;

    //////////////////////////////////////////
    // Configure server, network and security
    //////////////////////////////////////////
    const {vpc, vpcSubnets, securityGroup} = setupSecurity(this,prefix);
    // Attempt to retrieve an existing volume using the stack's logical ID or output from a previous deployment

    // Snapshot CFN SSM Parameter
    // const snapshot = StringParameter.fromStringParameterName(this, 'SnapshotId', '/ops/snapshot_id')
    const snapshot = 'snap-0234e734506940390';

    // Should we use a snapshot for this EBS volume?
    const useSnapshot = new cdk.CfnCondition(this, 'UseSnapshot', {
      expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(snapshot, 'default'))
    })

    // If using snapshot pass in SnapshotId otherwise AWS::NoValue
    // const useSnapshotId = cdk.Fn.conditionIf(useSnapshot.logicalId, snapshot, cdk.Aws.NO_VALUE).toString()
    // const volume = ec2.BlockDeviceVolume.ebsFromSnapshot(useSnapshotId, { volumeType: ec2.EbsDeviceVolumeType.GP3 })


    const server = new ec2.Instance(this, `${prefix}Server`, {
      // https://www.reddit.com/r/Palworld/comments/1acx9dl/setting_up_a_dedicated_server_my_experience_and/
      //  4 cores @ 3.7Ghz and 32GB of memory efficiently
      //  instanceType: new ec2.InstanceType("m6a.2xlarge"),
      instanceType: new ec2.InstanceType(Config.instanceType),
      // get exact ami from parameter exported by canonical
      // https://discourse.ubuntu.com/t/finding-ubuntu-images-with-the-aws-ssm-parameter-store/15507
      machineImage: ec2.MachineImage.fromSsmParameter("/aws/service/canonical/ubuntu/server/20.04/stable/current/amd64/hvm/ebs-gp2/ami-id"),
      // storage for steam, Palworld and save files
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(Config.volumeSize),
        }
      ],
      // server needs a public ip to allow connections
      vpcSubnets,
      userDataCausesReplacement: true,
      vpc,
      securityGroup,
    })

    // Add Base SSM Permissions, so we can use AWS Session Manager to connect to our server, rather than external SSH.
    server.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    //////////////////////////////
    // Configure save bucket
    //////////////////////////////
    const savesBucket = setupSaveBucket(this, prefix, server);

    //////////////////////////////
    // Configure instance startup
    //////////////////////////////

    // add aws cli
    // needed to download install script asset and
    // perform backups to s3
    server.userData.addCommands('sudo apt-get install unzip -y ')
    server.userData.addCommands('curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && ./aws/install')

    // package startup script and grant read access to server
    this.setupServerStartupScripts(server, savesBucket);

    //////////////////////////////
    // Add api to start server
    //////////////////////////////

    if (Config.restartApi) {
      addStartServerAPI(this,server);
      addStopServerAPI(this,server)
    }

  }


  private setupServerStartupScripts(server: ec2.Instance, savesBucket: s3.IBucket) {
    const scriptsPath = './server-hosting/server-assets/'; // Local path.
    const rootDirPath = '/home/ubuntu'; // Root directory for the CDK user

    // Bundle all scripts in the server-hosting/scripts folder.
    const startupScripts = new s3_assets.Asset(this, `${Config.prefix}InstallAsset`, {
      path: scriptsPath // This should bundle all files in the directory
    });
    startupScripts.grantRead(server.role);

    // Download all files to the root directory. These are all Zipped.
    server.userData.addS3DownloadCommand({
      bucket: startupScripts.bucket,
      bucketKey: startupScripts.s3ObjectKey,
      localFile: `${rootDirPath}/` // Ensure all files are downloaded to the root directory
    });

    server.userData.addCommands(
        '#!/bin/bash',
        '',
        '# Unzip all zip files in the specified directory',
        `for zip_file in ${rootDirPath}/*.zip; do`,
        '    if [ -f "$zip_file" ]; then',
        `        unzip -o "$zip_file" -d ${rootDirPath}`,
        '    fi',
        'done',
        '',
        '# Add execute permissions to all files in the specified directory',
        `chmod +x ${rootDirPath}/*`,
        '',
        `echo "All zip files have been extracted and execute permissions have been added to all files in ${rootDirPath}."`
    );

    // Install steam.
    const steamInstallScriptFileName = 'scripts/server-initialization/initialize-steam.sh';
    const steamInstallScriptPath = `${rootDirPath}/${steamInstallScriptFileName}`; // Path for the specific script

    server.userData.addExecuteFileCommand({
      filePath: steamInstallScriptPath, // Path to the specific script in the root directory
      arguments: `${Config.steamAppId}`
    });


    // Initialize s3 backup. Easier to access the game files.
    const s3SyncScriptFileName = 'scripts/server-initialization/s3_sync.sh';
    const s3SyncScriptPath = `${rootDirPath}/${s3SyncScriptFileName}`; // Path for the specific script

    server.userData.addExecuteFileCommand({
      filePath: s3SyncScriptPath, // Path to the specific script in the root directory
      arguments: ` ${Config.saveFile} ${savesBucket.bucketName}`
    });

  }

}
