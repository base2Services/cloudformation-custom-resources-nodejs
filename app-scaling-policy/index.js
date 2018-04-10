/**
* A Lambda function that looks up a AMI ID for a given ami name.
**/

var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var APPASG = new AWS.ApplicationAutoScaling({apiVersion: '2016-02-06'});

var Delete = CfnLambda.SDKAlias({
  api: APPASG,
  method: 'deleteScalingPolicy',
  keys: ['PolicyName', 'ResourceId', 'ScalableDimension', 'ServiceNamespace'],
  ignoreErrorCodes: [400, 404, 409]
});

var Create = CfnLambda.SDKAlias({
  api: APPASG,
  method: 'putScalingPolicy',
  returnKeys: ['PolicyARN']
});

var Update = CfnLambda.SDKAlias({
  api: APPASG,
  method: 'putScalingPolicy',
  returnKeys: ['PolicyARN']
});

exports.handler = CfnLambda({
  Create: Create,
  Update: Update,
  Delete: Delete,
  NoUpdate: NoUpdate,
  TriggersReplacement: [],
  SchemaPath: [__dirname, 'schema.json']
});

function NoUpdate(phys, params, reply) {
}
