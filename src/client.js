const snmp = require('net-snmp');

// Default options for v3
const options = {
    port: 161,
    retries: 1,
    timeout: 5000,
    transport: "udp4",
    trapPort: 162,
    version: snmp.Version2c,
    idBitsSize: 32,
    context: ""
};

// Example user
/*const user = {
    name: "blinkybill",
    level: snmp.SecurityLevel.authPriv,
    authProtocol: snmp.AuthProtocols.sha,
    authKey: "madeahash",
    privProtocol: snmp.PrivProtocols.des,
    privKey: "privycouncil"
};*/

const session = snmp.createSession("127.0.0.1", 'public', options);

let oid = "1.3.6.1.2.1.1.1";

function doneCb(error) {
    if (error) {
        console.error(error);
        return;
    }

    console.log("Done");
}

function feedCb(varbinds) {
    let i;
    for (i = 0; i < varbinds.length; i++) {
        if (snmp.isVarbindError(varbinds[i])) {
            throw snmp.varbindError(varbinds[i]);
        } else {
            console.log(varbinds[i].oid + "|" + varbinds[i].value);
        }
    }
}

const maxRepetitions = 1;

// The maxRepetitions argument is optional, and will be ignored unless using
// SNMP verison 2c
session.walk(oid, maxRepetitions, feedCb, doneCb);
