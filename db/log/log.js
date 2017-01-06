var fs=require('fs');
var path=require('path');
var log4js=require('log4js');



exports.logger=function(name){
	
	var logPath=path.join(__dirname,'logs/');
    if(!fs.existsSync(logPath) ){ 
    	fs.mkdirSync(logPath);
    }
    
	log4js.configure(path.join(__dirname, 'log.json'));
    
    var dateFileLog = log4js.getLogger(name);
    dateFileLog.setLevel(log4js.levels.INFO);
    
    return dateFileLog;
}
