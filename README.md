# SQL-Chart 简单BI工具



## 一、简介
SQL-Chart，简单BI工具，执行SQL。然后将查询结果，进行图标和表格展示。现支持Druid和MySQL，但是可以通过开发插件，支持多种形式的数据源。简单实用。

## 二、运行
### 1、启动Server
#### demo 数据
```node index.js```
#### mysql 数据
```node index.js mysql```
#### druid 数据源
```node index.js druid```

### 2、访问
```
http://localhost:9090/index.html
```

## 三、开发
### 1、MySQL数据源
`server.js`
```
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
```
`client.js`
```
!function($,win){
	
	var url='http://127.0.0.1:9090/db/query';
	
	var query=function(sql){
		return execute(url,sql);
	};
	
	
	function execute(url,sql,method){
		return $.ajax({
			url: url,
	        type: method||'POST',
	        data:JSON.stringify({sql:sql}),
	        contentType: 'application/json',
	        dataType: 'json'
	   });
	}
	win.DBClient={query:query,type:'mysql'};
	
}(jQuery,window);

	
/**
 * data=[
 * 		  {x:x,y:y,legend:legend},
 *  	  {x:x,y:y,legend:legend},
 *  	  {x:x,y:y,legend:legend},
 *  	  {x:x,y:y,legend:legend},
 *  	  {x:x,y:y,legend:legend}
 *      ]
 */
	

```



