const express = require('express');
var scheduler = require('node-cron');
const cp = require('child_process');
const request = require('request');
const mysql = require('mysql');
const config = require('./config.js');
const app = express();
const port = config.portPbox;
app.use(express.json());
var jobPbox = null, JobRbox = null, setP =1, setR =1;
var dateValidateP =null,
    dateValidateR =null,
    schedulePoxIP =null,
    scheduleRoxIP =null;
var JobDetails = {
        Pbox_JobID: null,
        Rbox_JobID: null,
    }

///////////////////////////////////////Executenow section /////////////////////////////
app.post('/executenow', (req, res) => {

    var requireData = {
        'User': '',
        'Password': '',
        'iP': '',
        'destination': ''
    }
    requireData.destination = (req.body.type).toUpperCase();
    requireData.User = req.body.user;
    requireData.Password = req.body.password;
    requireData.iP = req.body.ip;

    //////////////////////////////////R-Box section///////////////////////////////////////////

    if ((requireData.hasOwnProperty('User')) && (requireData.hasOwnProperty('Password')) && (requireData.hasOwnProperty('iP')) && (requireData.hasOwnProperty('destination'))) {
        if (requireData.destination == 'RBOX') {
            request.post('http://' + requireData.iP + ':' + config.port + '/restart', {
                json: {
                    "user": requireData.User,
                    "password": requireData.Password,
                    "iP": requireData.iP
                }
            }, (error, response, body) => {

                if (error) {
                    console.log(error);
                    console.log("request not executed successfully !!!");
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
        }
        //////////////////////////////////////////////////Pbox section////////////////

        else if (requireData.destination == 'PBOX') {
            console.log("Entered ip ", requireData.iP);
            var child = cp.spawn('pm2',['restart','ecosystem.config.js','--env', 'production'], {cwd:"/home/padmin/build/pm2_config"});
            child.stdout.on('data', data => {
                console.log('data', data.toString());
            });
            child.stderr.on('error', error => {
                console.log('error', error);
            });
            console.log("P-Box is executed successfully !!!");
            res.status(200).send("P-Box is executed successfully !!!");
        }
        else {
            console.log("Request not matched !!!");
            res.status(404).send.json("Request not matched !!!");
        }
    } else {
        console.log("Request not matched !!!");
        res.status(404).send.json("Request not matched !!!");
    }
});


///////////////////////////////Schedulenow Section /////////////////////////////////////////


app.post('/schedulenow', (req, res) => {
   
    var destination = (req.body.type).toUpperCase();
    scheduleRoxIP = req.body.rboxIP;
    schedulePoxIP = req.body.pboxIP;
    var minut = req.body.minut;
    var hour = req.body.hour;
    var date = req.body.date;
    var month = req.body.month;
    var day = req.body.day;
    JobDetails.Pbox_JobID = req.body.jobID;
    JobDetails.Rbox_JobID = req.body.jobID;
    var User = req.body.user;
    var Password = req.body.password;
    /////////////////////////////////////////P-BOX Scheduling /////////////////////////

    if (destination == 'SCHEDULEPBOX') {
        if (JobDetails.Pbox_JobID != null) {
            dateValidateP = (minut + ' ' + hour + ' ' + date + ' ' + month + ' ' + day);
            jobPbox = scheduler.schedule(dateValidateP, () => {
                var child = cp.spawn('pm2', ['restart', 'ecosystem.config.js', '--env', 'production'], { cwd: "/home/padmin/build/pm2_config" });
                child.stdout.on('data', data => {
                    console.log('data', data.toString());
                });
                child.stderr.on('error', error => {
                    console.log('error', error);
                });
            });
            schedulePboxExecuteStatu = jobPbox;
            console.log('Reboot request for P-Box on IP'+schedulePoxIP+' is accepted');
            res.status(200).send('Reboot request for P-Box on '+schedulePoxIP+' is accepted');
        } else {
            console.log('Reboot request for P-Box on IP '+schedulePoxIP+'is not accepted');
            res.status(404).send('Reboot request for P-Box on IP '+schedulePoxIP+' is not accepted');
        }


        /////////////////////////////////////////Schedule R-Box ////////////////////////////////

    } else if (destination == 'SCHEDULERBOX') {
        if (JobDetails.Rbox_JobID != null) {
            dateValidateR = (minut + ' ' + hour + ' ' + date + ' ' + month + ' ' + day);
            var checkScheduler = scheduler.validate(dateValidateR);
    
            if (checkScheduler == false) {
                console.log('Reboot request for R-Box is not scheduled');
                res.status(404).send('Reboot request for R-Box is not scheduled');
            } else {
                console.log('Reboot request for R-Box on IP '+scheduleRoxIP+'is scheduled on time '+dateValidateR);
                res.status(200).send('Reboot request for R-Box on IP '+scheduleRoxIP+'is scheduled on time '+dateValidateR);
                jobRbox = scheduler.schedule(dateValidateR, () => {

                    request.post('http://' + scheduleRoxIP + ':' + config.port + '/restart', {
                        json: {
                            "user": User,
                            "password": Password,
                            "iP": scheduleRoxIP
                        }
                    })
                })
            }
        }else{
            console.log('Reboot request for R-Box is not accepted');
            res.status(404).send('Reboot request for R-Box is not accepted');
        }
    } else {
        console.log('Please check entered date and time value');
        res.status(404).send('Please check entered date and time value');
    }
});
///////////////////////////////////////STOP P-Box //////////////////////////////////////////////////
app.post('/cancel', (req, res) => {
    var destination = (req.body.type).toUpperCase();
    var Pbox_JobID = req.body.jobPID;
    var Rbox_JobID = req.body.jobRID;
    if (destination == 'STOPPBOX') {
        if (JobDetails.Pbox_JobID == Pbox_JobID) {
            jobPbox.stop();
            jobPbox = null;
            JobDetails.Pbox_JobID = null;
            setP = null;
            console.log('Schedule job on P-Box of job id '+ Pbox_JobID+' is canceled successfully');
            res.status(200).send('Schedule job on P-Box of job id '+ Pbox_JobID+' is canceled successfully');
        } else {
            console.log('Schedule job on P-Box of job id '+ Pbox_JobID+' is not found');
            res.status(404).send('Schedule job on P-Box of job id '+ Pbox_JobID+' is not found');
        }
    ///////////////////////////////////////////Stop R-Box /////////////////////////////////////////////
    } else if (destination == 'STOPRBOX') {
        if (JobDetails.Rbox_JobID == Rbox_JobID) {
            jobRbox.stop();
            jobRbox = null;
            JobDetails.Rbox_JobID = null;
            setR =null;
            console.log('Schedule job on R-Box of job id '+ Rbox_JobID+' is canceled successfully');
            res.status(200).send('Schedule job on R-Box of job id '+ Rbox_JobID+' is canceled successfully');
        } else {
            console.log('Schedule job on R-Box of job id '+ Rbox_JobID+' is not found');
            res.status(404).send('Schedule job on R-Box of job id '+ Rbox_JobID+' is not found');
        }
    }
    else {
        console.log("Request not matched !!!");
        res.status(404).send("Request not matched !!!");
    }
});

////////////////////////////////////////RETRIVE SECTION ///////////////////////////
app.post('/retrivenow', (req, res) => {
    var destination = (req.body.type).toUpperCase();
    let iP = req.body.ip;

        //////////////////////////retrivr schedling fix day of week once ///////////////////////
        if (destination == 'SCHEDULEPBOX') {
            if (JobDetails.Pbox_JobID != null) {
                console.log("P-Box is scheduled  on I.P. " + iP +"  Job id: "+JobDetails.Pbox_JobID+ " on time " +dateValidateP);
                res.status(200).send("P-Box is scheduled  on I.P. " + iP +"  Job id: "+JobDetails.Pbox_JobID+ " on time " +dateValidateP);
            } else {
                console.log("P-Box is not scheduled  on I.P. " + iP );
                res.status(404).send("P-Box is not scheduled  on I.P. " + iP );
               
            } 
        }

        //////////////////////////retrivr schedling fix day of month once ///////////////////////

        else if (destination == 'SCHEDULERBOX') {
            if (JobDetails.Rbox_JobID != null) {
                console.log("R-Box is scheduled  on I.P. " + iP +"  Job id: "+JobDetails.Rbox_JobID+ " on time " +dateValidateR);
                res.status(200).send("P-Box is scheduled  on I.P. " + iP +"  Job id: "+JobDetails.Rbox_JobID+ " on time " +dateValidateR);
            } else {
                console.log("R-Box is not scheduled  on I.P. " + iP );
                res.status(404).send("R-Box is not scheduled  on I.P. " + iP );
               
            } 
        }else{
            console.log("Destination not found !!! ");
            res.status(404).send(" Destination not found !!!");
        }
    })
        ////////////////////////////////////////////////////////////////////////////////////////////

        
function fetchDataFromDb() {
    var con = mysql.createConnection({
        ip: "127.0.0.1",
        user: "root",
        password: 'fantasticfourmadeacloud',
        database: "reboot"
    });
    con.connect(function (err) {
        if (err) {
            console.log('Error ', err);
        }
        else {
            con.query("SELECT ScheduleTime FROM schedule WHERE JobId =1", function (err, result, fields) {
                if (err) {
                    console.log("error ", err);
                } else {
                    let epochTime = JSON.stringify(result);
                    let getTime = epochTime.split(":");
                    let getTimeChange = getTime[1].replace(/"/g, "'");
                    let requireTime = getTimeChange.split("'");
                    let date = new Date(Number(requireTime[1]));
                    let myDate = date.getFullYear() + ' ' + (date.getMonth() + 1) + ' ' + date.getDate() + ' ' + date.getDay() +
                        ' ' + date.getHours() + ' ' + date.getMinutes() + ' ' + date.getSeconds();
                    let requireDate = myDate.split(" ");
                    let dbYear = JSON.stringify(requireDate[0]).replace(/"/g, "");
                    let dbMonth = JSON.stringify(requireDate[1]).replace(/"/g, "");
                    let dbDate = JSON.stringify(requireDate[2]).replace(/"/g, "");
                    let dbDay = JSON.stringify(requireDate[3]).replace(/"/g, "");
                    let dbHour = JSON.stringify(requireDate[4]).replace(/"/g, "");
                    let dbMinut = JSON.stringify(requireDate[5]).replace(/"/g, "");
                    let dbSec = JSON.stringify(requireDate[6]).replace(/"/g, "");

                    var finalDate = dbSec + ' ' + dbMinut + ' ' + dbHour + ' ' + dbDate + ' ' + dbMonth + ' ' + dbDay;
                    console.log('finalDate ', finalDate);
                    jobPbox = scheduler.schedule(finalDate, () => {

                        var child = cp.spawn('pm2', ['restart', 'ecosystem.config.js', '--env', 'production'],
                            { cwd: "/home/padmin/build/pm2_config" });
                        child.stdout.on('data', data => {
                            console.log('data', data.toString());
                        });
                        child.stderr.on('error', error => {
                            console.log('error', error);
                        });
                        console.log("P-Box is executed successfully on !!!");

                    });
                }
            });
        }
    });

}


//app.listen(port,"192.168.1.111", () => {
app.listen(port, config.ip, () => {
    console.log("Listing on port number : " + port + ' ' + 'of I.P. :' + config.ip);
});

