$(function(){
	
	// url
	var url=window.baseurl||'http://127.0.0.1:9090/db/client';
	
	// app
	var app={
		init:function(){
			var mode=$.DBase.getType()?'text/x-'+$.DBase.getType():'text/x-sql';
			var options={
		        lineNumbers: true,
		        mode:mode,
		        theme:'mdn-like',
		        styleActiveLine: true,
				matchBrackets: true
			};
			
			
			var $editor=$('[data-role="code"]')[0];
			var sql=localStorage.getItem('sql')||'select f1 as x,f2 as y,f3 as legend from table1';
			this.editor=CodeMirror.fromTextArea($editor,options);
			this.editor.setValue(sql);
			

			this.run(sql);
			return this;
		},
		tip:function(msg,type){
			new $.zui.Messager(msg, {
				 	placement: 'center',
				    cssClass:'messager-'+type||'info',
				    close: true
				}).show();
		},
		bind:function(){
			var self=this;
			$(document).on('click','[data-role]',function(){
				var func=$(this).attr('data-role');
				var param=$(this).attr('data-args')||{};
				self[func](param,this);
			});
		},
		save:function(){
			
			var support=document.createElement('a').download!==undefined;
	    	 if (support) {
	            a= document.createElement('a');
	            a.href='data:text/csv,' + this.csv.replace(/\n/g, '%0A');
	            a.target= '_blank';
	            a.download='查询结果.csv';
	            document.body.appendChild(a);
	            a.click();
	            a.remove();
	        }
	    	 
		},
		fold:function(param,target){
			if(this.foldstatus){
				$('.content').css({
					width:''
				});
				$('.editor').css({position:''}).animate({
					left:'0px'
				});
				this.foldstatus=false;
			}else{
				$('.editor').css({position:'absolute'}).animate({
					left:'-'+$(".editor").width()+'px'
				},'slow');
				$('.content').animate({
					width:'100%'
				});
				this.foldstatus=true;
			}
			
		},
		format:function(sql){
			try{
				sql=$.format(sql);
			}catch(err){
				console.info(err);
			}
			console.info(sql);
			return sql;
		},
		refresh:function(param,target){
			localStorage.removeItem("sql"); 
			var sql='select f1 as x,f2 as y,f3 as legend from table1';
			this.editor.setValue(this.format(sql));
			$(target).find('i').addClass('icon-spin');
			setTimeout(function(){$(target).find('i').removeClass('icon-spin');},1000);
		},
		run:function(){
			var sql=this.editor.getValue();
			this.label=undefined;
			this.editor.setValue(this.format(sql));
			localStorage.setItem("sql",this.format(sql));
			
			var self=this;
			$.DBase.query(sql,url).done(function(data){
				self.translate(data).done(self.context).done(self.table).done(self.chart);
			});
		},
		context:function(data){
			var height=data.table?'380px':'100%';
			$('.datachart').css({height:height});
			if(!data.table){
				$('.datatable').hide();
			}
			if(!data.chart){
				$('.datachart').hide();
			}
		},
		table:function(data){
			if(data.table){
				// clear
				$('.datatable').each(function(){
					$(this).data('zui.datatable',false);
				});
				$('.datatable').datatable({data:data.table});
			}
		},
		chart:function(data){
			if(data.chart){
				$('.datachart').datachart(data.chart);
			}
		},
		translate:function(data){
			
			if(!data||data.length<=0){
				this.tip('<i class="icon-remove-sign"></i>&nbsp;&nbsp;查询结果为空!','success');
				console.error('no data receive from server');
				return;
			}
			
			var table=translate_table(data);
			var chart=translate_chart(data);
			var csv=translate_csv(data);
			this.csv=csv;
			
			return $.Deferred().resolve({table:table,chart:chart});
			
			function translate_csv(table){
				var csv='';
				var itemDelimiter =',';
                var lineDelimiter ='\n';
                
                // 表头
                var row=[];
				for(var key in data[0]){
					row.push(key);
				}
				// 内容
				csv+=row.join(itemDelimiter)+lineDelimiter;
				for(var i in data){
					var row=[];
					for(var key in data[i]){
						row.push(data[i][key]);
					}
					csv+=row.join(itemDelimiter)+lineDelimiter;
				}
				return csv;
			}
			function translate_table(data){
				var table={
					cols:[],
					rows:[]
				}
				for(var key in data[0]){
					table.cols.push({text:key});
				}
				for(var i in data){
					var row=[];
					for(var key in data[i]){
						row.push(data[i][key]);
					}
					table.rows.push({data:row});
				}
				return table;
			}
			function translate_chart(data){
				var chart = {
				    labels: [],
				    datasets: []
				};
				// format check and translate
				var rows=[];
				var flag=false;
				for(var i in data){
					var x=data[i].x||data[i].X;
					var y=data[i].y||data[i].Y;
					var legend=data[i].legend||data[i].LEGEND||'图表';
					if(x&&y&&legend){
						var row={};
						row.x=x;
						row.y=y;
						row.legend=legend;
						flag=true;
						rows.push(row);
					}
				}
				if(flag==true){
					data=rows;
				}else{
					return undefined;
				}
				
				// label
				var labels=[];
				for(var i in data){
					var x=data[i].x;
					if(labels.indexOf(x)<0){
						labels.push(x);
					}
				}
				chart.labels=labels;
				
				// index
				var index={};
				for(var i in labels){
					for(var i in data){
						var x=data[i].x;
						var y=data[i].y;
						var legend=data[i].legend||'图表';
						if(index[legend]){
							index[legend][x]=y;
						}else{
							index[legend]={};	
						}
					}
				}
				// datasets
				for(var k in index){
					var label=k;
					var data=[];
					for(var i in labels){
						var value=index[k][labels[i]]||0;
						data.push(value);
					}
					chart.datasets.push({label:label,data:data});
				}
					
				return chart;
			}
		}
		
	};
	// 初始化
	app.init().bind();
});

// 数据库
!function($,win){
	$.DBase={
			query:function(sql,url){
				
				var split=sql.split(/\n/);
				for(var i in split){
					split[i]=split[i].replace(/(^\s*)|(\s*$)/g,"");
				}
			    sql=split.join(' ');
			    
			    console.info(sql);
			    
			    var self=this;
				if(win.DBClient){
					return win.DBClient.query(sql);
				}else{
					var deff=$.Deferred().resolve(self.mock(sql));
					$.getScript(url).done(function(){
						if(win.DBClient){
							deff=win.DBClient.query(sql);
						}
					})
					return deff;
				}
				
			},
			getType:function(){
				return (win.DBClient&&win.DBClient.type)||undefined;
			},
			mock:function(sql){
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
				return data;
				
			},
			reload:function(url,callback){
				$.getScript(url).done(callback);
			}
	};
}(jQuery,window);

// 图标插件
!function($){
	// color
	$.zui.Color.get=function(name){
		var basecolor=$.zui.Color.names;
		var filter=["chartreuse", "darkgray", "darksalmon", "deepskyblue", "green", "midnightblue", "mediumpurple", "purple", "skyblue", "turquoise", "chocolate", "darkgreen", "darkseagreen", "greenyellow", "lightgreen", "mediumseagreen", "red", "slateblue", "violet", "coral", "darkkhaki", "darkslateblue", "dodgerblue", "hotpink", "lightpink", "limegreen", "mediumslateblue", "navajowhite", "paleturquoise", "royalblue", "springgreen", "yellow", "yellowgreen", "steelblue", "saddlebrown", "palevioletred", "navy", "mediumspringgreen", "maroon", "indigo", "forestgreen", "darkslategray", "darkolivegreen", "darkmagenta", "crimson", "blue", "brown", "darkblue", "darkcyan", "darkred", "darkorchid", "mediumblue", "mediumvioletred", "seagreen", "mediumorchid", "gray"]
		
		var names={};
		for(var key in basecolor){
			if(filter.indexOf(key)>-1){
				names[key]=basecolor[key];
			}
		}
		if(!name){
			var cur=$.zui.Color.cur||0;
			var colors=[];
			for(var key in names){
				colors.push(key);
			}
			if(colors.length>0){
				name=colors[cur];
				cur++;
				if(cur===colors.length){
					cur=0;
				}
				$.zui.Color.cur=cur;
			}
		}
		
		var color=name.startsWith('#')?name:names[name];
		color=color||'#7cb5ec';
	    return new $.zui.Color(color).lighten(20);
	}
	
	// chart
	var Chart=function(dom,data,options){
		this.dom=dom;
		this.data=data;
		this.options=options;
		
		// legend
		var legend="<ul class='<%=name.toLowerCase()%>-legend'>"+
						"<li style=\"background-color:#9acd32\" data-bind=\"setOptions\" data-args=\"_label:all\">全部</li>"+
							"<% for (var i=0; i<datasets.length; i++){%>"+
								"<li style=\"background-color:<%=datasets[i].strokeColor%>\" data-bind=\"setOptions\" data-args=\"_label:<%=datasets[i].label%>\">"+
										"<%if(datasets[i].label){%>"+
											"<%=datasets[i].label%>"+
										"<%}%>"+
								"</li>"+
							"<%}%>"+
						"</ul>";
		
		// control btn				
		var control='<div class="chart-ctrl"><div class="btn-group">'+
					  '<button type="button" class="btn" data-bind="setOptions" data-args="_chart:barChart" style="background-color:#fff"><i class="icon icon-bar-chart"></i></button>'+
					  '<button type="button" class="btn" data-bind="setOptions" data-args="_chart:pieChart" style="background-color:#fff"><i class="icon icon-pie-chart"></i></button>'+
					  '<button type="button" class="btn" data-bind="setOptions" data-args="_chart:lineChart" style="background-color:#fff"><i class="icon icon-line-chart"></i></button>'+
					'</div></div>';
		
		
		// create chart
		this.options.legendTemplate=legend;
		$(this.dom).html('');
		$(this.dom).append('<canvas></canvas>');
		this.chart=$(this.dom).find('canvas').barChart(this.data,this.options);
		
		$(this.dom).append('<div class="chart-legend">'+this.chart.generateLegend()+'</div>');
		$(this.dom).append(control);
		
		this.bind();
	}
	Chart.prototype.setOptions=function(options){
		this.options=$.extend(this.options,options);
		this.redraw();
	}
	Chart.prototype.redraw=function(){
		$(this.dom).find('canvas').remove();
		$(this.dom).append('<canvas></canvas>');
		
		var tmp=jQuery.extend(true,{},this.data);
		// filter lable
		if(this.options._label && this.options._label!=='all'){
			var datasets=tmp.datasets;
			var newsets=[];
			for(var i in datasets){
				if(datasets[i].label===this.options._label){
					newsets.push(datasets[i]);
				}
			}
			if(newsets.length>0){
				tmp.datasets=newsets;
			}
		}
		if(this.options._chart==='pieChart'){
			var pieData=[];
			var sum=0;
			tmp.labels.forEach(function(item,i){
				tmp.datasets.forEach(function(k,j){
					sum+=k.data[i];
				});
			});
			tmp.labels.forEach(function(item,i){
				var ele={};
				ele.label=item;
				ele.value=0;
				tmp.datasets.forEach(function(k,j){
					ele.value+=k.data[i];
				});
				ele.value=Math.round(ele.value*100/sum);
				pieData.push(ele);
			});
			tmp=pieData;
			this.options.scaleShowLabels=true;
		}
		this.chart=$(this.dom).find('canvas')[this.options._chart||'barChart'](tmp,this.options);
		
		
	}
	Chart.prototype.bind=function(){
		var self=this;
		$(this.dom).on('click','[data-bind]',function(){
			var func=$(this).attr('data-bind');
			var args=$(this).attr('data-args');
			var options={};
			var args=args.split(',');
			for (var i in args){
				var _key=args[i].split(':')[0];
				var value=args[i].split(':')[1];
				options[_key]=value;
			}
			self[func](options);
		});
	}
	$.fn.datachart=function(data,options){
		this.each(function(i,dom){
			new Chart(dom,data,options||{});// dom对象 图标类型 数据配置
		});
	}
}(jQuery);


!function($){
	var SqlFormat={
		defualt:{
			keywords:'select|from|where|join|on|group by|having|order by|limit|left join|right join|inner join|outer join|'+
			      	 'delete from|insert into|values|update|set|'+
			      	 'create table|drop table|alert table|add',
			uppercase:'as|asc|desc|like|is|null|not|in|and|or',
			hock:{
				// 默认格式化,逗号分隔
				'default_format':function(str,offset){
					var pre=new Array(offset).join(' ');
					return str.replace(/\(.*?\)/ig,function(match){
									return match.replace(/,/ig,'_#');
								})
					           .replace(/,/ig,',\n'+pre)
							   .replace(/\_#/ig,',');
				},
				'select':function(str,offset){
					return this.default_format(str,offset);
				},
				'set':function(str,offset){
					return this.default_format(str,offset);
				},
				'add':function(str,offset){
					return this.default_format(str,offset);
				},
				'create table':function(str,offset){
					var pre=new Array(offset+str.indexOf('(')).join(' ');
					return str.replace(/,/ig,',\n'+pre);
				},
				'where':function(str,offset){
					var keywords='and|or';
					var off_info=SqlFormat.maxoffset(str,keywords);
					var maxoffset=off_info.offset;
					var num=off_info.num;
					
					// 如果关键子出现的次数小于2直接返回字符串,不格式化
					if(num<2) return str;
					
					var subs=SqlFormat.child(str,'(');
					str=subs.target;
					
					// format 							
					str=str.replace(new RegExp(keywords,'ig'),function(match){
						var z=0;
						if(match.length){
							z=maxoffset-match.length;
						}
						var pre=new Array(offset+z).join(' ');
						return '\n'+pre+match;
					})
					
					// format child
					maxoffset=maxoffset+offset;
					for(var key in subs.sub){
						var sub=this.where(subs.sub[key].replace(/\((.*)\)/ig,'$1'),maxoffset+2);
						var pre=new Array(maxoffset+2).join(' ');
						str=str.replace(key,'(\n'+pre+sub+'\n'+pre+')');
					}
					
					return str;
					
				}
			}
		},
		getOptions:function(options){
			options=options||{};
			
			this.defualt.uppercase=this.defualt.keywords+'|'+this.defualt.uppercase;
			if(options.keywords){
				this.defualt.keywords+='|'+options.keywords;	
			}
			if(options.uppercase){
				this.defualt.uppercase+='|'+options.uppercase;	
			}
			for(var key in options.hock){
				this.defualt.hock[key]=options.hock[key];
			}
			return this.defualt;
		},
		format:function(sql,options,offset){
			
			var options=this.getOptions(options);
			
			var keywords=options.keywords;
			var uppercase=options.uppercase;
			var hock=options.hock;
			
			// format inline
			var sql=sql.replace(/^\s+|\s+$|;/ig,'')
						.replace(/\n/ig,'')
						.replace(/\s+/ig,' ')
						.replace(/\(\s*(select)/ig,'($1');
			
			var subsql=this.child(sql,'(select');
			sql=subsql.target;
			
			// max offset
			var max_offset=this.maxoffset(sql,keywords).offset;
			max_offset+=(offset||0);
			
			// format
			var i=0;
			sql=sql.replace(new RegExp(keywords,'ig'),'}$&{').substring(1).concat('}')
			   .replace(new RegExp('('+keywords+'){(.*?)}','ig'),function(match,func,args){
			   		var pre=new Array(max_offset-func.length+1).join(' ');
					return (++i>1?'\n':'')+pre+func+(hock[func.toLowerCase()]?hock[func.toLowerCase()](args,max_offset+2):args);
				});
			
			// child replace
			if(subsql.child){
				for(var key in subsql.sub){
					// format child
					var sub=this.format(subsql.sub[key].replace(/\((.*)\)/ig,'$1'),options,max_offset+2);
					// replace child
					sql=sql.replace(key,'('+sub.replace(/\s+select/ig,'select')+')');
				}
			}
			if(uppercase){
				sql=sql.replace(new RegExp('('+uppercase+')\\s+','ig'),function(match){
					return match.toUpperCase();
				});
			}
			return sql;
		},
		maxoffset:function(str,keywords){
			var max_offset=0;
			var i=0;
			str.replace(new RegExp(keywords,'ig'),function(match){
				i++;
				if(max_offset<match.length){
					max_offset=match.length;
				}
			});
			return {offset:max_offset,num:i};
		},
		// 获取嵌套子串,嵌套select和where条件 
		child:function(str,search){ 
			var res=[];
	     	var start=str.indexOf(search);
			var end=start;
			while(start>-1 && start<str.length){
				var deep=0;
				var sub='';
				for(var i=start;i<str.length;i++){
					var c=str[i];
					sub+=c;
					if(c==='('){
						deep++;
					}else if(c===')'){
						deep--;
					}
					if(deep==0){
						end=i;
						break;
					}
				}
				if(deep!==0){
					throw new error("str format error brackets not match");
					break;
				}
				res.push(sub);
				start=str.indexOf(search,end);
				end=start;
			}
			
			// 替换子串并返回映射关系
			var mapsub={target:str,child:false,sub:{}};
			for(var i in res){
				var j=i;
				mapsub.target=mapsub.target.replace(res[i],function(match){
					j++;
					mapsub.sub['__sub'+j]=match;
					mapsub.child=true;
					return '__sub'+j;
				});
			}
			
			return mapsub;
			
		}
	}
	$.format=function(sql,options){
		return SqlFormat.format(sql,options);
	}
}(jQuery);
