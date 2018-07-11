## Cognito UserPoolDomain

Creates UserPoolDomain for cognito user pool. This is currently not
covered by CloudFormation.

runtime: `nodejs6.10`
handler: `cognito-user-pool-domain/index.handler`

Required parameters:

Please look at `cognito-user-pool-domain/schema.json`

Optional parameter `GenerateRandomIfNotAvailable` will try to append random 
string to requested domain name, if given name is not available. This process
is repeated 5 times until handler reports an error.