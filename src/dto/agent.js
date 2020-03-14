class Agent {

    constructor(name, port, community, user) {
        this.name = name;
        this.port = port;
        this.community = community;
        this.user = user;
        this.providers = [];
    }

    addProvider(provider) {
        this.providers.push(provider);
    }

}

Agent.SecurityLevel = {
    'NO_AUTH_NO_PRIVACY': 'NO_AUTH_NO_PRIVACY',
    'AUTH_NO_PRIVACY': 'AUTH_NO_PRIVACY',
    'AUTH_PRIVACY': 'AUTH_PRIVACY'
};

module.exports = Agent;