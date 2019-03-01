import cdk = require('@aws-cdk/cdk');
import codepipeline = require('@aws-cdk/aws-codepipeline');

export class CodepipelineCdkStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pipeline = new codepipeline.Pipeline(this, 'MyFirstPipeline');

        // Source stage
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
        pipeline.addStage({
            name: 'Source',
            actions: [sourceAction],
        });

        // Manual approval stage (just so it will build)
        const manualApprovalAction = new codepipeline.ManualApprovalAction({
            actionName: 'Approve',
            notifyEmails: [
                'bloveless@youniqueproducts.com',
            ],
        });
        pipeline.addStage({
            name: 'Approve',
            actions: [manualApprovalAction],
        });
    }
}
