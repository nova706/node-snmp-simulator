const agentService = require('./../svc/agentService');

module.exports = function (router) {

    router.get('/api/agents', (req, res) => {
        agentService.query(req.query)
            .then((response) => {
                res.send(response);
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.get('/api/agents/:id', (req, res) => {
        agentService.get(req.params.id)
            .then((response) => {

                if (!response) {
                    return res.status(404);
                }

                res.send(response);
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.get('/api/agents/:id/start', (req, res) => {
        agentService.start(req.params.id)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.get('/api/agents/:id/stop', (req, res) => {
        agentService.stop(req.params.id)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.get('/api/agents/:id/restart', (req, res) => {
        agentService.restart(req.params.id)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.post('/api/agents', (req, res) => {
        agentService.create(req.body)
            .then((response) => {
                res.send(response);
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.put('/api/agents/:id', (req, res) => {
        agentService.update(req.params.id, req.body, req)
            .then((response) => {
                res.send(response);
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    router.delete('/api/agents/:id', (req, res) => {
        agentService.delete(req.params.id)
            .then(() => {
                res.status(200).send();
            })
            .catch((err) => {
                res.status(500).send(err.message || err);
            });
    });

    return router;
};