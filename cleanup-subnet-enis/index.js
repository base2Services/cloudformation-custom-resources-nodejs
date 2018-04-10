/**
 * A Lambda function that looks up a AMI ID for a given ami name.
 **/


const CfnLambda = require('cfn-lambda');
const CleanupLogic = require('./eniCleanupLogic');

//Clean up S3 bucket
var Delete = (requestPhysicalID, cfnRequestParams, reply) => {
    new CleanupLogic(cfnRequestParams.SubnetIds, function(err, data) {
        reply(err, requestPhysicalID);
    }).cleanupEnis();
};

// empty create
var Create = (cfnRequestParams, reply) => {
    reply(null, `SubnetEniCleanup${Math.ceil(Math.random() * 1000000)}`);
};

// empty update
var Update = (requestPhysicalID, cfnRequestParams, oldCfnRequestParams, reply) => {
    reply(null, requestPhysicalID);
};

exports.handler = CfnLambda({
    Create: Create,
    Update: Update,
    Delete: Delete,
    TriggersReplacement: [],
    SchemaPath: [__dirname, 'schema.json']
});