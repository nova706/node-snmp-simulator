const path = require('path');
const DataStore = require('nedb');
const queryService = require('./../svc/queryService');

const dbFile = path.join(__dirname, '..', '..', 'db', 'agents.json');

class TemplateDao {

    constructor() {
        console.log(dbFile);
        this.db = new DataStore({filename: dbFile, autoload: true});
    }

    /**
     * Query for Agents
     *
     * @param query
     * @return {Promise<{results: Agent[], totalCount: Number}>}
     */
    query(query) {
        return new Promise((resolve, reject) => {

            const db = this.db;

            queryService.executeCount(db, query, (err, count) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (count === 0) {
                    resolve({
                        results: [],
                        totalCount: count
                    });
                    return;
                }

                queryService.executeFind(db, query).exec((err, docs) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({
                        results: docs,
                        totalCount: count
                    });
                });
            });
        });
    }

    /**
     * Gets an Agent by ID
     *
     * @param {String} id
     * @return {Promise<Agent>}
     */
    get(id) {
        return new Promise((resolve, reject) => {
            this.db.findOne({_id: id}, (err, doc) => {
                if (err) {
                    reject(err);
                }
                resolve(doc);
            });
        });
    }

    /**
     * Creates an Agent
     *
     * @param {Agent} agent
     * @return {Promise<Agent>}
     */
    create(agent) {

        // Do not persist state
        delete agent.state;

        return new Promise((resolve, reject) => {
            this.db.insert(agent, (err, newDoc) => {
                if (err) {
                    reject(err);
                }
                resolve(newDoc);
            });
        });
    }

    /**
     * Updates an Agent
     *
     * @param {Agent} agent
     * @return {Promise<Agent>}
     */
    update(agent) {

        // Do not persist state
        delete agent.state;

        return new Promise((resolve, reject) => {
            this.db.update({_id: agent._id}, agent, {}, (err) => {
                if (err) {
                    reject(err);
                }
                this.db.findOne({_id: agent._id}, (err, doc) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(doc);
                });
            });
        });
    }

    /**
     * Deletes an Agent by ID
     *
     * @param {String} id
     * @return {Promise<>}
     */
    delete(id) {
        return new Promise((resolve, reject) => {
            this.db.remove({_id: id}, {}, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

}

module.exports = new TemplateDao();