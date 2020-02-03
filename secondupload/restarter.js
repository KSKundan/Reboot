const express = require('express');
const cp = require('child_process');
const bodyParser = require('body-parser');
var mysql = require('mysql');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3200;
var proces = {
    content: 'sudo'
}
app.use(express.json());
app.post('/restart', (req, res) => {
    console.log("receive request");
    var User = req.body.user;
    var Password = req.body.password;
    var iP = req.body.iP
    var jobId = req.body.jobId
    var child = cp.spawn('forever', ['restartall'])
    child.stdout.on('data', data =>{
        console.log('Commanad executed', data.toString());
    })
    child.stderr.on('error', error=>{
        console.log('Error in execution ', error);
    })
    res.status(200).send("Accepted !!!");

    req.on('error', error => {
        console.log(error);
    });
})


app.listen(port, '172.16.50.175', () => {
    console.log("Listing on port number :" + port);

});
