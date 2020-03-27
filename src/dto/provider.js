class Provider {

    constructor(name, oid, valueRange) {
        this.name = name;
        this.mibType = Provider.MibType.SCALAR;
        this.oid = oid;
        this.objectType = Provider.ObjectType.OCTET_STRING;
        this.updateType = Provider.UpdateType.RANDOM; // How the value should be updated
        this.updateTime = 60000; // 1 minute - amount of time to use when updating the value: RANDOM/RANGE - minimum time between change, RAMP - time for a full interval
        this.valueRange = valueRange; // RANDOM - the set of values to pick from, RANGE/RAMP - the min and max values
    }

}

Provider.MibType = {
    'SCALAR': 'SCALAR',
    'TABLE': 'TABLE'
};

Provider.ObjectType = {
    'BOOLEAN': 'BOOLEAN',
    'INTEGER': 'INTEGER',
    'OCTET_STRING': 'OCTET_STRING',
    'NULL': 'NULL',
    'OID': 'OID',
    'IP_ADDRESS': 'IP_ADDRESS',
    'COUNTER': 'COUNTER',
    'GAUGE': 'GAUGE',
    'TIME_TICKS': 'TIME_TICKS',
    'OPAQUE': 'OPAQUE',
    'COUNTER_64': 'COUNTER_64',
    'NO_SUCH_OBJECT': 'NO_SUCH_OBJECT',
    'NO_SUCH_INSTANCE': 'NO_SUCH_INSTANCE',
    'END_OF_MIB_VIEW': 'END_OF_MIB_VIEW'
};

Provider.UpdateType = {
    'RANDOM': 'RANDOM',
    'RANGE': 'RANGE',
    'RAMP': 'RAMP'
};

module.exports = Provider;