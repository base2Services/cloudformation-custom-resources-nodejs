
var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var ACM = new AWS.ACM({apiVersion: '2015-12-08'});

var Delete = CfnLambda.SDKAlias({
  api: ACM,
  method: 'listCertificates',
  ignoreErrorCodes: [404, 409]
});

var Create = CfnLambda.SDKAlias({
  api: ACM,
  method: 'requestCertificate',
  returnKeys: ['CertificateArn']
});

var Update = CfnLambda.SDKAlias({
  api: ACM,
  method: 'requestCertificate',
  returnKeys: ['CertificateArn']
});

function getPhysicalId(data, params) {
  return CfnLambda.Environment.AccountId + '/' + params.DomainName;
}

exports.handler = CfnLambda({
  Create: Create,
  Update: Update,
  Delete: Delete,
  NoUpdate: NoUpdate,
  TriggersReplacement: ['DomainName', 'SubjectAlternativeNames'],
  SchemaPath: [__dirname, 'schema.json']
});

function NoUpdate(phys, params, reply) {
  ACM.describeCertificate({
    CertificateArn: params.DomainName
  }, function(err, cert) {
    if (err) {
      console.error('Error when pinging for NoUpdate Attrs: %j', err);
      return reply(err.message);
    }
    console.log('NoUpdate pingcheck success! %j', cert);
    reply(null, cert.DomainStatus.DomainId, {
      CertificateArn: cert.DomainStatus.Endpoint
    });
  });
}
