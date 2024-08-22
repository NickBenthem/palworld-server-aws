import * as ec2 from "aws-cdk-lib/aws-ec2";
import {Config} from "../config";
import { Stack } from "aws-cdk-lib";

export function  setupSecurity(awsStack : Stack, prefix: any) {
    let lookUpOrDefaultVpc = (vpcId: string): ec2.IVpc => {
        // lookup vpc if given
        if (vpcId) {
            return ec2.Vpc.fromLookup(awsStack, `${prefix}Vpc`, {
                vpcId
            })

            // use default vpc otherwise
        } else {
            return ec2.Vpc.fromLookup(awsStack, `${prefix}Vpc`, {
                isDefault: true
            })
        }
    }

    let publicOrLookupSubnet = (subnetId: string, availabilityZone: string): ec2.SubnetSelection => {
        // if subnet id is given select it
        if (subnetId && availabilityZone) {
            return {
                subnets: [
                    ec2.Subnet.fromSubnetAttributes(awsStack, `${Config.prefix}ServerSubnet`, {
                        availabilityZone,
                        subnetId
                    })
                ]
            };

            // else use any available public subnet
        } else {
            return {subnetType: ec2.SubnetType.PUBLIC};
        }
    }

    const vpc = lookUpOrDefaultVpc(Config.vpcId);
    const vpcSubnets = publicOrLookupSubnet(Config.subnetId, Config.availabilityZone);

    // configure security group to allow ingress access to game ports
    const securityGroup = new ec2.SecurityGroup(awsStack, `${prefix}ServerSecurityGroup`, {
        vpc,
        description: "Allow Palworld client to connect  to server",
    })

    // Apply security group rules
    // Helper function to get the appropriate Port method
    const getPortMethod = (protocol: 'TCP' | 'UDP'): (port: number) => ec2.Port => {
        return protocol === 'TCP' ? ec2.Port.tcp : ec2.Port.udp;
    };

    // Function to apply security group rules
    Config.ports.forEach(({ protocol, port, description }) => {
        const portMethod = getPortMethod(protocol);
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            portMethod(port),
            `${description} (${protocol})`
        );
    });

    return {vpc, vpcSubnets, securityGroup};
}