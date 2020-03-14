const bodyParser = require('body-parser');
const express = require('express');

const app = express();

const port = 3002;

app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(require('./resource/agentResource')(express.Router()));

app.use('/', express.static('public'));

app.listen(port, () => console.log('App listening on port ' + port));


// TODO: Remove below. This gets or creates a test agent to walk

const agentService = require('./svc/agentService');
const Provider = require('./dto/provider');
const Agent = require('./dto/agent');

agentService.query({limit:1}).then(response => {
    if (response.results.length > 0) {
        agentService.start(response.results[0]._id);
    } else {

        const agent = new Agent('Test', 161, 'public', {
            name: "admin",
            level: Agent.SecurityLevel.NO_AUTH_NO_PRIVACY
        });

        const sysDescr = new Provider('sysDescr', '1.3.6.1.2.1.1.1', ['New Title', 'New Title1', 'New Title2']);
        agent.addProvider(sysDescr);

        agentService.create(agent).then(created => {
            agentService.start(created._id);
        });
    }
});
