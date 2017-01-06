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
	
