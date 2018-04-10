# Lookup NS records by domain name

Provides the ability to lookup the NS records of a hosted zone at stack create/update time using the domain name.

To install the resource you need to return

```bash
$ npm install
$ grunt deploy --account_id=<my-aws-account-id>
```

You will need to have the appropriate AWS credentials configured in ~/.aws/creditnals

Here is an example of how to use this resource in CloudFormation

```json

  "LookupNsRecordsSNSTopic" : {
    "Type" : "AWS::SNS::Topic",
    "Properties" : {
      "Subscription" : [
        { "Endpoint" : { "Fn::Join" : [ ":", [ "arn:aws:lambda", { "Ref": "lambdaFunctionRegion" }, {"Ref": "AWS::AccountId"}, "function:lookup-ns-records" ] ]}, "Protocol" : "lambda" }
      ],
      "TopicName" : "lookup-ns-records"
    }
  },

  "LookupNsRecords": {
    "DependsOn" : "LookupNsRecordsSNSTopic",
    "Type": "Custom::LookupNsRecords",
    "Properties": {
      "ServiceToken": { "Fn::Join" : [ ":", [ "arn:aws:sns", {"Ref" : "AWS::Region"}, {"Ref": "AWS::AccountId"}, "lookup-ns-records" ] ]},
      "Region": { "Ref": "AWS::Region" },
      "domain": { "Fn::Join" : [ "", [ {"Ref" : "subDomain"}, ".", {"Ref" : "parentDomain"}]]}
    }
  },

  "CreateNS":{
    "Type":"AWS::Route53::RecordSet",
    "DependsOn":"LookupNsRecords",
    "Properties":{
      "HostedZoneName": { "Fn::Join" : [ "", [ {"Ref" : "parentDomain"}, "."]]},
      "Comment":"DNS name for my instance.",
      "Name": { "Fn::Join" : [ "", [ {"Ref" : "subDomain"}, ".", {"Ref" : "parentDomain"}]]},
      "Type":"NS",
      "TTL":"300",
      "ResourceRecords":[ { "Fn::GetAtt": [ "LookupNsRecords", "ns1" ] },{ "Fn::GetAtt": [ "LookupNsRecords", "ns2" ] },{ "Fn::GetAtt": [ "LookupNsRecords", "ns3" ] },{ "Fn::GetAtt": [ "LookupNsRecords", "ns4" ] } ]
    }
  }

```

To support deploying the lambda function in a different region to the custom resources, the resource is configured to use an local SNS topic. That topic the has a subscription to endpoint configured to point to the lookup-ns-records lambda function
