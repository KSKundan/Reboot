const express = require('express');
const scheduler = require('node-cron');
const cp = require('child_process');
const request = require('request');
const config = require('./config.js');
const app = express();
const port = config.portPbox;
app.use(express.json());
var jobPbox = null, jobRbox = null;
var dateValidateP = null,
    dateValidateR = null,
    schedulePboxIP = null,
    scheduleRboxIP = null;
var JobDetails = {
    Pbox_JobID: null,
    Rbox_JobID: null,
}
var requireData = {
    'User': '',
    'Password': '',
    'iP': '',
    'destination': ''
}

app.post('/executenow', (req, res) => {
    if (((req.body).hasOwnProperty('user')) && ((req.body).hasOwnProperty('password')) && ((req.body).hasOwnProperty('ip')) && ((req.body).hasOwnProperty('type'))) {

        requireData.destination = (req.body.type).toUpperCase();
        requireData.User = req.body.user;
        requireData.Password = req.body.password;
        requireData.iP = req.body.ip;

        if (requireData.destination == 'RBOX') {
            request.post('http://' + requireData.iP + ':' + config.port + '/restart', {
                json: {
                    "user": requireData.User,
                    "password": requireData.Password,
                    "iP": requireData.iP
                }
            }, (error, response, body) => {

                if (error) {
                    console.log("Request not executed successfully !!! ", error);
                    response.status(400).send('request not executed successfully !!!')
                } else {
                    if (response.statusCode == 200) {
                        res.status(200).send("Process of r-box on I.P." + requireData.iP + " is restarted successfully  !!!");
                    }
                    else if (response.statusCode == 400) {
                        console.log("R-Box on I.P." + requireData.iP + " received bad request for restart process !!!");
                        res.status(400).send("R-Box on I.P." + requireData.iP + " received bad request for restart precess !!!");
                    } else if (response.statusCode == 404) {
                        console.log("Request for process restart of r-box on " + requireData.iP + " not found   !!!");
                        res.status(404).send("Request for process restart of r-box on " + requireData.iP + " not found  !!!");
                    } else {
                        console.log("Something went wrong for process restart of r-box on " + requireData.iP + " !!!");
                        res.status(500).send("Something went wrong for process restart of r-box on " + requireData.iP + " !!!" + body);
                    }
                }
            })
        } else {
            console.log("Destination r-box request not matched !!!");
            res.status(404).send('Destination r-box request not matched !!!')
        }

    } else if (((req.body).hasOwnProperty('ip')) && ((req.body).hasOwnProperty('type'))) {
        requireData.destination = (req.body.type).toUpperCase();
        var pboxError = null;
        if (requireData.destination == 'PBOX') {

            var child = cp.spawn(config.pm2, [config.restart, config.ecosystem, config.env, config.production], { cwd: config.path });
            child.stderr.on('error', error => {
                console.log('error', error);
                pboxError = 'error';
            });
            child.on('close', code => {
                if (pboxError == 'error') {
                    console.log("P-Box process not restarted !!!");
                    res.status(400).send("Process of p-box not restarted !!!");
                } else {
                    res.status(200).send("Process of p-box restarted successfully !!!");
                }
            });
        } else {
            console.log("Destination p-box request not matched !!!");
            res.status(404).send('Destination p-box request not matched !!!')
        }
    } else {
        console.log("Destination request not matched !!!");
        res.status(404).send("Destination request not matched !!!");
    }
});

app.post('/schedulenow', (req, res) => {

    var scheduleRequire = {
        'destination': null,
        'minut': null,
        'hour': null,
        'date': null,
        'month': null,
        'day': null,
        'rboxIP': null,
        'pboxIP': null,
        'User': null,
        'Password': null,
        'id': null
    }


    if ((req.body).hasOwnProperty('pboxIP') && ((req.body).hasOwnProperty('pboxJobID')) && ((req.body).hasOwnProperty('minut')) && ((req.body).hasOwnProperty('hour')) && ((req.body).hasOwnProperty('date')) && ((req.body).hasOwnProperty('month')) && ((req.body).hasOwnProperty('day'))) {

        scheduleRequire.destination = (req.body.type).toUpperCase();
        scheduleRequire.PboxIP = req.body.pboxIP;
        scheduleRequire.minut = req.body.minut;
        scheduleRequire.hour = req.body.hour;
        scheduleRequire.date = req.body.date;
        scheduleRequire.month = req.body.month;
        scheduleRequire.day = req.body.day;
        scheduleRequire.Pbox_JobID = req.body.pboxJobID;

        if (scheduleRequire.destination == 'SCHEDULEPBOX') {
            schedulePboxIP = scheduleRequire.PboxIP;
            JobDetails.Pbox_JobID = scheduleRequire.Pbox_JobID;
            dateValidateP = (scheduleRequire.minut + ' ' + scheduleRequire.hour + ' ' + scheduleRequire.date + ' ' + scheduleRequire.month + ' ' + scheduleRequire.day);
            var checkScheduler = scheduler.validate(dateValidateP);

            if (checkScheduler == false) {
                console.log('Request for process restart of p-box on IP ' + schedulePboxIP + ' not accepted');
                res.status(404).send('Request for process restart of p-box on ' + schedulePboxIP + ' not accepted');
            } else {
                console.log('Request for process restart of p-box on IP' + schedulePboxIP + ' is scheduled on ' + dateValidateP);
                res.status(200).send('Request for process restart of p-box on IP' + schedulePboxIP + ' is scheduled on ' + dateValidateP);
                jobPbox = scheduler.schedule(dateValidateP, () => {
                    var child = cp.spawn(config.cmd, [config.cmdArgs1, config.cmdArgs2, config.cmdArgs3, config.cmdArgs4], { cwd: config.cwdArgs });
                    child.stderr.on('error', error => {
                        console.log('error', error);
                    });
                });
            }
        } else {
            console.log('Request destination for process restart of p-box on IP ' + schedulePboxIP + ' not matched ');
            res.status(400).send('Request destination for process restart of p-box on IP ' + schedulePboxIP + ' not matched ');
        }

    } else if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('rboxIP')) && ((req.body).hasOwnProperty('rboxJobID')) && ((req.body).hasOwnProperty('minut')) && ((req.body).hasOwnProperty('hour')) && ((req.body).hasOwnProperty('date')) && ((req.body).hasOwnProperty('month')) && ((req.body).hasOwnProperty('day')) && ((req.body).hasOwnProperty('user')) && ((req.body).hasOwnProperty('password'))) {

        scheduleRequire.destination = (req.body.type).toUpperCase();
        scheduleRequire.RboxIP = req.body.rboxIP;
        scheduleRequire.Rbox_JobID = req.body.rboxJobID;
        scheduleRequire.User = req.body.user;
        scheduleRequire.Password = req.body.password;
        scheduleRequire.minut = req.body.minut;
        scheduleRequire.hour = req.body.hour;
        scheduleRequire.date = req.body.date;
        scheduleRequire.month = req.body.month;
        scheduleRequire.day = req.body.day;

        if (scheduleRequire.destination == 'SCHEDULERBOX') {
            scheduleRboxIP = scheduleRequire.RboxIP;
            JobDetails.Rbox_JobID = scheduleRequire.Rbox_JobID;
            dateValidateR = (scheduleRequire.minut + ' ' + scheduleRequire.hour + ' ' + scheduleRequire.date + ' ' + scheduleRequire.month + ' ' + scheduleRequire.day);
            var checkScheduler = scheduler.validate(dateValidateR);

            if (checkScheduler == false) {
                console.log('Request for process restart of r-box is not accepted');
                res.status(404).send('Request for process restart of R-Box is not accepted');
            } else {
                res.status(200).send('Request for process restart of r-box on IP ' + scheduleRboxIP + 'is accepted on time ' + dateValidateR);
                jobRbox = scheduler.schedule(dateValidateR, () => {
                    request.post('http://' + scheduleRboxIP + ':' + config.port + '/restart', {
                        json: {
                            "user": scheduleRequire.User,
                            "password": scheduleRequire.Password,
                            "iP": scheduleRboxIP
                        }
                    })
                })
            }
        } else {
            console.log('Request destination for process restart of r-box on IP ' + scheduleRboxIP + ' is not accepted');
            res.status(404).send('Request destination forprocess restart of for r-box  on IP ' + scheduleRboxIP + ' is not accepted');
        }
    } else {
        console.log('Destination request for schedule job not matched !!!');
        res.status(404).send('Destination request for schedule job not matched !!!');
    }
});

app.post('/cancel', (req, res) => {

    if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('jobPID'))) {
        var destination = (req.body.type).toUpperCase();
        var Pbox_JobID = req.body.jobPID;
        if ((destination == 'STOPPBOX')) {

            if (JobDetails.Pbox_JobID == Pbox_JobID) {
                jobPbox.stop();
                jobPbox = null;
                JobDetails.Pbox_JobID = null;
                console.log('Schedule job on p-box of job id :' + Pbox_JobID + ' is canceled successfully');
                res.status(200).send('Schedule job on p-box of job id :' + Pbox_JobID + ' is canceled successfully');
            } else {
                console.log('Job not scheduled on p-box with job id :' + Pbox_JobID + ' !!!');
                res.status(404).send('Job not scheduled on p-box with job id :' + Pbox_JobID + ' !!!');
            }
        } else {
            console.log('Destination for cancel job on p-box not matched !!!');
            res.status(404).send('Destination for cancel job on p-box not matched !!!');
        }
    } else if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('jobRID'))) {
        var destination = (req.body.type).toUpperCase();
        var Rbox_JobID = req.body.jobRID;

        if (destination == 'STOPRBOX') {

            if (JobDetails.Rbox_JobID == Rbox_JobID) {
                var Rbox_JobID = req.body.jobRID;
                jobRbox.stop();
                jobRbox = null;
                JobDetails.Rbox_JobID = null;
                console.log('Schedule job on r-box of job id ' + Rbox_JobID + ' is canceled successfully');
                res.status(200).send('Schedule job on r-box of job id ' + Rbox_JobID + ' is canceled successfully');
            } else {
                console.log('Job not scheduled on r-box with job id :' + Rbox_JobID + ' !!!');
                res.status(404).send('Job not scheduled on r-box with job id :' + Rbox_JobID + ' !!!');
            }
        } else {
            console.log('Destination for cancel job on p-box not matched !!!');
            res.status(404).send('Destination for cancel job on p-box not matched !!!');
        }
    } else {
        console.log('Destination request for cancel job not matched !!!');
        res.status(404).send('Destination request for cancel job not matched !!!');
    }
});

app.post('/retrivenow', (req, res) => {

    if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('rboxip')) | ((req.body).hasOwnProperty('pboxip'))) {
        var destination = (req.body.type).toUpperCase();
        var iPR = req.body.rboxip;
        var iPP = req.body.pboxip;
        var responseFromServer = null

        //Retrive scheduling for both P-Box and R-Box
        if ((destination == 'ALL') && ((schedulePboxIP == iPP) || (scheduleRboxIP == iPR))) {

            if ((JobDetails.Pbox_JobID != null) | (JobDetails.Rbox_JobID != null)) {

                if (JobDetails.Pbox_JobID != null) {
                    responseFromServer = "Process restart of p-box is scheduled  on I.P : " + iPP + ",  Job id: " + JobDetails.Pbox_JobID + " on time :" + dateValidateP;
                    console.log(responseFromServer);

                } else {
                    responseFromServer = "Process restart of p-box is not scheduled  on I.P. :" + iPP + " !!!  ";
                }

                if (JobDetails.Rbox_JobID != null) {
                    console.log("Process restart of r-box is scheduled  on I.P : " + iPR + ",  Job id: " + JobDetails.Rbox_JobID + " on time :" + dateValidateR);
                    res.status(200).send(responseFromServer + '  ' + "Process restart of r-box is scheduled  on I.P. " + iPR + ",  Job id: " + JobDetails.Rbox_JobID + " on time :" + dateValidateR);

                } else {
                    console.log(responseFromServer + "Process restart of r-box is not scheduled  on I.P: " + iPR + " !!!");
                    res.status(200).send(responseFromServer + "Process restart of r-box is not scheduled  on I.P: " + iPR + " !!!");
                }

            } else {
                console.log("Destination type not found !!!");
                res.status(404).send("Destination type not found !!!");
            }

            //retrivr schedling of pbox 
        } else if (destination == 'SCHEDULEPBOX') {
            if (JobDetails.Pbox_JobID != null) {
                console.log("Process restart of p-box is scheduled  on I.P: " + iPP + ",  Job id: " + JobDetails.Pbox_JobID + " on time " + dateValidateP);
                res.status(200).send("Process restart of p-box is scheduled  on I.P: " + iPP + ",  Job id: " + JobDetails.Pbox_JobID + " on time " + dateValidateP);
            } else {
                console.log("Process restart of p-box is not scheduled  on I.P: " + iPP);
                res.status(404).send("Process restart of p-box is not scheduled  on I.P: " + iPP);

            }
            //retrivr schedling of R-Box 
        } else if (destination == 'SCHEDULERBOX') {
            console.log(JobDetails.Rbox_JobID);
            if (JobDetails.Rbox_JobID != null) {
                console.log("Process restart of r-box is scheduled  on I.P: " + iPR + ",  Job id: " + JobDetails.Rbox_JobID + " on time " + dateValidateR);
                res.status(200).send("Process restart of r-box is scheduled  on I.P. " + iPR + ",  Job id: " + JobDetails.Rbox_JobID + " on time " + dateValidateR);
            } else {
                console.log("Process restart of r-box is not scheduled  on I.P. " + iPR);
                res.status(404).send("Process restart of r-box is not scheduled  on I.P. " + iPR);

            }
        } else {
            console.log("Destination type not matched !!! ");
            res.status(404).send(" Destination not matched !!!");
        }
    } else {
        console.log('Destination request for cancel job not matched !!!');
        res.status(404).send('Destination request for cancel job not matched !!!');
    }
})

app.listen(port, config.pboxIP, () => {
    console.log("P-Box is listing on port number : " + port + ' ' + 'of I.P. :' + config.pboxIP);
});

