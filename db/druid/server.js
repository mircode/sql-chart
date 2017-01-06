var Q=require('q');
var schema=require("./schema");
var plywood=require("plywood");
var chronoshift = require("chronoshift");
var requester=require("plywood-druid-requester");

var druid={
	
	connect:function(host){
		this.request=requester.druidRequesterFactory({
		    host:host,
		    timeout:30000,
		});
		return this;
	},
	schema:function(source){
		var self=this;
		var defer=Q.defer();
		self.tablemap=self.tablemap||{};
		
		if(!self.tablemap[source]){
			self.query('desc '+source,function(data){
				 var res=data.toJS();
				 var desc={table:source};
				 res.forEach(function(el){
				 	desc.name=el.Field;
				 	desc.type=el.Type;
				 })
				 self.tablemap[source]=desc;
				 defer.resolve(desc);
			});
		}else{
			defer.resolve(self.tablemap[source]);
		}
		return defer.promise;
	},
	query:function(sql,callback){
		// save this
		var self=this;
		// parse sql
		var sqlParse=plywood.Expression.parseSQL(sql);
		// timezone
		var timezone=chronoshift.Timezone.UTC;
		
		// create context
		var Promise=plywood.DruidExternal.getVersion(self.request)
            .then(function (version) {
            	var datasource=sqlParse?sqlParse.table:null;
            	var sourceList=datasource?Q([datasource]):plywood.DruidExternal.getSourceList(self.request);
            	
	            return sourceList.then(function (sources) {
	                var context = {};
	                return Q.all(sources.map(function (source) {
		                    return plywood.External.fromJS({
				                        engine: 'druid',
				                        version: version,
				                        source: source,
				                        allowEternity: true,
				                        allowSelectQueries: true,
				                    }, self.request).introspect();
	                })).then(function (introspecteds) {
	                    introspecteds.forEach(function (introspected){
	                        var source=introspected.source;
	                        context[source]=introspected;
	                        context['TABLE_NAME']=source;
	                        schema.addExternal(source, introspected,false);
	                    });
	                    context['SCHEMATA']=schema.getSchemataDataset();
	                    context['TABLES']=schema.getTablesDataset();
	                    context['COLUMNS']=schema.getColumnsDataset();
	                    return context;
	                });
	            });
        });
        // query
        Promise.then(function(context){
        	
        	// expression
        	var expression=sqlParse.expression,database=sqlParse.database;
		    if(database&&database.toLowerCase()==='information_schema') {
		        expression=upperCase(expression);
		    }
			expression.compute(context,{timezone:timezone}).done(callback);
			function upperCase(expression){
			    return expression.substitute(function(ex){
			        if (ex instanceof plywood.RefExpression) {
			            var v=ex.valueOf();
			            v.name=v.name.toUpperCase();
			            return new plywood.RefExpression(v);
			        }
			        return null;
			    });
			}
        });
	}
}
var conn=druid.connect('192.168.0.150:8082');

var DBase={
    query:function(sql) {
        var defer=Q.defer();
        
        var asmap={};
        sql=sql.replace(/,?\s*(['"])((?:(?!\1).)*)?\1\s+as\s+(\w+)\s*,?/ig,function(match,colons,field,alias){
        	asmap[alias]=field;
        	if(match.startsWith(',')&&match.endsWith(',')){
        		return ',';
        	}else if(match.startsWith(',')||match.endsWith(',')){
        		return '';
        	}else{
        		return '*';
        	}
        });
        console.info(sql);
        // 获取表结构信息
    	conn.query(sql,function(data,schema){
			var res=undefined;
            if(plywood.Dataset.isDataset(data)){
                res=data.toJS();
            }else{
                res=data;
            }
            if(res.forEach){
				res.forEach(function(el){
					for(var key in el){
						var value=el[key];
						if(typeof value==='object'&&value.type){
							if(value.type=='TIME'){
								el[key]=value.value;
							}else if(value.type=='TIME_RANGE'){
								el[key]=value.start+' to '+value.end;
							}
						}
					}
					for(var key in asmap){
						el[key]=asmap[key];
					}
				});
			}
            console.log(res);
            defer.resolve(res);
	    });
		
		        
		return defer.promise;
	 }
}
module.exports=DBase;