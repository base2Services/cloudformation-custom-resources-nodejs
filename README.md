# CloudFormation custom resource catalogue

Collection of Cloud Formation custom resources written in node.js, result
of months of continuous efforts to automate infrastructure management trough
AWS CloudFormation. You may find some of these CloudFormation resources obsolete,
as AWS team fills in the gaps. There is also some more complex ones, or developed
to suite specific needs, such as reading JSON file from an S3 object, and making
JSON values available through `Fn::GetAtt` intrinsic function. All of custom resources 
within this repository are meant to be deployed as AWS Lambdas for `nodejs6.10` runtime

[Collection of custom resources for Python can be found here](https://github.com/base2Services/cloudformation-custom-resources-python)

## How to use

Simply clone the repository, install npm dependencies, and zip up the folder as lambda deployment package

```
git clone https://github.com/base2Services/cloudformation-custom-resources-nodejs.git && \
cd cloudformation-custom-resources-nodejs && \
npm install && \
zip -r ~/cfn-ccr-nodejs6.10.zip .
```

## Dependencies

All dependencies are defined within `package.json`. 

## Custom resources

### S3 Bucket cleanup

Removes all keys within a bucket. Role assumed by Lambda needs to have appropriate
permissions to remove bucket keys, commonly set through Bucket policies.  
Cleanup logic is implemented in 'DELETE' action. 'CREATE' and 'UPDATE'
actions are just dummy stubs.

handler: `cleanup-s3-bucket/index.handler`

Required parameters:
- `BucketName` - String. Name of the bucket that should have it's keys cleaned up




### ENI Cleanup

Detaches (if requiered) and deletes all ENIs within specified subnets.
Cleanup logic is implemented in 'DELETE' action. 'CREATE' and 'UPDATE'
actions are just dummy stubs.

handler: `cleanup-subnet-enis/index.hanlder`

Required parameters:
- `SubnetIds` - Array of Strings. Self explanitory - all subnets within this area
shall have their ENI's cleaned up on stack deletion


### Route 53 DNS Records creation

Creates, Updates and Cleans up Rotue53 DNS records in specified zone. All
operations are done using assumed role that is passed down as Custom Resource
parameters

handler: `route53-changeset/index.handler`

Required parameters:
- `role` - ARN of role that should be assumed by Custom Resource. It's assumed
that user would just directly create Route53 records using supported resource
types in same account where stack resides - so this is mandaroty parameter, as
custom resource is intended to be used for managing records in account diferent
from where stack is being created. This custom resource is making appropriate API calls
for all 3 operations - CREATE, UPDATE and DELETE.

- `recordset` - json object with following properties
- - `ttl` - TTL for recrod set
- - `zoneId` - Route53 zone id where record should be created (PRs welcome to move from zoneId to ZoneName)
- - `type` - DNS Record type, e.g. `A`, `CNAME` ...
- - `value` - Actual value of DNS record


### Reading values from JSON file on S3 bucket

Reads values from JSON file placed in S3 bucket, allowing this values to be referenced in other resources.
Example of creating s3 bucket with name specified within JSON file can be found in `src/read-s3-json-file/cf_template_example.json`

handler: `read-s3-json-file/index.handler`

Required parameters:
- `Bucket` - name of bucket where configuration file resides
- `Key` - key within bucket of configuration file

Optional parameters:
- `EnsureKeys` - comma separated list of keys that are always returned out of custom resource. This ensures your
   Cloud formation does not break if property that does not exist in JSON file is passed around the stack. Key values
   will default to empty string, or value of `EmptyKeyDefaultValue` parameter

- `EmptyKeyDefaultValue` value for keys not present in JSON file and requested by `EnsureKeys`

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

## Cognito UserPoolClient

Creates user pool client, as there is no cloudformation resource supporting
all of the properties. 

runtime: `nodejs6.10`
handler: `cognito-user-pool-client/index.handler`

Required parameters:

Please look at `cognito-user-pool-client/schema.json`
