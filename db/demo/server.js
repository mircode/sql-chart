var Q=require('q');

var DBase={
    query:function(sql) {
    	
    	
        var data=[];
		for(var i=1;i<=12;i++){
			var x=i+'月';
			var y=Math.round(Math.random()*100);
			var legend='红队';
			data.push({x:x,y:y,legend:legend});
		}
		for(var i=1;i<=12;i++){
			var x=i+'月';
			var y=Math.round(Math.random()*100);
			var legend='蓝队';
			data.push({x:x,y:y,legend:legend});
		}
		
		// defer
		var defer=Q.defer();
     	defer.resolve(data);
		return defer.promise;
		
    }
}
module.exports=DBase;