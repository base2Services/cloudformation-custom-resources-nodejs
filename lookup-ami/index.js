/**
* A Lambda function that looks up a AMI ID for a given ami name.
**/

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

    var ec2 = new aws.EC2({region: msg.ResourceProperties.Region});
    var describeImagesParams = {
        Filters: [{ Name: "name", Values: [msg.ResourceProperties.AMIName]}]
    };

    // Get AMI IDs with the specified name pattern and owner
    ec2.describeImages(describeImagesParams, function(err, describeImagesResult) {
        if (err) {
            responseData = {Error: "DescribeImages call failed"};
            console.log(responseData.Error + ":\n", err);
        }
        else {
            var images = describeImagesResult.Images;
            console.log("Images:\n" + JSON.stringify(images));
            // Sort images by name in decscending order. The names contain the AMI version, formatted as YYYY.MM.Ver.
            images.sort(function(x, y) { return y.Name.localeCompare(x.Name); });
            for (var j = 0; j < images.length; j++) {
                responseStatus = "SUCCESS";
                responseData["Id"] = images[j].ImageId;
                break;
            }
        }
        sendResponse(msg, context, responseStatus, responseData);
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
