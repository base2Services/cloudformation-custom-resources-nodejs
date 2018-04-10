"use strict";

const AWS = require('aws-sdk');

const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15'
});


class EniCleanupLogic {

    //store handler and bucket name locally
    constructor(subnetIds, handler) {
        this.subnetIds = subnetIds;
        this.successHandler = (data) => {
            handler(null, data)
        };
        this.errorHandler = (err) => {
            handler(err, null);
        }
        this.enis = {};
    }

    //delete eni handler
    deleteEniHandler(eniid) {
        let self = this;
        return (err, data) => {
            if (err) {
                console.error(err);
                self.errorHandler(err);
                return;
            }

            delete self.enis[eniid];
            console.log(`Deleted ${eniid}`);
            if (Object.keys(self.enis) == 0) {
                self.successHandler();
            }
        }
    }


    //delete eni
    deleteEni(eniInfo) {
        var self = this;
        console.log("ENI Info:");
        console.log(JSON.stringify(eniInfo));
        if (eniInfo.Status == 'in-use') {
            //check if status is in use, by detachment is in progress
            if (eniInfo.Attachment.Status == 'detaching') {
                console.log(`Eni ${eniInfo.NetworkInterfaceId} in use, but attachment` +
                    `${eniInfo.Attachment.AttachmentId} is being detached, waiting for 5 seconds...`);
                setTimeout(() => {
                    self.cleanupEnis(eniInfo.NetworkInterfaceId);
                }, 5000);
                return;
            }
            //ENI still attached, started detachment process
            ec2.detachNetworkInterface({
                AttachmentId: eniInfo.Attachment.AttachmentId
            }, (err, data) => {
                if (err) {
                    console.error(err);
                    self.errorHandler(err);
                    return;
                }
                //call recursivly, allowing 5 seconds to timeout
                console.log(`Detached ENI ${eniInfo.NetworkInterfaceId}, allowing 5s to detach..`);
                setTimeout(() => {
                    self.cleanupEnis(eniInfo.NetworkInterfaceId);
                }, 5000);
                return;
            });
            return;
        }
        //good be that whole ENI is in detaching state
        if (eniInfo.Status != 'available') {
            console.log(`ENI is neither in use, nor available, in state: ${eniInfo.status}, sleeping for 5 seconds..`);
            setTimeout(() => {
                self.cleanupEnis(eniInfo.NetworkInterfaceId);
            }, 5000);
            return;
        }
        //delete eni if it has been detached
        ec2.deleteNetworkInterface({NetworkInterfaceId: eniInfo.NetworkInterfaceId},
            self.deleteEniHandler(eniInfo.NetworkInterfaceId)
        );
    }

    //list enis handler
    listENIsHandler() {
        var self = this;
        return (err, data) => {
            if (err) {
                console.error(err);
                self.errorHandler(err);
                return;
            }

            //no ENIs to delete
            if (data.NetworkInterfaces.length == 0) {
                self.successHandler();
                return;
            }

            //delete each ENI
            data.NetworkInterfaces.forEach((iface) => {
                self.enis[iface.NetworkInterfaceId] = true;
                self.deleteEni.call(self, iface);
            });
        }
    }

    //list enis
    listEnis(interfaceId) {
        let self = this;
        console.log(`Retrieving ENIs in subnets ${self.subnetIds}`);
        let params = {
            Filters: [{
                Name: 'subnet-id',
                Values: self.subnetIds
            }]
        };
        if (interfaceId) {
            params.Filters.push({Name: 'network-interface-id', Values: [interfaceId]});
        }
        ec2.describeNetworkInterfaces(params, self.listENIsHandler());
    }

    cleanupEnis() {
        this.listEnis();
    }
}


module.exports = EniCleanupLogic;
