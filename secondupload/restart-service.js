const express = require('express');
var scheduler = require('node-cron');
const cp = require('child_process');
const moment = require('moment');
const request = require('request');
const mysql   = require('mysql');
const dateFromNum = require('date-from-num')
const app = express();
app.use(express.json());
const port = process.env.PORT || 6010 ;
app.use(express.json());
var jobPbox = null;
var executionDateTimePboxScheduleWeek = null, schedulePboxExecuteStatusWeek = null;
    executionDateTimePboxScheduleDayMonth = null, schedulePboxExecuteStatusOnceDateMonth = null,
    executionDateTimePboxScheduleDateMonth = null, schedulePboxExecuteStatusOnceDayMonth = null;
///////////////////////////////////////Executenow section /////////////////////////////
app.post('/executenow', (req, res) => {
    var destination = req.body.type;
    destination = destination.toUpperCase();
    var user = req.body.user;
    var password = req.body.password;
    var iP = req.body.ip;
    var id =0
    console.log("Entered destination type ", destination);
    //////////////////////////////////R-Box section///////////////////////////////////////////
    if (destination == 'RBOX') {
            request.post('http://' + iP +':3200'+ '/restart', {
                json: {
                    "user": user,
                    "password": password,
		    "iP" : iP,
		    "jobId" : ++ id
                }
            }, (error, response, body) => {
                console.log('esponse.statusCode', response.statusCode);
                let responseValue = response.statusCode;
                executeStatusRbox1 = response.statusCode;
                if (responseValue == 200) {
                    console.log("R-Box on I.P."+iP+" is executed successfully  !!!");
                   res.status(200).send("R-Box on I.P."+iP+" is executed successfully  !!!");
                }
                else if (responseValue == 400) {
                    console.log("R-Box on I.P."+ iP+" is not executed successfully  !!!");
                    res.status(400).send("R-Box on I.P. "+iP+ " is not executed successfully !!!");
                } else {
                    console.log("Request for R-Box on " +iP+ " execution not found   !!!");
                   res.status(404).send("Request for R-Box on "+iP+"execution not found  !!!");
                }
                if (error) {
                    console.log(error);
                }
                console.log('statusCode ', res.statusCode);
                console.log('body ', body);
            })
	}
        //////////////////////////////////////////////////Pbox section////////////////

    else if (destination == 'PBOX') {
        console.log("Entered ip ", iP);
       var child = cp.spawn('pm2',['restart','ecosystem.config.js','--env', 'production'], {cwd:"/home/padmin/build/pm2_config"});
	child.stdout.on('data', data =>{
		console.log('data', data.toString());
	});
	child.stderr.on('error', error =>{
		console.log('error', error);
	});       
	console.log("P-Box is executed successfully !!!");
        res.status(200).send("P-Box is executed successfully !!!");
    }
    else {
        console.log("Request not matched !!!");
        res.status(404).send.json("Request not matched !!!");
    }
});


///////////////////////////////Schedulenow Section /////////////////////////////////////////
var JobDetails ={
	Scheduled_Job : " ",
	Scheduled_JobID :" "
}
	
app.post('/schedulenow', (req, res) => {
    var destination = req.body.type;
    destination = destination.toUpperCase();
    var date = req.body.date;
    var month = req.body.month;
    var day = req.body.day;
    var execute = req.body.execute;
    var iP = req.body.ip;
    var hour = req.body.hour;
    var minut = req.body.minut; 
    console.log("Entered destination type ", destination);
    /////////////////////////////////////////P-BOX Scheduling /////////////////////////

    if (destination == 'SCHEDULEPBOX') {
        console.log('date', date);
        console.log('month', month);
        console.log('day', day);
        console.log('execute', execute);
        console.log('day ', day);
 
        ///////////////////schedulig on fix day of each week in a given month ////////////////////
            console.log('P-Box scheduled on each :', day, 'of each week in a month', month, 'on time :', hour+ ':'+minut);
	    let dateValidate = (minut +' '+hour + ' ' + date + ' ' + month + ' ' + day);
	
            console.log('dateValidate ', dateValidate);
	        JobDetails.Scheduled_Job = "Execute once in week on  "+ day ; 
        	JobDetails.Scheduled_Number = ++weekJobNumber; 
        	console.log("Job Details :", JobDetails.Scheduled_Job + ",  " +JobDetails.Scheduled_Number);
            jobPboxWeek = scheduler.schedule(dateValidate, () => {
            var child = cp.spawn('pm2',['restart','ecosystem.config.js','--env', 'production'], {cwd:"/home/padmin/build/pm2_config"});
	    child.stdout.on('data', data =>{
		console.log('data', data.toString());
	       });
	    child.stderr.on('error', error =>{
		console.log('error', error);
        	});       
                console.log("reboot cmd run");
            });
                schedulePboxExecuteStatu = jobPbox;
            console.log('Reboot request is accepted');
            res.status(200).send('Reboot request is accepted');

      }else if(destination == 'SCHEDULERBOX'){
	
	    let dateValidate = (minut +' '+hour + ' ' + date + ' ' + month + ' ' + day);
		console.log(iP);
            console.log('dateValidate ', dateValidate);
	        JobDetails.Scheduled_Job = "Execute once in week on  "+ day ; 
        	JobDetails.Scheduled_JonID = 1; 
        	console.log("Job Details :", JobDetails.Scheduled_Job + ",  " +JobDetails.Scheduled_Number);
           
	    jobPboxWeek = scheduler.schedule(dateValidate, () => {
            request.post('http://' + iP +':3200'+ '/restart', {
                json: {
                    "user": user,
                    "password": password,
		    "iP" : iP,
		    "jobId" : ++ id
                }
            }, (error, response, body) => {
                console.log('esponse.statusCode', response.statusCode);
                let responseValue = response.statusCode;
                executeStatusRbox1 = response.statusCode;
                if (responseValue == 200) {
                    console.log("R-Box on I.P."+iP+" is executed successfully  !!!");
                   res.status(200).send("R-Box on I.P."+iP+" is executed successfully  !!!");
                }
                else if (responseValue == 400) {
                    console.log("R-Box on I.P."+ iP+" is not executed successfully  !!!");
                    res.status(400).send("R-Box on I.P. "+iP+ " is not executed successfully !!!");
                } else {
                    console.log("Request for R-Box on " +iP+ " execution not found   !!!");
                   res.status(404).send("Request for R-Box on "+iP+"execution not found  !!!");
                }
                if (error) {
                    console.log(error);
                }
                console.log('statusCode ', res.statusCode);
                console.log('body ', body);
       	})
            })
	}else {
         console.log('Please check entered date and time value');
         res.status(404).send('Please check entered date and time value');
     }
     

});
///////////////////////////////////////STOP P-Box //////////////////////////////////////////////////
app.post('/cancel',(req,res)=>{
  if (destination == 'STOPPBOX') {
    if (jobPbox != null) {
        jobPbox.stop();
        jobPbox = null;
        console.log('Schedule job for P-Box is stopped successfully');
        res.status(200).send('Schedule job for P-Box is stopped successfully');
    } else {
        console.log('Schedule job for P-Box is not found');
        res.status(200).send('Schedule job for P-Box is not found');
    }
}
else {
    console.log("Request not matched !!!");
    res.status(404).send("Request not matched !!!");
}
});

////////////////////////////////////////RETRIVE SECTION ///////////////////////////
app.post('/retrivenow', (req, res) => {
    var responseFromServerExecutStatus = null;
    var destination = req.body.type;
    destination = destination.toUpperCase();
    let iP = req.body.ip;
    var access = req.body.access;
    access = access.toUpperCase();

    if (destination == 'RETRIVENOW') {
        //////////////////////////retrivr schedling fix day of week once ///////////////////////
        if (access =='WEEK') {
            if (schedulePboxExecuteStatusWeek != null) {
                console.log("Execution of scheduled P-Box found successful on I.P. " +iP +
                    " Job-Details: " + weekJobDetails.Scheduled_Job + ",Job I.D. " +weekJobDetails.Scheduled_Number);
                res.status(200).send("Execution of scheduled P-Box found successful on I.P. " + iP +
                    "Job Details :" + weekJobDetails.Scheduled_Job + ",Job I.D. " + weekJobDetails.Scheduled_Number);
            } else if (schedulePboxExecuteStatusWeek == null) {
                console.log("Execution of scheduled P-Box found not successful on I.P. " + iP +
                    "Job-Details: " + weekJobDetails.Scheduled_Job + ",Job I.D. " +weekJobDetails.Scheduled_Number);
                res.status(404).send("Execution of scheduled P-Box found not successful on I.P. " + iP +
                    " Job-Details: " + weekJobDetails.Scheduled_Job + ",  " + weekJobDetails.Scheduled_Number);
            } else {
                console.log(schedulePboxExecuteStatusWeek);
                console.log("Execution for scheduled P-Box not found ");
                res.status(404).send("Execution for scheduled P-Box not found ");
            }
        }
    
//////////////////////////retrivr schedling fix day of month once ///////////////////////

  	else if(access =='DAY'){
              if(schedulePboxExecuteStatusOnceDayMonth != null){
                	console.log("Execution of scheduled P-Box found successful on I.P. " +iP +
                   	 " Job-Details: " + monthDayJobDetails.Scheduled_Job + ",Job I.D. " + monthDayJobDetails.Scheduled_Number);
               	 	res.status(200).send("Execution of scheduled P-Box found successful on I.P. " + iP +
                	    " Job Details :" +monthDayJobDetails.Scheduled_Job + ",Job I.D. " + monthDayJobDetails.Scheduled_Number);
        	}else if (schedulePboxExecuteStatusOnceDayMonth == null) {
                	console.log("Execution of scheduled P-Box not found successful on I.P. " +iP +
                    	" Job-Details: " + monthDayJobDetails.Scheduled_Job + ",Job I.D. " +monthDayJobDetails.Scheduled_Number);
              		res.status(404).send("Execution of scheduled P-Box not found successful on I.P. " + iP +
                    	" Job-Details: " + monthDayJobDetails.Scheduled_Job + ",  " + monthDayJobDetails.Scheduled_Number);
            	} else {
			console.log(schedulePboxExecuteStatusOnceDayMonth);
			console.log("Execution for scheduled P-Box not found ");
                	res.status(404).send("Execution for scheduled P-Box not found ");
            	}
	}
        //////////////////////////retrivr schedling fix date of month once ///////////////////////
         else if(access == 'DATE'){
             if(schedulePboxExecuteStatusOnceDateMonth != null){
		console.log("Execution of scheduled P-Box found successful on I.P. " + iP +
                    " Job-Details: " + monthJobDetails.Scheduled_Job + ",Job I.D. " + monthJobDetails.Scheduled_Number);
               	    res.status(200).send("Execution of scheduled P-Box found successful on I.P. " +iP +
                    "  Job Details :" +monthDayJobDetails.Scheduled_Job + ",Job I.D. " + monthDayJobDetails.Scheduled_Number);
            } else if (schedulePboxExecuteStatusOnceDayMonth == null) {
               	 console.log("Execution of scheduled P-Box found not successful on I.P. " + iP +
                    "Job-Details: " + monthDayJobDetails.Scheduled_Job + ",Job I.D. " +monthDayJobDetails.Scheduled_Number);
                res.status(404).send("Execution of scheduled P-Box found not successful on I.P. " + monthDayJobiP +
                    " Job-Details: " + monthDayJobDetails.Scheduled_Job + ",  " + monthDayJobDetails.Scheduled_Number);
            } else {
                console.log(schedulePboxExecuteStatusOnceDayMonth);
                console.log("Execution for scheduled P-Box not found ");
                res.status(404).send("Execution for scheduled P-Box not found ");
            }
	}
	}
	else{
	console.log("Request not found on "+iP);
	res.status(404).send("Request not found on "+iP);
	}
})
//////////////////////////////////////////////////////////////////
//app.post('/schedule', (req, res)=>{

//	console.log("schedule block");    
function fetchDataFromDb(){
	 var con = mysql.createConnection({
	 ip : "127.0.0.1",  
 	 user: "root",
     	 password : 'fantasticfourmadeacloud',
     	 database: "reboot"
   	 });
   	 con.connect(function(err) {
		if(err){
			console.log('Error ', err);
		}
		else{
	     		 con.query("SELECT ScheduleTime FROM schedule WHERE JobId =1", function (err, result, fields) {
				if(err){
					console.log("error ", err);
				}else{
					let epochTime = JSON.stringify(result);
					let getTime =	epochTime.split(":");
					let getTimeChange = getTime[1].replace(/"/g, "'");
					let requireTime = getTimeChange.split("'");
					let date =new Date(Number(requireTime[1]));
					let myDate = date.getFullYear()+' '+ (date.getMonth()+1)+' '+date.getDate()+' '+date.getDay()+
						' '+date.getHours()+' '+date.getMinutes()+' '+date.getSeconds();
					let requireDate = myDate.split(" ");
					let dbYear =JSON.stringify(requireDate[0]).replace(/"/g,"");
					let dbMonth =JSON.stringify(requireDate[1]).replace(/"/g,"");
					let dbDate  = JSON.stringify(requireDate[2]).replace(/"/g,"");
					let dbDay   =JSON.stringify(requireDate[3]).replace(/"/g,"");
					let dbHour  = JSON.stringify(requireDate[4]).replace(/"/g,"");
					let dbMinut = JSON.stringify(requireDate[5]).replace(/"/g,"");
					let dbSec   = JSON.stringify(requireDate[6]).replace(/"/g,"");
				
					var finalDate = dbSec+' '+dbMinut+' '+dbHour+' '+dbDate+' '+dbMonth+' '+dbDay;
					console.log('finalDate ', finalDate);
					jobPbox = scheduler.schedule(finalDate, () => {
		
       						var child = cp.spawn('pm2',['restart','ecosystem.config.js','--env', 'production'],
									 {cwd:"/home/padmin/build/pm2_config"});
						child.stdout.on('data', data =>{
							console.log('data', data.toString());
						});
						child.stderr.on('error', error =>{
							console.log('error', error);
						});       
						console.log("P-Box is executed successfully on !!!");
			
					});
				}
     			 });
   		 }
	});

  }




//	 console.log('Reboot request is accepted');
  // 	 res.status(200).send('Reboot request is accepted');
//})




//app.listen(port,"192.168.1.111", () => {
app.listen(port,'172.16.50.145', () => {
    console.log("Listing on port number :172.16.50.145 " + port);
});

