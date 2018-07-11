/**
 * A Lambda function to manage Cognito User Pool Clients
 * Api Doc - https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html
 **/

let AWS = require('aws-sdk'),
    CfnLambda = require('cfn-lambda'),
    CognitoApi = new AWS.CognitoIdentityServiceProvider({
        apiVersion: '2016-04-18'
    }), randomSuffix = () => {
        return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    };

// empty create
var Create = (cfnRequestParams, reply) => {

    var doCreate = (cb) => {
        CognitoApi.createUserPoolDomain({
            Domain: cfnRequestParams.Domain,
            UserPoolId: cfnRequestParams.UserPoolId
        }, cb);
    }, retry = 0;

    var handler = (err, data) => {
        if (err) {
            if (cfnRequestParams.GenerateRandomIfNotAvailable
                && cfnRequestParams.GenerateRandomIfNotAvailable == 'true') {
                console.log(cfnRequestParams.Domain + ' is not available');
                cfnRequestParams.Domain = `${cfnRequestParams.Domain}${randomSuffix()}`;
                console.log(`Retrying with domain name ${cfnRequestParams.Domain}`);
                retry = retry + 1;
                if (retry == 5) {
                    console.log('Failed after 5 attempts to generate random domain name, probably not a name issue');
                    reply(err);
                } else {
                    doCreate(handler);
                }
            } else {
                reply(err)
            }
        } else {
            var domain = `https://${cfnRequestParams.Domain}.auth.${process.env.AWS_REGION}.amazoncognito.com`;
            reply(err, domain, {DomainFull: domain, Domain: cfnRequestParams.Domain});
        }
    };
    doCreate(handler);
};

var Update = (requestPhysicalID, cfnRequestParams, oldCfnRequestParams, reply) => {
    domain = requestPhysicalID.split('/')[2].split('.')[0];
    reply(null, requestPhysicalID, {DomainFull: requestPhysicalID, Domain: domain});
};


var Delete = (requestPhysicalID, cfnRequestParams, reply) => {
    CognitoApi.deleteUserPoolDomain({
        Domain: requestPhysicalID.split('/')[2].split('.')[0],
        UserPoolId: cfnRequestParams.UserPoolId
    }, function (err, data) {
        reply(err, requestPhysicalID, null);
    });
};

// empty update

exports.handler = CfnLambda({
    Create: Create,
    Update: Update,
    Delete: Delete,
    TriggersReplacement: [],
    SchemaPath: [__dirname, 'schema.json']
});
