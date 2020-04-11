const agentDao = require('./../dao/agentDao');
const AgentManager = require('./agentManager');
const queryService = require('./queryService');

class AgentService {

    constructor() {
        this.agentManagers = {};
    }

    /**
     * Query for Agents
     *
     * @param params
     * @return {Promise<{results:Agent[], totalCount: Number}>}
     */
    query(params) {
        const query = queryService.parseQuery(params);
        return agentDao.query(query).then(response => {

            response.results.forEach(agent => {
                if (this.agentManagers.hasOwnProperty(agent._id)) {
                    agent.state = this.agentManagers[agent._id].agent.state;
                } else {
                    agent.state = 'STOPPED';
                }
            });

            return response;
        });
    }

    /**
     * Get an Agent by ID
     *
     * @param {String} id
     * @return {Promise<Agent>}
     */
    get(id) {
        return agentDao.get(id).then(agent => {
            if (this.agentManagers.hasOwnProperty(id)) {
                agent.state = this.agentManagers[id].agent.state;
            } else {
                agent.state = 'STOPPED';
            }

            return agent;
        });
    }

    /**
     * Create an Agent
     *
     * @param {Agent} agent
     * @return {Promise<Agent>}
     */
    create(agent) {
        return agentDao.create(agent).then(agent => {
            this.agentManagers[agent._id] = new AgentManager(agent);
            return agent;
        });
    }

    /**
     * Update an Agent by ID
     *
     * @param {String} id
     * @param {Agent} agent
     * @return {Promise<Agent>}
     */
    update(id, agent) {
        agent._id = id;

        let state = 'STOPPED';
        if (this.agentManagers.hasOwnProperty(id)) {
            state = this.agentManagers[id].agent.state;
        }

        return agentDao.update(agent).then(updated => {

            if (this.agentManagers.hasOwnProperty(id)) {
                this.agentManagers[id].stop();
            }

            this.agentManagers[agent._id] = new AgentManager(updated);

            if (state === 'STARTED') {
                this.agentManagers[updated._id].start();
            }

            return updated;
        });
    }

    /**
     * Delete an Agent by ID
     *
     * @param {String} id
     * @return {Promise<>}
     */
    delete(id) {
        return agentDao.delete(id).then(() => {
            if (this.agentManagers.hasOwnProperty(id)) {
                this.agentManagers[id].stop();
                delete this.agentManagers[id];
            }
        });
    }

    /**
     * Start an Agent by ID
     *
     * @param {String} id
     */
    start(id) {
        return new Promise((resolve, reject) => {

            if (this.agentManagers.hasOwnProperty(id)) {
                this.startAgentManager(this.agentManagers[id]).then(() => resolve()).catch((err) => reject(err));
            } else {
                agentDao.get(id).then(agent => {

                    if (agent) {
                        this.agentManagers[agent._id] = new AgentManager(agent);
                        this.startAgentManager(this.agentManagers[agent._id]).then(() => resolve()).catch((err) => reject(err));
                    } else {
                        reject('Could not find agent with ID: ' + id);
                    }

                });
            }
        });
    }

    /**
     * Stop an Agent by ID
     *
     * @param {String} id
     * @return {Promise}
     */
    stop(id) {
        return new Promise((resolve, reject) => {
            if (this.agentManagers.hasOwnProperty(id)) {
                this.agentManagers[id].stop().then(() => {
                    resolve();
                });
            } else {
                reject('Could not find agent with ID: ' + id);
            }
        });
    }

    /**
     * Restart an Agent by ID
     *
     * @param {String} id
     */
    restart(id) {
        return new Promise((resolve, reject) => {
            if (this.agentManagers.hasOwnProperty(id)) {
                this.agentManagers[id].restart().then(() => {
                    resolve();
                });
            } else {
                reject('Could not find agent with ID: ' + id);
            }
        });
    }

    /**
     * Walk an Agent by ID with a given oid
     *
     * @param {String} id
     * @param {String} oid
     */
    walk(id, oid) {
        return new Promise((resolve, reject) => {
            if (this.agentManagers.hasOwnProperty(id)) {
                this.agentManagers[id].walk(oid).then(results => {
                    resolve(results);
                }, (err) => {
                    reject(err);
                });
            } else {
                reject('Could not find agent with ID: ' + id);
            }
        });
    }

    startAgentManager(agentManager) {

        let agentId;
        for (agentId in this.agentManagers) {
            if (this.agentManagers.hasOwnProperty(agentId) &&
                agentId !== agentManager.agent._id &&
                this.agentManagers[agentId].agent.state === 'STARTED' &&
                parseInt(this.agentManagers[agentId].agent.port, 10) === parseInt(agentManager.agent.port, 10)) {

                return Promise.reject('Agent \'' + this.agentManagers[agentId].agent.name + '\' is already using port: ' + this.agentManagers[agentId].agent.port);
            }
        }

        return agentManager.start();
    }
}

module.exports = new AgentService();