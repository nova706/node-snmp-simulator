class QueryService {

    parseQuery(params) {

        let query = new Query();

        if (params) {
            if (params.find) {
                query.find = JSON.parse(params.find);

                const replaceRegex = function (obj) {
                    let prop;
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            if (prop === '$regex') {
                                obj[prop] = new RegExp(obj[prop], 'i');
                            } else if (typeof obj[prop] === 'object') {
                                replaceRegex(obj[prop]);
                            }
                        }
                    }
                };

                replaceRegex(query.find);
            }
            if (params.sort) {
                query.sort = JSON.parse(params.sort);
            }
            if (params.skip) {
                query.skip = parseInt(params.skip, 10);
            }
            if (params.limit) {
                query.limit = parseInt(params.limit, 10);
            }
        }

        return query;
    }

    executeFind(db, query) {
        return db.find(query ? query.find || {} : {})
            .sort(query.sort || {})
            .skip(query.skip || 0)
            .limit(query.limit || 0);
    }

    executeCount(db, query, callback) {
        return db.count(query ? query.find || {} : {}, callback);
    }

    executeDelete(db, query, callback) {
        return db.remove(query ? query.find || {} : {}, {multi: true}, callback);
    }
}

class Query {

    constructor() {
        this.find = {};
        this.sort = {};
        this.skip = 0;
        this.limit = 0;
    }

}

module.exports = new QueryService();