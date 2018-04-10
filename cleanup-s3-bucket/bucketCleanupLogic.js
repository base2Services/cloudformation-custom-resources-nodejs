"use strict";

const AWS = require('aws-sdk');



const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});


class BucketCleanupLogic {

    //store handler and bucket name locally
    constructor(bucketName, successHandler, errorHandler) {
        this.bucketName = bucketName;
        this.successHandler = successHandler;
        this.errorHandler = errorHandler;
        this.allKeys = [];
    }

    //s3 api delete handler
    deleteHandler(nextToken) {
        let self = this;
        return (err, data) => {
            if (err) {
                console.error(err);
                self.errorHandler(err);
                return;
            }
            if (data.Errors && data.Errors.length > 0) {
                console.log(`Failed to delete with ${data.Errors.length} errors`);
                let msg = `${data.Errors[0].Key} failed to delete: ${data.Errors[0].Message}\n`;
                msg +=`There is ${data.Errors.length} errors in total`;
                self.errorHandler(msg);
                return;
            }
            console.log("Deleting objects response");
            console.log(JSON.stringify(data, null, 2));
            console.log(`${data.Deleted.length} items deleted with success`)

            if (nextToken) {
                console.log(`Still waiting on batch from token ${nextToken} to delete...`);
            } else {
                console.log('All delete batches completed, reporting success...');
                self.successHandler.call();
            }
        }
    }

    //s3 api list handler
    listObjectHandler() {
        let self = this;
        return (err, data)=> {
            if (err) {
                if (err.toString().indexOf("bucket does not exist")) {
                    console.log("Bucket to cleanup does not exist");
                    self.successHandler();
                    return;
                }
                console.error(err);
                self.errorHandler(err);
                return;
            }
            // console.log(JSON.stringify(data, null, 2));
            data.Contents.forEach((el) => {
                self.allKeys.push(el.Key);
            });
            console.log(`Total of ${self.allKeys.length} collected`);
            if (data.NextContinuationToken !== undefined) {
                //call recursivly with continuation token, by default AWS returns
                //key sets in batches of 1000
                self.listAndDeleteObjects.call(self, data.NextContinuationToken);
            }
            let deleteParams = {
                Bucket: self.bucketName,
                Delete: {
                    Objects: data.Contents.map((o) => {
                        return {Key: o.Key}
                    })
                }
            };

            //if there are any items to delete, call delete function
            if (deleteParams.Delete.Objects.length > 0) {
                s3.deleteObjects(deleteParams, self.deleteHandler(data.NextContinuationToken));
            } else {
                //if any items collected, wait delete handler to report success
                if (self.allKeys.length > 0) {
                    //callback will be executed from delete handler
                    console.log("No more items to delete");
                } else {
                    //no items to delete at all
                    console.log("No items in bucket");
                    self.successHandler.call();
                }
            }
        }
    }

    listAndDeleteObjects(continuationToken) {
        let params = {
            Bucket: this.bucketName
        };
        if (continuationToken !== undefined) {
            params.ContinuationToken = continuationToken;
        }
        s3.listObjectsV2(params, this.listObjectHandler());
    }

    cleanupBucket() {
        this.listAndDeleteObjects();
    }
}


module.exports = BucketCleanupLogic;
