import cdk = require('@aws-cdk/cdk');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codebuild = require('@aws-cdk/aws-codebuild');
import { LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';

export class CodepipelineCdkStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Source action
        const githubAccessToken = new cdk.SecretParameter(this, 'GitHubToken', {
            ssmParameter: 'JblGitHubToken',
        });
        const sourceAction = new codepipeline.GitHubSourceAction({
            actionName: 'GitHub',
            owner: 'bloveless',
            repo: 'codepipeline-cdk-example',
            branch: 'master',
            oauthToken: githubAccessToken.value,
            outputArtifactName: 'SourceOutput',
        });

        // Manual approval action
        const manualApprovalAction = new codepipeline.ManualApprovalAction({
            actionName: 'Approve',
            notifyEmails: [
                'bloveless@youniqueproducts.com',
            ],
        });

        // Build action
        const buildRole = new Role(this, 'BuildRole', {
            assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
        });

        // Give access to serverless s3 deployment bucket.
        buildRole.addToPolicy(new PolicyStatement()
            .addResource('arn:aws:s3:::codepipeline-cdk-app*')
            .addResource('arn:aws:s3:::codepipeline-cdk-app*/*')
            .addAction('s3:*'));

        // Give access to cloudformation for own stack.
        buildRole.addToPolicy(new PolicyStatement()
            .addResource(`arn:aws:cloudformation:${this.region}:${this.accountId}:stack/codepipeline-cdk-app-dev/*`)
            .addAction('cloudformation:DescribeStacks')
            .addAction('cloudformation:CreateStack')
            .addAction('cloudformation:UpdateStack')
            .addAction('cloudformation:DeleteStack'));

        // Give view access to all stacks.
        buildRole.addToPolicy(new PolicyStatement()
            .addAllResources()
            .addAction('cloudformation:Describe*')
            .addAction('cloudformation:List*')
            .addAction('cloudformation:Get*')
            .addAction('cloudformation:PreviewStackUpdate')
            .addAction('cloudformation:ValidateTemplate'));

        // Give permission to do whatever, because I ran out of time.
        buildRole.addToPolicy(new PolicyStatement()
            .addAllResources()
            .addAction('apigateway:*')
            .addAction('cloudformation:*')
            .addAction('logs:*')
            .addAction('ec2:*')
            .addAction('iam:*')
            .addAction('lambda:*')
            .addAction('s3:*'));

        const project = new codebuild.PipelineProject(this, 'MyProject', {
            buildSpec: './app/buildspec.yml',
            environment: {
                buildImage: LinuxBuildImage.UBUNTU_14_04_NODEJS_10_1_0,
            },
            environmentVariables: {
                AWS_ENV: {
                    value: 'dev',
                },
                AWS_REGION: {
                    value: this.region,
                }
            },
            role: buildRole,
        });

        const buildAction = new codebuild.PipelineBuildAction({
            actionName: 'Build',
            project,
            inputArtifact: sourceAction.outputArtifact,
        });

        new codepipeline.Pipeline(this, 'MyFirstPipeline', {
            stages: [
                {
                    name: 'Source',
                    actions: [sourceAction],
                },
                {
                    name: 'Approve',
                    actions: [manualApprovalAction],
                },
                {
                    name: 'Build',
                    actions: [buildAction],
                }
            ]
        });
    }
}
