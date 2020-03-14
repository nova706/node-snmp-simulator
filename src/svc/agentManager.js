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
                level: AgentManager.convertSecurityLevel(this.agent.user.level)
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

            console.log(mib);

            this.agent.state = 'STARTED';

            resolve();
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
        const idx = Math.floor(Math.random() * ((provider.valueRange.length - 1) + 1));
        const value = provider.valueRange[idx];
        mib.setScalarValue(provider.name, value);
    }

    /**
     * Converts a security level into an SNMP SecurityLevel
     *
     * @param {Agent.SecurityLevel} securityLevel
     * @return {SecurityLevel|null}
     */
    static convertSecurityLevel(securityLevel) {
        switch (securityLevel) {
            case Agent.SecurityLevel.NO_AUTH_NO_PRIVACY:
                return snmp.SecurityLevel.noAuthNoPriv;
            case Agent.SecurityLevel.AUTH_NO_PRIVACY:
                return snmp.SecurityLevel.authNoPriv;
            case Agent.SecurityLevel.AUTH_PRIVACY:
                return snmp.SecurityLevel.authPriv;
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