var aws = require("aws-sdk");

exports.handler = function(event, context) {

  (event.Records || []).forEach(function (rec) {
    var msg = JSON.parse(rec.Sns.Message);

    console.log("REQUEST RECEIVED:\n" + JSON.stringify(msg));

    // For Delete requests, immediately send a SUCCESS response.
    if (msg.RequestType == "Delete") {
        sendResponse(msg, context, "SUCCESS");
        return;
    }

    var responseStatus = "FAILED";
    var responseData = {};

    var route53 = new aws.Route53();

    var params = {
      DNSName: msg.ResourceProperties.domain,
      MaxItems: '1'
    };

    route53.listHostedZonesByName(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else zoneID = data.HostedZones[0].Id; // successful response
        var params = {
          HostedZoneId: zoneID,
          StartRecordName: msg.ResourceProperties.domain + '.',
          StartRecordType: 'NS',
          MaxItems: '1'
        };
        route53.listResourceRecordSets(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else {
            console.log(data); // successful response
            responseStatus = "SUCCESS";
            var responseData = {
             ns1: data.ResourceRecordSets[0].ResourceRecords[0].Value,
             ns2: data.ResourceRecordSets[0].ResourceRecords[1].Value,
             ns3: data.ResourceRecordSets[0].ResourceRecords[2].Value,
             ns4: data.ResourceRecordSets[0].ResourceRecords[3].Value
            };
          }
          sendResponse(msg, context, responseStatus, responseData);
        });
    });
  });
};

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData) {

    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    console.log("RESPONSE BODY:\n", responseBody);

    var https = require("https");
    var url = require("url");

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    console.log("SENDING RESPONSE...\n");

    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    // write data to request body
    request.write(responseBody);
    request.end();

}
