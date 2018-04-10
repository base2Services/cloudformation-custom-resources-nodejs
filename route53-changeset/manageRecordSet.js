const AWS = require('aws-sdk');

class ManageRecordSet {

    constructor(role, recordset, handler) {
        this.role = role;
        this.recordset = recordset;
        this.handler = handler;
    }

    changeSetHandler() {
        var self = this;
        return (err, data) => {
            if (err) {
                console.error(err);
                self.handler(err);
                return;
            }
            console.log(`Change ${data.ChangeInfo.Id}`);
            console.log(`Status ${data.ChangeInfo.Status}`);
            self.handler(null, null);
        }
    }

    doRecordSetChange(route53, action) {
        let self = this;
        route53.changeResourceRecordSets({
            HostedZoneId: self.recordset.zoneId,
            ChangeBatch: {
                Comment: 'This change was made by lambda backed Custom Resource',
                Changes: [{
                    Action: action,
                    ResourceRecordSet: {
                        Name: self.recordset.name,
                        TTL: self.recordset.ttl,
                        Type: self.recordset.type,
                        ResourceRecords: [{
                            Value: self.recordset.value
                        }]
                    }
                }]
            }
        }, self.changeSetHandler());
    }

    create() {
        let self = this;
        self.assumeRole(function(err, data) {
            if (err) {
                console.error(err);
                self.handler(err);
                return;
            }
            let route53 = data != null ? new AWS.Route53({
                apiVersion: '2013-04-01',
                accessKeyId: data.Credentials.AccessKeyId,
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            }) : new AWS.Route53({ apiVersion: '2013-04-01' });

            self.doRecordSetChange.call(self, route53, 'UPSERT');
        });
    }

    delete() {
        let self = this;
        self.assumeRole(function(err, data) {
            if (err) {
                console.error(err);
                self.handler(err);
                return;
            }
            let route53 = data != null ? new AWS.Route53({
                apiVersion: '2013-04-01',
                accessKeyId: data.Credentials.AccessKeyId,
                secretAccessKey: data.Credentials.SecretAccessKey,
                sessionToken: data.Credentials.SessionToken
            }) : new AWS.Route53({ apiVersion: '2013-04-01' });

            self.doRecordSetChange.call(self, route53, 'DELETE');
        });
    }

    assumeRole(callback) {
        let self = this;
        if (self.role) {
            let sts = new AWS.STS({ apiVersion: '2011-06-15' });
            sts.assumeRole({
                    RoleArn: self.role,
                    RoleSessionName: `lambdafn-${process.env.awsRequestId}`
                },
                callback);
        } else callback.call(self, null, null);
    }

}

module.exports = ManageRecordSet;