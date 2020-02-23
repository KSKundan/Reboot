const express = require('express');
const scheduler = require('node-cron');
const cp = require('child_process');
const request = require('request');
const config = require('./config.js');
const settings = require('./settings.json');
const mysql = require('mysql')
const app = express();
const port = settings.portPbox;
app.use(express.json());

var JobDetails = {
    Pbox_Job: {
        'Host': 'localhost',
        'Data': null,
        'scheduleDate': null,
        'ID': null
    },
    Rbox_Job: {
        'IP': null,
        'Data': null,
        'scheduleDate': null,
        'ID': null
    },
}

var fetchDbExecute = null;
var dbFetchStatus = null;
function fetchDataFromDb() {
    var con = mysql.createConnection({
        ip: settings.MYSQL_DB_HOST_IP,
        user: settings.MYSQL_DB_USER,
        password: settings.MYSQL_DB_PWD,
        database: settings.MYSQL_DB_NAME
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
                        dbFetchStatus = 'true';
                    } else {
                        dbFetchStatus = 'false';
                    }
                }
            })
        }
    })
}
fetchDataFromDb();

//Executenow section 

app.post('/executenow', (req, res) => {
    //R-Box section
    if (((req.body).hasOwnProperty('ip')) && ((req.body).hasOwnProperty('type'))) {

        if ((req.body.type).toUpperCase() == 'RBOX') {

            fetchDbExecute = fetchDataFromDb();//getting connected device information from db

            if (dbFetchStatus == 'true') {
                clearInterval(fetchDbExecute);
                request.get('http://' + req.body.ip + ':' + settings.portRbox + '/restart', (error, response, body) => {

                    if (error) {
                        console.log("request not executed successfully !!! ", error);
                        response.status(400).send('request not executed successfully !!!')
                    } else {
                        if (response.statusCode == 200) {
                            console.log("R-Box on I.P." + req.body.ip + " is executed successfully  !!!");
                            res.status(200).send("R-Box on I.P." + req.body.ip + " is executed successfully  !!!");
                        } else if (response.statusCode == 404) {
                            console.log("Request for R-Box on " + req.body.ip + " execution not found   !!!");
                            res.status(404).send("Request for R-Box on " + req.body.ip + "execution not found  !!!");
                        }
                    }
                })
            } else if (dbFetchStatus == 'false') {
                setInterval(fetchDbExecute, 300000, '');
            }
        } else {
            console.log("Request not found !!!");
            res.status(404).send('Request not found !!!')
        }
        //Pbox section

    } else if ((req.body).hasOwnProperty('type')) {
        var pboxError = null;
        if ((req.body.type).toUpperCase() == 'PBOX') {

            fetchDbExecute = fetchDataFromDb();//getting connected device information from db
            if (dbFetchStatus == 'true') {
                clearInterval(fetchDbExecute);
                //var child = cp.spawn('pm2', ['restart','ecosystem.config.js','--env', 'production'], { cwd: '/home/padmin/build/pm2_config'});
                //if(dbFetchVariable = 'true'){
                var child = cp.spawn('ls', ['-a'])
                child.stderr.on('error', error => {
                    console.log('error', error);
                    pboxError = 'error';
                });
                child.stdout.on('data', data => {
                    console.log('data', data.toString());
                })
                child.on('close', (code) => {
                    if (pboxError == 'error') {
                        console.log("P-Box is not executed  !!!");
                        res.status(400).send("P-Box is not executed !!!");
                    } else {
                        console.log("P-Box is executed successfully yesssssss!!!");
                        res.status(200).send("P-Box is executed successfully !!!");
                    }
                });
            } else if (dbFetchStatus == 'false') {
                setInterval(fetchDbExecute, 300000, '')
            }

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

    if (((req.body).hasOwnProperty('type')) && ((req.body).hasOwnProperty('minut')) && ((req.body).hasOwnProperty('hour')) && ((req.body).hasOwnProperty('date')) && ((req.body).hasOwnProperty('month')) && ((req.body).hasOwnProperty('day'))) {

        if (req.body.day == 'null') {
            req.body.day = '*';
        } else {
            req.body.date = '*',
                req.body.month = '*'
        }
        // rBox schedule
        if (((req.body.type).toUpperCase() == 'SCHEDULERBOX') && ((req.body).hasOwnProperty('rboxIP'))) {

            JobDetails.Rbox_Job.IP = req.body.rboxIP;
            JobDetails.Rbox_Job.scheduleDate = (req.body.minut + ' ' + req.body.hour + ' ' + req.body.date + ' ' + req.body.month + ' ' + req.body.day);
            var checkScheduler = scheduler.validate(JobDetails.Rbox_Job.scheduleDate);
            JobDetails.Rbox_Job.ID = JobDetails.Rbox_Job.scheduleDate + ' ' + JobDetails.Rbox_Job.IP;
            if (checkScheduler == false) {
                console.log('Process restart request on R-Box is not scheduled');
                res.status(404).send('Process restart request on R-Box is not scheduled');
            } else {
                console.log('Process restart request on R-Box on IP ' + JobDetails.Rbox_Job.IP + 'is scheduled on time ' + JobDetails.Rbox_Job.scheduleDate + ' with job ID : ' + JobDetails.Rbox_Job.ID);
                res.status(200).send('Process restart request on R-Box on IP ' + JobDetails.Rbox_Job.IP + 'is scheduled on time ' + JobDetails.Rbox_Job.scheduleDate + ' with job ID : ' + JobDetails.Rbox_Job.ID);

                JobDetails.Rbox_Job.Data = scheduler.schedule(JobDetails.Rbox_Job.scheduleDate, () => {

                    //request.get('http://' + req.body.rboxIP + ':' + settings.portRbox + '/restart',)
                    request.post('http://localhost' + ':' + settings.portRbox + '/restart')
                })
            }
            //pBOX Scheduling 
        } else if ((req.body.type).toUpperCase() == 'SCHEDULEPBOX') {

            JobDetails.Pbox_Job.scheduleDate = (req.body.minut + ' ' + req.body.hour + ' ' + req.body.date + ' ' + req.body.month + ' ' + req.body.day);
            JobDetails.Pbox_Job.ID = JobDetails.Pbox_Job.scheduleDate + ' ' + JobDetails.Pbox_Job.Host;
            var checkScheduler = scheduler.validate(JobDetails.Pbox_Job.scheduleDate);
            if (checkScheduler == false) {
                console.log('Request for P-Box on localhost is not accepted');
                res.status(404).send('Request for P-Box on localhost is not accepted');
            } else {
                fetchDbExecute = fetchDataFromDb();//getting connected device information from db
                if (dbFetchStatus == 'true') {
                    clearInterval(fetchDbExecute);

                    console.log('Process restart request for P-Box on ' + JobDetails.Pbox_Job.Host + ' is scheduled on ' + JobDetails.Pbox_Job.scheduleDate);
                    res.status(200).send('Process restart request for P-Box on ' + JobDetails.Pbox_Job.Host + ' is scheduled on ' + JobDetails.Pbox_Job.scheduleDate + ' with job ID :' + JobDetails.Pbox_Job.ID);

                    JobDetails.Pbox_Job.Data = scheduler.schedule(JobDetails.Pbox_Job.scheduleDate, () => {

                        //var child = cp.spawn('pm2', ['restart','ecosystem.config.js','--env', 'production'], { cwd: '/home/padmin/build/pm2_config'});
                        var child = cp.spawn('ls', ['-a'])
                        child.stderr.on('error', error => {
                            console.log('error', error);
                        });
                        child.stdout.on('data', data => {
                            console.log('data', data.toString());
                        })
                    });
                } else if (dbFetchStatus == 'false') {
                    setInterval(fetchDbExecute, 300000, '')
                }
            }
        } else {
            console.log('Request destination for process restart destination not matched !!!');
            res.status(400).send('Request destination for process restart  not matched !!!');
        }
    } else {
        console.log('One or more reqire data is missing gor process restart !!!');
        res.status(404).send('One or more reqire data is missing gor process restart !!!');
    }
});

//STOP Scetion 
app.post('/cancel', (req, res) => {

    //Stop R-Box 
    if ((req.body).hasOwnProperty('type')) {

        if (((req.body.type).toUpperCase() == 'STOPRBOX') && (JobDetails.Rbox_Job.IP == req.body.ip)) {

            JobDetails.Rbox_Job.Data.stop();
            console.log('Schedule process restart request on ' + JobDetails.Rbox_Job.scheduleDate + ' of R-Box on I.P' + JobDetails.Rbox_Job.IP + ' is canceled successfully');
            res.status(200).send('Schedule process restart request on ' + JobDetails.Rbox_Job.scheduleDate + ' of R-Box on I.P' + JobDetails.Rbox_Job.IP + ' is canceled successfully');
            JobDetails.Rbox_Job.Data = null;
            JobDetails.Rbox_Job.ID = null;
            JobDetails.Rbox_Job.scheduleDate = null;
            JobDetails.Rbox_Job.IP = null;
            //Stop P-Box
        } else if ((req.body.type).toUpperCase() == 'STOPPBOX') {

            JobDetails.Pbox_Job.Data.stop();
            console.log('Schedule process restart request on ' + JobDetails.Pbox_Job.scheduleDate + ' of P-Box on ' + JobDetails.Pbox_Job.Host + ' is canceled successfully');
            res.status(200).send('Schedule process restart request on ' + JobDetails.Pbox_Job.scheduleDate + ' of P-Box on ' + JobDetails.Pbox_Job.Host + ' is canceled successfully');
            JobDetails.Pbox_Job.Data = null;
            JobDetails.Pbox_Job.ID = null;
            JobDetails.Pbox_Job.scheduleDate = null;
            JobDetails.Pbox_Job.IP = null;

        } else {
            console.log("Required data for cancel request is missing  !!!");
            res.status(404).send("Required data for cancel request is missing  !!!");
        }
    } else {
        console.log("Required destination for cancel request not found !!!");
        res.status(404).send("Required destination for cancel request not found !!!");
    }

});

//RETRIVE SECTION 
app.post('/retrivenow', (req, res) => {

    var responseFromServer = null
    //retrive scheduling of all
    if (((req.body.type).toUpperCase() == 'ALL') && ((JobDetails.Rbox_Job.IP == req.body.ip) | (JobDetails.Pbox_Job.Host == 'localhost'))) {

        if ((JobDetails.Pbox_Job.ID != null) | (JobDetails.Rbox_Job.ID != null)) {

            if (JobDetails.Pbox_Job.ID != null) {
                console.log('in side 2nd if')
                responseFromServer = "P-Box is scheduled  on localhost. Time of schedule :" + JobDetails.Pbox_Job.scheduleDate;

            } else {
                responseFromServer = "P-Box is not scheduled    ! ";
            }

            if (JobDetails.Rbox_Job.ID != null) {
                console.log(responseFromServer + " R-Box is scheduled  on I.P. " + JobDetails.Rbox_Job.IP + ",  Job id: " + JobDetails.Rbox_Job.ID + " on time :" + JobDetails.Rbox_Job.scheduleDate);
                res.status(200).send(responseFromServer + " R-Box is scheduled  on I.P. " + JobDetails.Rbox_Job.IP + ",  Job id: " + JobDetails.Rbox_Job.ID + " on time :" + JobDetails.Rbox_Job.scheduleDate);

            } else {
                console.log(responseFromServer + " R-Box is not scheduled  on I.P. " + JobDetails.Rbox_Job.IP + " !");
                res.status(404).send(responseFromServer + " R-Box is not scheduled  on I.P. " + JobDetails.Rbox_Job.IP + " !");
            }

        } else {
            console.log("Request not found !!!");
            res.status(404).send("Request not found !!!");
        }
        //retrivr schedling of R-Box 
    } else if ((((req.body.type).toUpperCase()) == 'SCHEDULERBOX') && (JobDetails.Rbox_Job.IP == req.body.ip)) {
        if (JobDetails.Rbox_Job.ID != null) {
            console.log("R-Box is scheduled  on I.P. " + JobDetails.Rbox_Job.IP + ",  Job id: " + JobDetails.Rbox_Job.ID + ", on time: " + JobDetails.Rbox_Job.scheduleDate);
            res.status(200).send("R-Box is scheduled  on I.P. " + JobDetails.Rbox_Job.IP + ",  Job id: " + JobDetails.Rbox_Job.ID + ", on time: " + JobDetails.Rbox_Job.scheduleDate);
        } else {
            console.log("R-Box is not scheduled  !!!");
            res.status(404).send("R-Box is not scheduled  !!!");

        }
        //retrivr schedling of P-Box 
    } else if (((req.body.type).toUpperCase()) == 'SCHEDULEPBOX') {
        if (JobDetails.Pbox_Job.ID != null) {
            console.log("P-Box is scheduled  on localhost  on time " + JobDetails.Pbox_Job.scheduleDate);
            res.status(200).send("P-Box is scheduled  localhost on time " + JobDetails.Pbox_Job.scheduleDate);
        } else {
            console.log("P-Box is not scheduled  on localhost ");
            res.status(404).send("P-Box is not scheduled  on localhost");
        }

    } else {
        console.log("Destination not found !!! ");
        res.status(404).send(" Destination not found !!!");
    }
})

app.listen(port, () => {
    console.log("Listing on port number : " + port + ' ');
});

