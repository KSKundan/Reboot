const express = require('express');
const cp = require('child_process');
const config = require('./config.js')
const app = express();
app.use(express.json())
const port = config.port;

app.post('/restart', (req, res) => {
    console.log("receive request");
    var requireData = {
        'User': '',
        'Password': '',
        'iP': ''
    }

    if (((req.body).hasOwnProperty('user')) && ((req.body).hasOwnProperty('password')) && ((req.body).hasOwnProperty('iP'))) {
        requireData.User = req.body.user;
        requireData.Password = req.body.password;
        requireData.iP = req.body.iP;
        var rboxError =null;
        var child = cp.spawn(config.forever, [config.restartall])
        child.stderr.on('error', error => {
            console.log('Error in execution ', error);
            rboxError = error;
        })
        if (rboxError == error) {
            console.log("Error in restart !!!");
            res.status(400).send("Error in restart !!!");
        } else {
            consle.log("Request accepted for process restart of r-box!!!");
            res.status(200).send("Request accepted for process restart of r-box!!!");
        }
    } else {
        console.log('Destination request for cancel job not matched !!!');
        res.status(404).send('Destination request for cancel job not matched !!!');
    }
})

app.listen(port, config.ip, () => {
    console.log("Listing on port number :" + port);

});
