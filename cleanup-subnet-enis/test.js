const EniCleanup = require('./eniCleanupLogic');

new EniCleanup(
    [process.env.subnetId1],
    function(err, message) {
        if (err) {
            console.error(`ERROR:${err}`);
            process.exit(-1);
        }
        console.log("SUCCESS");
        process.exit(0);
    }
).cleanupEnis()