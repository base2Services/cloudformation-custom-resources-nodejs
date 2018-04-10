/**
 * A Lambda function that looks up a AMI ID for a given ami name.
 **/


const CfnLambda = require('cfn-lambda');
const CleanupLogic = require('./bucketCleanupLogic.js');

//Clean up S3 bucket
var Delete = (requestPhysicalID, cfnRequestParams, reply) => {
    new CleanupLogic(cfnRequestParams.BucketName, function () {
        reply(null, requestPhysicalID);
    }, function (err) {
        reply(err, requestPhysicalID);
    }).cleanupBucket();
};

// empty create
var Create = (cfnRequestParams, reply) => {
    reply(null, `BucketCleanup${Math.ceil(Math.random() * 1000000)}`);
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
