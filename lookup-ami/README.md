# Lookup AMI by Name

Provides the ability to lookup an ami id at stack create/update time using the name of the ami. If multiple ami's matching that name are found it will return the latest one.

To install the resource you need to return

```bash
$ npm install
$ grunt deploy --account_id=<my-aws-account-id>
```

You will need to have the appropriate AWS creditnals configured in ~/.aws/creditnals

Here is an example of how to use this resource in Cloudformation

```json

  "LookupAMISNSTopic" : {
    "Type" : "AWS::SNS::Topic",
    "Properties" : {
      "Subscription" : [
        { "Endpoint" : { "Fn::Join" : [ ":", [ "arn:aws:lambda", {"Ref" : "LookupAMIFunctionRegin"}, {"Ref": "AWS::AccountId"}, "function:lookup-ami" ] ]}, "Protocol" : "lambda" }
      ],
      "TopicName" : "lookup-ami-topic"
    }
  },

  "AMIInfo": {
    "Type": "Custom::AMIInfo",
    "Properties": {
      "ServiceToken": { "Fn::Join" : [ ":", [ "arn:aws:sns", {"Ref" : "AWS::Region"}, {"Ref": "AWS::AccountId"}, "lookup-ami-topic" ] ]},
      "Region": { "Ref": "AWS::Region" },
      "AMIName":  { "Ref" : "AMIName" }
    }
  },

  "SampleInstance": {  
    "Type": "AWS::EC2::Instance",
    "Properties": {
      "InstanceType"   : { "Ref" : "InstanceType" },
      "ImageId": { "Fn::GetAtt": [ "AMIInfo", "Id" ] }
    }
  }

```

To support deploying the lambda function in a different region to the custom resources, the resource is configured to use an local SNS topic. That topic the has a subscription to endpoint configured to point to the lookup-ami lambda function
