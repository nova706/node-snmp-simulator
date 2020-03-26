const snmp = require('net-snmp');

const Agent = require('./../dto/agent');
const Provider = require('./../dto/provider');

/**
 * Handles creating, starting and stopping SNMP Agents
 */
class AgentManager {

    /**
     * Constructs a new AgentManager to handle creating, starting and stopping the SNMP agent
     *
     * @param {Agent} agent
     */
    constructor(agent) {
        this.agent = agent;
        this.snmpAgent = null;
        this.agent.state = 'STOPPED';
    }

    /**
     * Restarts the SNMP Agent
     */
    restart() {
        this.stop().then(() => {
            this.start();
        });
    }

    /**
     * Stops the SNMP Agent and updates the agent state
     */
    stop() {
        return new Promise((resolve) => {
            if (this.snmpAgent) {
                //this.snmpAgent.close(); // TODO: The documented close method does nothing
                this.snmpAgent.listener.dgram.close(() => {
                    resolve();
                });
                this.snmpAgent = null;
                this.agent.state = 'STOPPED';
            } else {
                resolve();
            }
        });
    }

    /**
     * Creates and starts the SNMP Agent and updates the agent state
     */
    start() {
        return new Promise((resolve, reject) => {

            const snmpAgent = snmp.createAgent({
                port: this.agent.port,
                disableAuthorization: true
            }, function (error) {
                if (error) {
                    console.error(error);
                }
            });

            const authorizer = snmpAgent.getAuthorizer();
            authorizer.addCommunity(this.agent.community);
            authorizer.addUser({
                name: this.agent.user.name,
                authProtocol: AgentManager.convertAuthProtocol(this.agent.user.authProtocol),
                authKey: this.agent.user.authKey,
                privProtocol: AgentManager.convertPrivacyProtocol(this.agent.user.privProtocol),
                privKey: this.agent.user.privKey,
                level: AgentManager.getSecurityLevel(this.agent.user)
            });

            const mib = snmpAgent.getMib();

            this.agent.providers.forEach(provider => {

                mib.registerProvider({
                    name: provider.name,
                    type: AgentManager.convertMibType(provider.mibType),
                    oid: provider.oid,
                    scalarType: AgentManager.convertObjectType(provider.objectType),
                    handler: function (mibRequest) {
                        AgentManager.handleMibRequest(mibRequest, mib, provider);
                    }
                });

                AgentManager.updateValue(mib, provider);
            });

            this.snmpAgent = snmpAgent;

            this.agent.state = 'STARTED';

            console.log('Agent Started: ' + this.agent.name, this.agent);

            resolve();
        });
    }

    walk(oid) {
        return new Promise((resolve, reject) => {

            const options = {
                port: this.agent.port,
                retries: 1,
                timeout: 5000,
                transport: "udp4",
                trapPort: 162,
                version: snmp.Version2c,
                idBitsSize: 32,
                context: ""
            };

            const community = this.agent.community;

            const session = snmp.createSession("127.0.0.1", community, options);

            let results = [];

            function doneCb(err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);
            }

            function feedCb(varbinds) {
                let i;

                for (i = 0; i < varbinds.length; i++) {
                    if (snmp.isVarbindError(varbinds[i])) {
                        break;
                    } else {
                        results.push(varbinds[i].oid + "|" + varbinds[i].value);
                    }
                }
            }

            const maxRepetitions = 1;

            session.walk(oid, maxRepetitions, feedCb, doneCb);
        });
    }

    /**
     * Handler for a MIB request from a client
     *
     * @param {MibRequest} mibRequest
     * @param {Mib} mib
     * @param {Provider} provider
     */
    static handleMibRequest(mibRequest, mib, provider) {
        mibRequest.done();
        AgentManager.updateValue(mib, provider);
    }

    /**
     * Updates the Mib value with a random value from a range
     *
     * @param {Mib} mib
     * @param {Provider} provider
     */
    static updateValue(mib, provider) {

        let value;

        let min;
        let max;
        let decimalPlaces;
        let rand;
        let power;

        if (provider.updateType !== Provider.UpdateType.RANDOM) {
            min = provider.valueRange[0];
            max = provider.valueRange[1];

            let minPrecision = (min.indexOf('.') >= 0) ? (min.length - min.indexOf('.') - 1) : 0;
            let maxPrecision = (max.indexOf('.') >= 0) ? (max.length - max.indexOf('.') - 1) : 0;
            decimalPlaces = Math.max(minPrecision, maxPrecision);

            min = parseFloat(min);
            max = parseFloat(max);
        }

        switch (provider.updateType) {
            case Provider.UpdateType.RANDOM:

                const idx = Math.floor(Math.random() * ((provider.valueRange.length - 1) + 1));
                value = provider.valueRange[idx];

                break;
            case Provider.UpdateType.RANGE:

                rand = (Math.random() * (max - min)) + min;
                power = Math.max(1, Math.pow(10, decimalPlaces));
                value = Math.round(rand * power) / power;

                break;
            case Provider.UpdateType.RAMP:

                const amplitude = Math.abs((max - min) / 2);
                const frequency = 15000 * 2 * Math.PI; // Full cycle every 15 seconds TODO: All this to be set by the user
                value = (amplitude * Math.sin(Date.now() / frequency)) + amplitude + min;
                power = Math.max(1, Math.pow(10, decimalPlaces));
                value = Math.round(value * power) / power;

                break;
        }

        switch (provider.objectType) {
            case Provider.ObjectType.INTEGER:
                value = parseInt(value, 10);
                break;
            case Provider.ObjectType.OCTET_STRING:
                value = '' + value;
                break;
        }

        mib.setScalarValue(provider.name, value);
    }

    /**
     * Gets an SNMP SecurityLevel from the agent user
     *
     * @param {Agent.user} user
     * @return {SecurityLevel|null}
     */
    static getSecurityLevel(user) {
        const authSet =  user.authProtocol && user.authProtocol !== Agent.AuthProtocol.NONE;
        const privSet =  user.privProtocol && user.privProtocol !== Agent.PrivProtocol.NONE;

        if (authSet && privSet) {
            return snmp.SecurityLevel.authPriv;
        }
        if (authSet) {
            return snmp.SecurityLevel.authNoPriv;
        }
        return snmp.SecurityLevel.noAuthNoPriv;
    }

    static convertAuthProtocol(authProtocol) {
        switch (authProtocol) {
            case Agent.AuthProtocol.NONE:
                return snmp.AuthProtocols.none;
            case Agent.AuthProtocol.MD5:
                return snmp.AuthProtocols.md5;
            case Agent.AuthProtocol.SHA:
                return snmp.AuthProtocols.sha;
        }

        return null;
    }

    static convertPrivacyProtocol(privProtocol) {
        switch (privProtocol) {
            case Agent.PrivProtocol.NONE:
                return snmp.PrivProtocols.none;
            case Agent.PrivProtocol.DES:
                return snmp.PrivProtocols.des;
            case Agent.PrivProtocol.AES:
                return snmp.PrivProtocols.aes;
        }

        return null;
    }

    /**
     * Converts a mibType into an SNMP mib type
     *
     * @param {Provider.MibType} mibType
     * @return {MibProviderType|null}
     */
    static convertMibType(mibType) {
        switch (mibType) {
            case Provider.MibType.SCALAR:
                return snmp.MibProviderType.Scalar;
            case Provider.MibType.TABLE:
                return snmp.MibProviderType.Table;
        }

        return null;
    }

    /**
     * Converts an objectType into an SNMP ObjectType
     *
     * @param {Provider.ObjectType} objectType
     * @return {ObjectType|null}
     */
    static convertObjectType(objectType) {
        switch (objectType) {
            case Provider.ObjectType.BOOLEAN:
                return snmp.ObjectType.Boolean;
            case Provider.ObjectType.INTEGER:
                return snmp.ObjectType.Integer;
            case Provider.ObjectType.OCTET_STRING:
                return snmp.ObjectType.OctetString;
            case Provider.ObjectType.NULL:
                return snmp.ObjectType.Null;
            case Provider.ObjectType.OID:
                return snmp.ObjectType.OID;
            case Provider.ObjectType.IP_ADDRESS:
                return snmp.ObjectType.IpAddress;
            case Provider.ObjectType.COUNTER:
                return snmp.ObjectType.Counter;
            case Provider.ObjectType.GAUGE:
                return snmp.ObjectType.Gauge;
            case Provider.ObjectType.TIME_TICKS:
                return snmp.ObjectType.TimeTicks;
            case Provider.ObjectType.OPAQUE:
                return snmp.ObjectType.Opaque;
            case Provider.ObjectType.COUNTER_64:
                return snmp.ObjectType.Counter64;
            case Provider.ObjectType.NO_SUCH_OBJECT:
                return snmp.ObjectType.NoSuchObject;
            case Provider.ObjectType.NO_SUCH_INSTANCE:
                return snmp.ObjectType.NoSuchInstance;
            case Provider.ObjectType.END_OF_MIB_VIEW:
                return snmp.ObjectType.EndOfMibView;
        }

        return null;
    }
}

module.exports = AgentManager;