var fs=require('fs');
var express=require('express');
var bodyParser=require('body-parser');
var log=require("./log/log").logger('MAIN');

var server={
	config:function(){
		this.app=express();
		this.app.use(bodyParser.json()); 
		this.app.use(bodyParser.urlencoded({ extended: true })); 
		this.app.use(function(req, res, next) {
			  res.header('Access-Control-Allow-Origin', '*');
			  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
			  next();
		});
		
		
		log.info('[CONFIG] Access Control ....');
		return this;
	},
	load:function(db){
		this.dbname=db;
		var path='./'+this.dbname+'/server';
		this.db=require(path);
		
		log.info('[  LOAD] Load '+db+' Modual ....');
		return this;
	},
	start:function(port){
		
		var self=this;
		
		this.app.get('/db/health', function (req, res) {
			log.info('[ QUERY] Server is running ...');
	        res.status(200).json({msg:'health'});
			res.end();
	    });
	    
		this.app.get('/db/client', function(req, res){
			var path=self.dbname+'/client.js';
			log.info('[ QUERY] Load '+self.dbname+' Client ....');
			fs.readFile(path,function(err,contents) {
			    res.write(contents);
			    res.end();
			});
			
		});
		
		this.app.all('/db/query', function(req, res){
			
			if(req.method==='OPTIONS'){
				res.status(200).json({msg:'success'});
				res.end();
				return;
			}
			
			var sql=req.method==='GET'?req.query.sql:req.body.sql;
			log.info('[ QUERY] Method['+req.method+'] SQL:'+sql);
			if (typeof sql!=='string'){
			    res.status(400).json({msg:'sql must be a string'});
				res.end();
				return;
			}
			
			self.db.query(sql).then(function(data){
				log.info('[ QUERY] Method['+req.method+'] RES:'+JSON.stringify(data));
			  	res.json(data);
			  	res.end();
			}).catch(function(err){
                res.json([]);
			  	res.end();
             });;
			
		});
		this.app.listen(port);
		log.info('[ START] Rest Server Running ['+port+'] ....');
		return this;
	}
}

// main
var args=process.argv.splice(2);
server.config().load(args[0]||'demo').start(args[1]||'9090');

