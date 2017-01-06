var Q=require('q');
var mysql=require('mysql');
var config={    
			host:'127.0.0.1',       
			user:'root',               
			password:'root',
			port: '3306',
			database:'perftrace'
};
var conn=mysql.createConnection(config);
conn.connect();
//conn.end();

var DBase={
    query:function(sql) {
        var defer=Q.defer();
		conn.query(sql, function(err, rows, fields) {
			if(err){
				defer.reject(err);
			}else{
				defer.resolve(rows);
			}
		}); 
		return defer.promise;
	 }
}
module.exports=DBase;