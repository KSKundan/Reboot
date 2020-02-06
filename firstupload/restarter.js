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
        var child = cp.spawn(config.forever, [config.restartall])
        child.stderr.on('error', error => {
            console.log('Error in execution ', error);
            var rboxError = error;
        })
        if (rboxError == error) {
            console.log("Error in restart !!!");
            res.status(400).send("Error in restart !!!");
        } else {
            consle.log("Request accepted for restart !!!");
            res.status(200).send("Request accepted for restart !!!");
        }
    } else {
        req.on('error', error => {
            console.log(error);
            res.status(404).send('Request not found !!!')
        });
    }
})


app.listen(port, config.ip, () => {
    console.log("R-Box is listing on port number :" + port);

});
