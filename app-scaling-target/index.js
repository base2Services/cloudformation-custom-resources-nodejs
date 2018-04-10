/**
* A Lambda function that looks up a AMI ID for a given ami name.
**/

var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var APPASG = new AWS.ApplicationAutoScaling({apiVersion: '2016-02-06'});

var Delete = CfnLambda.SDKAlias({
  api: APPASG,
  method: 'deregisterScalableTarget',
  keys: ['ResourceId', 'ScalableDimension', 'ServiceNamespace'],
  ignoreErrorCodes: [404, 409]
});

var Create = CfnLambda.SDKAlias({
  api: APPASG,
  method: 'registerScalableTarget'
});

var Update = CfnLambda.SDKAlias({
  api: APPASG,
  method: 'registerScalableTarget'
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
