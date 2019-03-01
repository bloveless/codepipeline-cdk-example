#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { CodepipelineCdkStack } from '../lib/codepipeline-cdk-stack';

const app = new cdk.App();
new CodepipelineCdkStack(app, 'CodepipelineCdkStack');
app.run();
