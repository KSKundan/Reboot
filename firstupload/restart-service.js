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
        //////////////////////////////////////////////////Pbox section////////////////
    }
    else if (destination == 'PBOX') {
        console.log("Entered ip ", iP);
	var con = mysql.createConnection({
		host	  : '127.0.0.1',
		port	  : '3306',
 		 user     : 'root',
 		 password : 'fantasticfourmadeacloud',
 		 database : 'reboot'
	});
	con.connect(function(err) { 		 
		if (err){
			console.log("error ", err);
		}
		else{
 		 console.log("Connected!");
  		 var sql ="INSERT INTO restartPbox (I_P) VALUES(?)";
 		 con.query(sql,iP, function (err, result) {
   			 if (err){
				console.log("error  ", err);
	       		}
   			 console.log("1 record inserted");
 		 });
		}
  		con.end();
	});
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
var weekJobDetails ={
	Scheduled_Job : " ",
	Scheduled_Period :" "
}
var monthDayJobDetails ={
	Scheduled_Job : " ",
	Scheduled_Period : " "
}
var monthDateJobDetails ={
	Scheduled_Job : " ",
	Scheduled_Period : " "
}
var	weekJobNumber =0,
	monthDayJobNumber =0,
	monthDateJobNumber=0
	jobPboxWeek =null,
	weekJobiP =null,
	monthDayJobiP =null,
	monthDateJobiP = null;
app.post('/schedulenow', (req, res) => {
    var destination = req.body.type;
    destination = destination.toUpperCase();
    var date = req.body.date;
    var month = req.body.month;
    var day = req.body.day;
    var execute = req.body.execute;
    var pboxIP = req.body.ip;
    console.log("Entered destination type ", destination);
    /////////////////////////////////////////P-BOX Scheduling /////////////////////////

    if (destination == 'SCHEDULEPBOX') {
        let dateMonth = null;
	let Job_Id = 0;
        console.log('date', date);
        console.log('month', month);
        console.log('day', day);
        console.log('execute', execute);
        console.log('day ', day);
 
        ///////////////////schedulig on fix day of each week in a given month /////////////////////1
        if ((date == 0) && ((month > 0) && (month < 13)) && (day != null)) {
            weekJobiP = pboxIP;
	    iP = pboxIP;
            dateMonth = month;
	    console.log(weekJobiP);            
            console.log('dateMonth ', dateMonth);
            let clockTime = '00 57 07';
            console.log('P-Box scheduled on each :', day, 'of each week in a month', month, 'on time :', clockTime);
	    let dateValidate = (clockTime + ' ' + '*' + ' ' + dateMonth + ' ' + day);
		++weekJobNumber ;
            console.log('dateValidate ', dateValidate);
	       weekJobDetails.Scheduled_Job = "Execute once in week on  "+ day ; 
        	weekJobDetails.Scheduled_Number = ++weekJobNumber; 
        	console.log("Job Details :", weekJobDetails.Scheduled_Job + ",  " +weekJobDetails.Scheduled_Number);
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
                schedulePboxExecuteStatusWeek = jobPboxWeek;
            console.log('Reboot request is accepted');
            res.status(200).send('Reboot request is accepted');
        }
        ////////////////////scheduling on first  fix day once in month///////////////////////////2
        
        else if ((date == 00) && (month == 0) && (day != null) && (execute == 'once')) {
	    monthDayJobiP = pboxIP
            console.log('P-Box scheduled on each first ', day, 'of each month');
            console.log('day ', day);
            console.log('month', month);
            let clockTime = '00 00 08';
	    ++ monthDayJobNumber;
	    console.log("P-Box on "+pboxIP+"  scheduled on each first ", day, " once  of each month on time :", clockTime );   
	    monthDayJobDetails.Scheduled_Job = "Execute once in week on  "+ day ; 
        	monthDayJobDetails.Scheduled_Number = ++weekJobNumber; 
        	console.log("Job Details :", monthDayJobDetails.Scheduled_Job + ",  " +monthDayJobDetails.Scheduled_Number);
	    let dateValidate = (clockTime + ' ' + '1-7 ' + ' ' + '1-12' + ' ' + day);
            console.log('dateValidate ', dateValidate);
            jobPbox = scheduler.schedule(dateValidate, () => {
            	var child = cp.spawn('pm2',['restart','ecosystem.config.js','--env', 'production'], {cwd:"/home/padmin/build/pm2_config"});
           	child.stdout.on('data', data =>{
			console.log('data', data.toString());
           	 });
	    	child.stderr.on('error', error =>{
			console.log('error', error);
	   	 });       
                console.log("reboot cmd run");
                schedulePboxExecuteStatusOnceDayMonth = res.statusCode;
              //if(schedulePboxExecuteStatusOnceDayMonth == null){
            });
            console.log('Reboot request is accepted');
            res.status(200).send('Reboot request is accepted');
        }

        /////////////////////////////Scheduling on fix date of month at fix time once in a month //////////////////////////
        else if ((date > 0) && ((month > 0) && (month < 13)) && (day == 0)) {
           monthDateJobip = pboxIP;
	   console.log('P-Box is scheduled on '+date+' of each month '); 
	    console.log('date ', date);
            console.log('month', month);
            let clockTime = '00 10 08';
	    ++monthDateJobNumber;
	    console.log("P-Box on "+pboxIP+" scheduled on ", date ," of each month at time  ",clockTime );
	    	
	      monthDateJobDetails.Scheduled_Job = "Execute once in month on  "+ date ; 
              monthDateJobDetails.Scheduled_Number = ++weekJobNumber; 
        	console.log("Job Details :", monthDateJobDetails.Scheduled_Job + ",  " +monthDateJobDetails.Scheduled_Number);
            let dateValidate = (clockTime + ' ' + ' ' + date + ' ' + month + '-12 ' + '*');
            console.log('dateValidate ', dateValidate);
            jobPbox = scheduler.schedule(dateValidate, () => {
            
           	 var child = cp.spawn('pm2',['restart','ecosystem.config.js','--env', 'production'], {cwd:"/home/padmin/build/pm2_config"});
            	 child.stdout.on('data', data =>{
	 		 console.log('data', data.toString());
           	 });
            	child.stderr.on('error', error =>{
	        	console.log('error', error);
           	 });       
                  schedulePboxExecuteStatusOnceDateMonth = res.statusCode;
           	 });
            	console.log('Reboot request is accepted');
            res.status(200).send('Reboot request is accepted')
        }
        else {
        console.log('Please check entered date and time value');
        res.status(404).send('Please check entered date and time value');
    }

///////////////////////////////////////STOP P-Box //////////////////////////////////////////////////

} else if (destination == 'STOPPBOX') {
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

