import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import {Config} from "../config";
import {Stack} from "aws-cdk-lib";

export function setupSaveBucket(cdkStack: Stack, prefix: any, server: ec2.Instance) {
    let findOrCreateBucket = (bucketName: string): s3.IBucket => {
        // if bucket already exists lookup and use the bucket
        if (bucketName) {
            return s3.Bucket.fromBucketName(cdkStack, `${prefix}SavesBucket`, bucketName);
            // if bucket does not exist create a new bucket
            // autogenerate name to reduce possibility of conflict
        } else {
            return new s3.Bucket(cdkStack, `${prefix}SavesBucket`);
        }
    }

    // allow server to read and write save files to and from save bucket
    const savesBucket = findOrCreateBucket(Config.bucketName);
    savesBucket.grantReadWrite(server.role);
    return savesBucket;
}
