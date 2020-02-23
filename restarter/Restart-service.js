const express = require('express');
const scheduler = require('node-cron');
const cp = require('child_process');
const request = require('request');
const config = require('./config.js');
const mysql =   require('mysql')
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

//Executenow section 

app.post('/executenow', (req, res) => {
    //R-Box section
    if (((req.body).hasOwnProperty('ip')) && ((req.body).hasOwnProperty('type'))) {

        requireData.destination = (req.body.type).toUpperCase();
        requireData.iP = req.body.ip;

        if (requireData.destination == 'RBOX') {
            function fetchDataFromDb() {
                var con = mysql.createConnection({
                    ip: "127.0.0.1",
                    user: "root",
                    password: 'fantasticfourmadeacloud',
                    database: "pcloud"
                });

                var timeForSchedule = Date.parse(new Date()) / 1000;
                con.connect(function (err) {
                    if (err) {
                        console.log('Error ', err);
                    } else {
                        var sql = 'SELECT pcloud_device.did, pcloud_device.rbid, pcloud_rbox.ip, stime, etime, uid, device_stat FROM pcloud_reservation INNER JOIN pcloud_device ON pcloud_reservation.did = pcloud_device.did INNER JOIN pcloud_rbox ON pcloud_device.rbid = pcloud_rbox.rbid WHERE (? >= pcloud_reservation.stime)  AND (? <= pcloud_reservation.etime)';
                        con.query(sql, [timeForSchedule, timeForSchedule], function (err, result, fields) {
                            if (err) {
                                console.log("error ", err);
                            } else {

                                if (result == 0) {

                                    request.post('http://' + requireData.iP + ':' + config.port + '/restart', {
                                        json: {
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
                                    console.log('rBox is busy on ip :', requireData.iP + ' with device id : ' + result[0].did);
                                    res.status(404).send('rBox is busy on ip : ' + requireData.iP + ' with device id :' + result[0].did);
                                    setTimeout(fetchDataFromDb(), 300000, '');
                                }
                            }
                        })
                    }
                })
            }
            fetchDataFromDb();
        } else {
            console.log("Request not found !!!");
            res.status(404).send('Request not found !!!')
        }
        //Pbox section

    } else if ((req.body).hasOwnProperty('type')) {
        requireData.destination = (req.body.type).toUpperCase();
        var pboxError = null;
        if (requireData.destination == 'PBOX') {

            function fetchDataFromDb() {
                var con = mysql.createConnection({
                    ip: "127.0.0.1",
                    user: "root",
                    password: 'fantasticfourmadeacloud',
                    database: "pcloud"
                });

                var timeForSchedule = Date.parse(new Date()) / 1000;
                con.connect(function (err) {
                    if (err) {
                        console.log('Error ', err);
                    } else {
                        var sql = 'SELECT pcloud_device.did, pcloud_device.rbid, pcloud_rbox.ip, stime, etime, uid, device_stat FROM pcloud_reservation INNER JOIN pcloud_device ON pcloud_reservation.did = pcloud_device.did INNER JOIN pcloud_rbox ON pcloud_device.rbid = pcloud_rbox.rbid WHERE (? >= pcloud_reservation.stime)  AND (? <= pcloud_reservation.etime)';
                        con.query(sql, [timeForSchedule, timeForSchedule], function (err, result, fields) {
                            if (err) {
                                console.log("error ", err);
                            } else {

                                if (result == 0) {

                                    var child = cp.spawn(config.pm2, [config.restart, config.ecosystem, config.env, config.production], { cwd: config.path });
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
                                    console.log('rBox is busy on ip :', requireData.iP + ' with device id : ' + result[0].did);
                                    res.status(404).send('rBox is busy on ip : ' + requireData.iP + ' with device id :' + result[0].did);
                                    setTimeout(fetchDataFromDb(), 300000, '');
                                }
                            }
                        })
                    }
                })
            }
            fetchDataFromDb();
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
    
    if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('rboxIP')) && ((req.body).hasOwnProperty('minut')) && ((req.body).hasOwnProperty('hour')) && ((req.body).hasOwnProperty('date')) && ((req.body).hasOwnProperty('month')) && ((req.body).hasOwnProperty('day')) ) {

        scheduleRequire.destination = (req.body.type).toUpperCase();
        scheduleRequire.RboxIP = req.body.rboxIP;
        scheduleRequire.Rbox_JobID = req.body.rboxIP;
        scheduleRequire.User = req.body.user;
        scheduleRequire.Password = req.body.password;
        scheduleRequire.minut = req.body.minut;
        scheduleRequire.hour = req.body.hour;
        scheduleRequire.date = req.body.date;
        scheduleRequire.month = req.body.month;
        console.log('req.body.day ',req.body.day)
        if(req.body.day == "null"){
            scheduleRequire.day = '*';
            }else{
                scheduleRequire.day = req.body.day;
            }

        if (scheduleRequire.destination == 'SCHEDULERBOX') {
            scheduleRboxIP = scheduleRequire.RboxIP;
            JobDetails.Rbox_JobID = scheduleRequire.Rbox_JobID;

            if ((scheduleRequire.hasOwnProperty('RboxIP')) && (scheduleRequire.hasOwnProperty('minut')) && (scheduleRequire.hasOwnProperty('hour')) && (scheduleRequire.hasOwnProperty('date')) && (scheduleRequire.hasOwnProperty('month')) && scheduleRequire.hasOwnProperty('day')) {
                dateValidateR = (scheduleRequire.minut + ' ' + scheduleRequire.hour + ' ' + scheduleRequire.date + ' ' + scheduleRequire.month + ' ' + scheduleRequire.day);
                console.log('check ',dateValidateR)
                var checkScheduler = scheduler.validate(dateValidateR);

                if (checkScheduler == false) {
                    console.log('Process restart request on R-Box is not scheduled');
                    res.status(404).send('Process restart request on R-Box is not scheduled');
                } else {

                    function fetchDataFromDb() {
                        var con = mysql.createConnection({
                            ip: "127.0.0.1",
                            user: "root",
                            password: 'fantasticfourmadeacloud',
                            database: "pcloud"
                        });

                        var timeForSchedule = Date.parse(new Date()) / 1000;
                        con.connect(function (err) {
                            if (err) {
                                console.log('Error ', err);
                            } else {
                                var sql = 'SELECT pcloud_device.did, pcloud_device.rbid, pcloud_rbox.ip, stime, etime, uid, device_stat FROM pcloud_reservation INNER JOIN pcloud_device ON pcloud_reservation.did = pcloud_device.did INNER JOIN pcloud_rbox ON pcloud_device.rbid = pcloud_rbox.rbid WHERE (? >= pcloud_reservation.stime)  AND (? <= pcloud_reservation.etime)';
                                con.query(sql, [timeForSchedule, timeForSchedule], function (err, result, fields) {
                                    if (err) {
                                        console.log("error ", err);
                                    } else {

                                        if (result == 0) {
                                            console.log('Process restart request on R-Box on IP ' + scheduleRboxIP + 'is scheduled on time ' + dateValidateR);
                                            res.status(200).send('Process restart request on R-Box on IP ' + scheduleRboxIP + 'is scheduled on time ' + dateValidateR);
                                            jobRbox = scheduler.schedule(dateValidateR, () => {

                                                request.post('http://' + scheduleRboxIP + ':' + config.port + '/restart', {
                                                    json: {
                                                        "user": scheduleRequire.User,
                                                        "password": scheduleRequire.Password,
                                                        "iP": scheduleRboxIP
                                                    }
                                                })
                                            })
                                        } else {
                                            console.log('rBox is busy on ip :', requireData.iP + ' with device id : ' + result[0].did);
                                            res.status(404).send('rBox is busy on ip : ' + requireData.iP + ' with device id :' + result[0].did);
                                            setTimeout(fetchDataFromDb(), 300000, '');
                                        }
                                    }
                                })
                            }
                        })
                    }
                    fetchDataFromDb();
                }
            } else {
                console.log('restart request for R-Box on IP ' + scheduleRboxIP + ' is not accepted');
                res.status(404).send('restart request for R-Box  on IP ' + scheduleRboxIP + ' is not accepted');
            }
        } else {
            console.log('Please check entered destination type value');
            res.status(404).send('Please check entered destination type value');
        }
    
    //P-BOX Scheduling 
    }else if ((req.body.hasOwnProperty('type')) && ((req.body).hasOwnProperty('minut')) && ((req.body).hasOwnProperty('hour')) && ((req.body).hasOwnProperty('date')) && ((req.body).hasOwnProperty('month')) && ((req.body).hasOwnProperty('day'))) {
       
        scheduleRequire.destination = (req.body.type).toUpperCase();
        scheduleRequire.PboxIP = 'localhost';
        scheduleRequire.minut = req.body.minut;
        scheduleRequire.hour = req.body.hour;
        scheduleRequire.date = req.body.date;
        scheduleRequire.month = req.body.month;
        if(req.body.day == null){
        scheduleRequire.day = '*';
        }else{
            scheduleRequire.day = req.body.day;
        }
        
        scheduleRequire.Pbox_JobID = 'localhost';
        if (scheduleRequire.destination == 'SCHEDULEPBOX') {
            schedulePboxIP = scheduleRequire.PboxIP;
            JobDetails.Pbox_JobID = scheduleRequire.Pbox_JobID;
            console.log('JobDetails.Pbox_JobID', JobDetails.Pbox_JobID)
            dateValidateP = (scheduleRequire.minut + ' ' + scheduleRequire.hour + ' ' + scheduleRequire.date + ' ' + scheduleRequire.month + ' ' + scheduleRequire.day);
            var checkScheduler = scheduler.validate(dateValidateP);

            if (checkScheduler == false) {
                console.log('Request for P-Box on localhost is not accepted');
                res.status(404).send('Request for P-Box on localhost is not accepted');
            } else {

                function fetchDataFromDb() {
                    var con = mysql.createConnection({
                        ip: "127.0.0.1",
                        user: "root",
                        password: 'fantasticfourmadeacloud',
                        database: "pcloud"
                    });

                    var timeForSchedule = Date.parse(new Date()) / 1000;
                    con.connect(function (err) {
                        if (err) {
                            console.log('Error ', err);
                        } else {
                            var sql = 'SELECT pcloud_device.did, pcloud_device.rbid, pcloud_rbox.ip, stime, etime, uid, device_stat FROM pcloud_reservation INNER JOIN pcloud_device ON pcloud_reservation.did = pcloud_device.did INNER JOIN pcloud_rbox ON pcloud_device.rbid = pcloud_rbox.rbid WHERE (? >= pcloud_reservation.stime)  AND (? <= pcloud_reservation.etime)';
                            con.query(sql, [timeForSchedule, timeForSchedule], function (err, result, fields) {
                                if (err) {
                                    console.log("error ", err);
                                } else {

                                    if (result == 0) {
                                        console.log('restart request for P-Box on localhost is scheduled on ' + dateValidateP);
                                        res.status(200).send('restart request for P-Box on localhost is scheduled on ' + dateValidateP);
                                        jobPbox = scheduler.schedule(dateValidateP, () => {
                                            var child = cp.spawn(config.cmd, [config.cmdArgs1, config.cmdArgs2, config.cmdArgs3, config.cmdArgs4], { cwd: config.cwdArgs });
                                            child.stderr.on('error', error => {
                                                console.log('error', error);
                                            });
                                            child.stdout.on('data',data =>{
                                                console.log('data', data);
                                            })
                                        });
                                    } else {
                                        setTimeout(fetchDataFromDb(), 300000, '');
                                        console.log('rBox is busy on ip :', requireData.iP + ' with device id : ' + result[0].did);
                                        res.status(404).send('rBox is busy on ip : ' + requireData.iP + ' with device id :' + result[0].did);
                                    }
                                }
                            })
                        }
                    })
                }
                fetchDataFromDb();
            }
        } else {
            console.log('Request for P-Box on localhost not matched ');
            res.status(400).send('Request for P-Box localhost not matched ');
        }
    } else {
        console.log('Request process restart  on IP ' + scheduleRboxIP + ' not accepted');
        res.status(404).send('Request process restart on IP ' + scheduleRboxIP + ' not accepted');
    }
});

//STOP Scetion 
app.post('/cancel', (req, res) => {

    //Stop P-Box
    if (((req.body).hasOwnProperty('type')) && (JobDetails.Pbox_JobID == "localhost")){
        var destination = (req.body.type).toUpperCase();
        var Pbox_JobID = 'localhost';
        if ((destination == 'STOPPBOX') && (JobDetails.Pbox_JobID == Pbox_JobID)) {
            jobPbox.stop();
            jobPbox = null;
            JobDetails.Pbox_JobID = null;
            console.log('Schedule job on P-Box is canceled successfully');
            res.status(200).send('Schedule job on P-Box canceled successfully');
        } else {
            console.log('Request not excepted !!!');
            res.status(404).send('Request not excepted !!!');
        }
        //Stop R-Box 
    } else if (((req.body).hasOwnProperty('type') && (req.body).hasOwnProperty('ip'))) {

        var destination = (req.body.type).toUpperCase();
        var cancelRboxIp = req.body.ip;
        var Rbox_JobID = scheduleRboxIP;
        console.log('destination ',destination)
        console.log('Rbox_JobI ',Rbox_JobID)

        if ((destination == 'STOPRBOX') && (JobDetails.Rbox_JobID == Rbox_JobID)) {
        
            jobRbox.stop();
            jobRbox = null;
            JobDetails.Rbox_JobID = null;
            console.log('Schedule job on R-Box on I.P'+ scheduleRboxIP+'is canceled successfully');
            res.status(200).send('Schedule job on R-Box on I.P'+ scheduleRboxIP+'is canceled successfully');

        } else {
            console.log("Request not excepted  !!!");
            res.status(404).send("Request not excepted !!!");
        }

    }
});

//RETRIVE SECTION 
app.post('/retrivenow', (req, res) => {

        var destination = (req.body.type).toUpperCase();
        var iPR = req.body.rboxip;
        var iPP = 'localhost';
        var responseFromServer = null
        //retrive scheduling of all
        if ((destination == 'ALL') && ((schedulePboxIP == iPP) || (scheduleRboxIP == iPR))) {
            if ((JobDetails.Pbox_JobID != null) | (JobDetails.Rbox_JobID != null)) {

                if (JobDetails.Pbox_JobID != null) {
                    responseFromServer = "P-Box is scheduled  on localhost. Time of schedule :" + dateValidateP;
                    console.log(responseFromServer);

                } else {
                    responseFromServer = "P-Box is not scheduled    ! ";
                    console.log(responseFromServer);
                }

                if (JobDetails.Rbox_JobID != null) {
                    console.log("R-Box is scheduled  on I.P. " + iPR + "  Job id: " + JobDetails.Rbox_JobID + " on time :" + dateValidateR);
                    res.status(200).send(responseFromServer + '  ' + "R-Box is scheduled  on I.P. " + iPR + "  Job id: " + JobDetails.Rbox_JobID + " on time :" + dateValidateR);

                } else {
                    console.log(responseFromServer + " R-Box is not scheduled  on I.P. " + iPR + " !");
                    res.status(404).send(responseFromServer + " R-Box is not scheduled  on I.P. " + iPR + " !");
                }

            } else {
                console.log("Request not found !!!");
                res.status(404).send("Request not found !!!");
            }
            //retrivr schedling of P-Box 
        } else if ((destination == 'SCHEDULEPBOX') && (schedulePboxIP == iPP)){
            if (JobDetails.Pbox_JobID != null) {
                console.log("P-Box is scheduled  on on localhost  on time " + dateValidateP);
                res.status(200).send("P-Box is scheduled  localhost on time " + dateValidateP);
            } else {
                console.log("P-Box is not scheduled  on localhost ");
                res.status(404).send("P-Box is not scheduled  on localhost");

            }
            //retrivr schedling of R-Box 
        } else if ((destination == 'SCHEDULERBOX') && (scheduleRboxIP == iPR)) {
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
})

app.listen(port, () => {
    console.log("Listing on port number : " + port + ' ' );
});

