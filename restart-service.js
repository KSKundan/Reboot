const express = require('express');
const scheduler = require('node-cron');
const cp = require('child_process');
const request = require('request');
const config = require('./config.js');
const app = express();
const port = config.portPbox;
app.use(express.json());
var jobPbox = null, JobRbox = null;
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

//Executenow section 

app.post('/executenow', (req, res) => {
//R-Box section
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
                    console.log("request not executed successfully !!! ", error);
                    response.status(400).send('request not executed successfully !!!')
                } else {
                    if (response.statusCode == 200) {
                        console.log("R-Box on I.P." + requireData.iP + " is executed successfully  !!!");
                        res.status(200).send("R-Box on I.P." + requireData.iP + " is executed successfully  !!!");
                    }
                    else if (response.statusCode == 400) {
                        console.log("R-Box on I.P." + requireData.iP + " is not executed successfully  !!!");
                        res.status(400).send("R-Box on I.P. " + requireData.iP + " is not executed successfully !!!");
                    } else if (response.statusCode == 404) {
                        console.log("Request for R-Box on " + requireData.iP + " execution not found   !!!");
                        res.status(404).send("Request for R-Box on " + requireData.iP + "execution not found  !!!");
                    } else {
                        console.log("Something went wrong for R-Box request on " + requireData.iP + " !!!");
                        res.status(500).send("Something went wrong for R-Box request on " + requireData.iP + " !!!" + body);
                    }
                }
            })
        } else {
            console.log("Request not found !!!");
            res.status(404).send('Request not found !!!')
        }
//Pbox section

    } else if (((req.body).hasOwnProperty('ip')) && ((req.body).hasOwnProperty('type'))) {
        requireData.destination = (req.body.type).toUpperCase();
        var pboxError = null;
        if (requireData.destination == 'PBOX') {
            
            var child = cp.spawn(config.cmd, [config.cmdArgs1,config.cmdArgs2,config.cmdArgs3,config.cmdArgs4], { cwd:config.cwdArgs });
            child.stderr.on('error', error => {
                console.log('error', error);
                pboxError = 'error';
            });
            child.on('close', (code) => {
                if (pboxError == 'error') {
                    console.log("P-Box is not executed  !!!");
                    res.status(400).send("P-Box is not executed !!!");
                } else {
                    console.log("P-Box is executed successfully !!!");
                    res.status(200).send("P-Box is executed successfully !!!");
                }
            });
        } else {
            console.log("Request not found !!!");
            res.status(404).send("Request not found !!!");
        }
    } else {
        console.log("Request not matched !!!");
        res.status(404).send("Request not matched !!!");
    }
});

//Schedulenow Section 

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
    //P-BOX Scheduling 
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
                console.log('Request for P-Box on IP ' + schedulePboxIP + ' not accepted');
                res.status(404).send('Request for P-Box on ' + schedulePboxIP + ' not accepted');
            } else {
                console.log('restart request for P-Box on IP' + schedulePboxIP + ' is scheduled on ' +dateValidateP);
                res.status(200).send('restart request for P-Box on IP' + schedulePboxIP + ' is scheduled on '+dateValidateP);
                jobPbox = scheduler.schedule(dateValidateP, () => {
		var child = cp.spawn(config.cmd, [config.cmdArgs1,config.cmdArgs2,config.cmdArgs3,config.cmdArgs4], { cwd:config.cwdArgs });  
		 child.stderr.on('error', error => {
                        console.log('error', error);
                    });
                });
            }
        } else {
            console.log('Request for P-Box on IP ' + schedulePboxIP + ' not matched ');
            res.status(400).send('Request for P-Box on IP ' + schedulePboxIP + ' not matched ');
        }

    //Schedule R-Box 

    } else if (((req.body).hasOwnProperty('type'))&&((req.body).hasOwnProperty('rboxIP')) && ((req.body).hasOwnProperty('rboxJobID')) && ((req.body).hasOwnProperty('minut')) && ((req.body).hasOwnProperty('hour')) && ((req.body).hasOwnProperty('date')) && ((req.body).hasOwnProperty('month')) && ((req.body).hasOwnProperty('day')) && ((req.body).hasOwnProperty('user')) && ((req.body).hasOwnProperty('password'))) {

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

            if ((scheduleRequire.hasOwnProperty('RboxIP')) && (scheduleRequire.hasOwnProperty('Rbox_JobID')) && (scheduleRequire.hasOwnProperty('minut')) && (scheduleRequire.hasOwnProperty('hour')) && (scheduleRequire.hasOwnProperty('day')) && (scheduleRequire.hasOwnProperty('month')) && scheduleRequire.hasOwnProperty('day')) {
                dateValidateR = (scheduleRequire.minut + ' ' + scheduleRequire.hour + ' ' + scheduleRequire.date + ' ' + scheduleRequire.month + ' ' + scheduleRequire.day);
                var checkScheduler = scheduler.validate(dateValidateR);

                if (checkScheduler == false) {
                    console.log('restart request for R-Box is not scheduled');
                    res.status(404).send('restart request for R-Box is not scheduled');
                } else {
                    console.log('restart request for R-Box on IP ' + scheduleRboxIP + 'is scheduled on time ' + dateValidateR);
                    res.status(200).send('restart request for R-Box on IP ' + scheduleRboxIP + 'is scheduled on time ' + dateValidateR);
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
                console.log('restart request for R-Box on IP ' + scheduleRboxIP + ' is not accepted');
                res.status(404).send('restart request for R-Box  on IP ' + scheduleRboxIP + ' is not accepted');
            }
        } else {
            console.log('Please check entered date and time value');
            res.status(404).send('Please check entered date and time value');
        }
    } else {
        console.log('Request for R-Box on IP ' + scheduleRboxIP + ' not accepted');
        res.status(404).send('Request for R-Box  on IP ' + scheduleRboxIP + ' not accepted');
    }
});
//STOP Scetion 
app.post('/cancel', (req, res) => {

    //Stop P-Box
    if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('jobPID'))) {
        var destination = (req.body.type).toUpperCase();
        var Pbox_JobID = req.body.jobPID;
        if ((destination == 'STOPPBOX') && (JobDetails.Pbox_JobID == Pbox_JobID)) {
            jobPbox.stop();
            jobPbox = null;
            JobDetails.Pbox_JobID = null;
            console.log('Schedule job on P-Box of job id ' + Pbox_JobID + ' is canceled successfully');
            res.status(200).send('Schedule job on P-Box of job id ' + Pbox_JobID + ' is canceled successfully');
        } else {
            console.log('Request not excepted !!!');
            res.status(404).send('Request not excepted !!!');
        }
        //Stop R-Box 
    } else if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('jobRID'))) {
        var destination = (req.body.type).toUpperCase();
        var Rbox_JobID = req.body.jobRID;

        if ((destination == 'STOPRBOX') && (JobDetails.Rbox_JobID == Rbox_JobID)) {
            var Rbox_JobID = req.body.jobRID;
            jobRbox.stop();
            jobRbox = null;
            JobDetails.Rbox_JobID = null;
            console.log('Schedule job on R-Box of job id ' + Rbox_JobID + ' is canceled successfully');
            res.status(200).send('Schedule job on R-Box of job id ' + Rbox_JobID + ' is canceled successfully');
        } else {
            console.log("Request not excepted !!!");
            res.status(404).send("Request not excepted !!!");
        }

    }
});

//RETRIVE SECTION 
app.post('/retrivenow', (req, res) => {

    if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('rboxip')) | ((req.body).hasOwnProperty('pboxip'))) {
        var destination = (req.body.type).toUpperCase();
        var iPR = req.body.rboxip;
        var iPP = req.body.pboxip;
        var responseFromServer = null
        //retrive scheduling of all
        if ((destination == 'ALL') && ((schedulePboxIP == iPP) || (scheduleRboxIP == iPR))) {
            if ((JobDetails.Pbox_JobID != null) | (JobDetails.Rbox_JobID != null)) {

                if (JobDetails.Pbox_JobID != null) {
                    responseFromServer = "P-Box is scheduled  on I.P. " + iPP + "  Job id: " + JobDetails.Pbox_JobID + " on time :" + dateValidateP;
                    console.log(responseFromServer);

                } else {
                    responseFromServer = "P-Box is not scheduled  on I.P. " + iPP + " !  ";
                    console.log(responseFromServer);
                }

                if (JobDetails.Rbox_JobID != null) {
                    console.log("R-Box is scheduled  on I.P. " + iPR + "  Job id: " + JobDetails.Rbox_JobID + " on time :" + dateValidateR);
                    res.status(200).send(responseFromServer + '  ' + "R-Box is scheduled  on I.P. " + iPR + "  Job id: " + JobDetails.Rbox_JobID + " on time :" + dateValidateR);

                } else {
                    console.log(responseFromServer+" R-Box is not scheduled  on I.P. " + iPR + " !");
                    res.status(404).send(responseFromServer+" R-Box is not scheduled  on I.P. " + iPR + " !");
                }

            } else {
                console.log("Request not found !!!");
                res.status(404).send("Request not found !!!");
            }
        //retrivr schedling of P-Box 
        } else if (destination == 'SCHEDULEPBOX') {
            if (JobDetails.Pbox_JobID != null) {
                console.log("P-Box is scheduled  on I.P. " + iPP + "  Job id: " + JobDetails.Pbox_JobID + " on time " + dateValidateP);
                res.status(200).send("P-Box is scheduled  on I.P. " + iPP + "  Job id: " + JobDetails.Pbox_JobID + " on time " + dateValidateP);
            } else {
                console.log("P-Box is not scheduled  on I.P. " + iPP);
                res.status(404).send("P-Box is not scheduled  on I.P. " + iPP);

            }
        //retrivr schedling of R-Box 
        } else if (destination == 'SCHEDULERBOX') {
            if (JobDetails.Rbox_JobID != null) {
                console.log("R-Box is scheduled  on I.P. " + iPR + "  Job id: " + JobDetails.Rbox_JobID + " on time " + dateValidateR);
                res.status(200).send("R-Box is scheduled  on I.P. " + iPR + "  Job id: " + JobDetails.Rbox_JobID + " on time " + dateValidateR);
            } else {
                console.log("R-Box is not scheduled  on I.P. " + iPR);
                res.status(404).send("R-Box is not scheduled  on I.P. " + iPR);

            }
        } else {
            console.log("Destination not found !!! ");
            res.status(404).send(" Destination not found !!!");
        }
    }else{
            console.log("Destination not found !!! ");
            res.status(404).send(" Destination not found !!!");
    }
 })

app.listen(port, config.pboxIP, () => {
    console.log("Listing on port number : " + port + ' ' + 'of I.P. :' + config.pboxIP);
});

