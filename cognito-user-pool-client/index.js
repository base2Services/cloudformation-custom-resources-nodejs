/**
 * A Lambda function to manage Cognito User Pool Clients
 * Api Doc - https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html
 **/

let AWS = require('aws-sdk'),
    CfnLambda = require('cfn-lambda'),
    CognitoApi = new AWS.CognitoIdentityServiceProvider({
        apiVersion: '2016-04-18'
    });

function returnedData(data) {
    return {
        'ClientId': data.UserPoolClient.ClientId,
        'CreationDate': data.UserPoolClient.CreationDate,
        'LastModifiedDate': data.UserPoolClient.LastModifiedDate,
        'ClientSecret': data.UserPoolClient.ClientSecret
    }
}

let logic = {
    Create: CfnLambda.SDKAlias({
        api: CognitoApi,
        method: 'createUserPoolClient',
        forceBools: [
            'GenerateSecret',
            'AllowedOAuthFlowsUserPoolClient'
        ],
        keys: [
            'ClientName',
            'ExplicitAuthFlows',
            'GenerateSecret',
            'UserPoolId',
            'AllowedOAuthFlows',
            'AllowedOAuthFlowsUserPoolClient',
            'AllowedOAuthScopes',
            'CallbackURLs',
            'DefaultRedirectURI',
            'LogoutURLs',
            'ReadAttributes',
            'RefreshTokenValidity',
            'SupportedIdentityProviders',
            'WriteAttributes'
        ],
        returnAttrs: returnedData,
        returnPhysicalId: 'UserPoolClient.ClientId'
    }),

    DoUpdate: CfnLambda.SDKAlias({
        api: CognitoApi,
        method: 'updateUserPoolClient',
        returnAttrs: returnedData,
        physicalIdAs: 'ClientId',
        keys: [
            'UserPoolId',
            'AllowedOAuthFlows',
            'AllowedOAuthFlowsUserPoolClient',
            'AllowedOAuthScopes',
            'CallbackURLs',
            'ClientName',
            'DefaultRedirectURI',
            'ExplicitAuthFlows',
            'LogoutURLs',
            'ReadAttributes',
            'RefreshTokenValidity',
            'SupportedIdentityProviders',
            'WriteAttributes',
            'ClientId'
        ],
        forceBools: [
            'AllowedOAuthFlowsUserPoolClient'
        ],
    }),

    Delete: CfnLambda.SDKAlias({
        api: CognitoApi,
        method: 'deleteUserPoolClient',
        keys: ['UserPoolId', 'ClientId'],
        physicalIdAs: 'ClientId'
    })
};

logic.NoUpdate = CfnLambda.SDKAlias({
    api: CognitoApi,
    method: 'describeUserPoolClient',
    returnAttrs: returnedData,
    physicalIdAs: 'ClientId',
    keys: [
        'UserPoolId',
        'ClientId'
    ]
}),

    logic.Update = function (physicalId, params, oldParams, callback) {
        if (params.SkipUpdate == 'true') {
            return logic.NoUpdate(physicalId, params, callback);
        } else {
            return logic.DoUpdate(physicalId, params, oldParams, callback);
        }
    };

exports.handler = CfnLambda({
    Create: logic.Create,
    Update: logic.Update,
    Delete: logic.Delete,
    NoUpdate: logic.NoUpdate,
    TriggersReplacement: ['UserPoolId'],
    SchemaPath: [__dirname, 'schema.json']
});
