/**
 * A Lambda function that looks up a AMI ID for a given ami name.
 **/

const CfnLambda = require('cfn-lambda');
const ManageRecordSet = require('./manageRecordSet');

// create records
var Create = (cfnRequestParams, reply) => {
    let route53ManageLogic = new ManageRecordSet(
        cfnRequestParams.role,
        cfnRequestParams.recordset,
        function(err, data) {
            reply(err, cfnRequestParams.recordset.name);
        }
    );
    route53ManageLogic.create()
};

//considering UPSERT command behaviour, create and update are nearly the same
var Update = (requestPhysicalID, cfnRequestParams, oldCfnRequestParams, reply) => {
    let route53ManageLogic = new ManageRecordSet(
        cfnRequestParams.role,
        cfnRequestParams.recordset,
        function(err, data) {
            reply(err, requestPhysicalID);
        }
    );
    route53ManageLogic.create();
};

//Remove route53 records
var Delete = (requestPhysicalID, cfnRequestParams, reply) => {
    let route53ManageLogic = new ManageRecordSet(
        cfnRequestParams.role,
        cfnRequestParams.recordset,
        function(err, data) {
            reply(err, requestPhysicalID);
        }
    );
    route53ManageLogic.delete();
};

exports.handler = CfnLambda({
    Create: Create,
    Update: Update,
    Delete: Delete,
    TriggersReplacement: []
        // SchemaPath: [__dirname, 'schema.json']
});