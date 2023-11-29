import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { SubnetType, Network } from "@vniche/aws-vpc-pulumi";
import { Service, Tags } from "@vniche/aws-container-pulumi";

const awsConfig = new pulumi.Config("aws")
const region: aws.Region = awsConfig.require("region")

const tags: Tags = {
    "managed-by": "pulumi"
};

const { vpcId, subnets } = new Network("network", {
    cidrBlock: "10.0.0.0/20",
    subnets: [
        {
            type: SubnetType.Public,
            az: `${region}b`,
            cidrBlock: "10.0.0.0/24"
        },
        {
            type: SubnetType.Public,
            az: `${region}c`,
            cidrBlock: "10.0.1.0/24"
        }
    ],
    tags
});

const service = new Service("service", {
    name: "nginx",
    image: "nginx:latest",
    port: 80,
    hostedZone: "labs.vniche.me",
    cpu: "256",
    memory: "512",
    autoscaling: {
        min: 1,
        max: 5,
        cpuAvgThreshold: 50
    },
    subnets: subnets.filter(({ type }) => type === SubnetType.Public),
    vpcId: vpcId,
    region,
    tags
});

// Stack exports
export const url = service.url;