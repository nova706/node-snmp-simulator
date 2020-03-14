class Provider {

    constructor(name, oid, valueRange) {
        this.name = name;
        this.mibType = Provider.MibType.SCALAR;
        this.oid = oid;
        this.objectType = Provider.ObjectType.OCTET_STRING;
        this.valueRange = valueRange;
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

module.exports = Provider;