class Agent {

    constructor(name, port, community, user) {
        this.name = name;
        this.port = port;
        this.community = community;
        this.user = user;

        if (this.user && !this.user.authProtocol) {
            this.user.authProtocol = Agent.AuthProtocol.NONE;
        }
        if (this.user && !this.user.privProtocol) {
            this.user.privProtocol = Agent.PrivProtocol.NONE;
        }

        this.providers = [];
    }

    addProvider(provider) {
        this.providers.push(provider);
    }

}

Agent.AuthProtocol = {
    'NONE': 'NONE',
    'MD5': 'MD5',
    'SHA': 'SHA'
};

Agent.PrivProtocol = {
    'NONE': 'NONE',
    'DES': 'DES',
    'AES': 'AES'
};

module.exports = Agent;