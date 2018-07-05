/**
 * A Lambda function to manage Cognito User Pool Clients
 * Api Doc - https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_CreateUserPoolClient.html
 **/

let AWS = require('aws-sdk'),
  CfnLambda = require('cfn-lambda'),
  CognitoApi = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18'
  });

let logic = {
  Create: CfnLambda.SDKAlias({
    api: CognitoApi,
    method: 'createUserPoolClient',
    forceBools: [
      'GenerateSecret',
      'AllowedOAuthFlowsUserPoolClient'
    ],
    returnAttrs: [
      'UserPoolClient.ClientId',
      'UserPoolClient.CreationDate',
      'UserPoolClient.LastModifiedDate'
    ],
    returnPhysicalId: 'UserPoolClient.ClientId'
  }),

  Update: CfnLambda.SDKAlias({
    api: CognitoApi,
    method: 'updateUserPoolClient',
    returnKeys: [
      'UserPoolClient.ClientId',
      'UserPoolClient.CreationDate',
      'UserPoolClient.LastModifiedDate'
    ],
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
    keys: ['UserPoolId','ClientId'],
    physicalIdAs: 'ClientId'
  })
}

exports.handler = CfnLambda({
  Create: logic.Create,
  Update: logic.Update,
  Delete: logic.Delete,
  TriggersReplacement: ['UserPoolId'],
  SchemaPath: [__dirname, 'schema.json']
});
