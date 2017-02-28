(function ($) {
  $.getUrlParam = function (name) {
   var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
   var r = window.location.search.substr(1).match(reg);
   if (r != null) return unescape(r[2]); return null;
  };
  $.loadingPanel = function(){
	  return '<div class="spinner"><div class="spinner-container container1"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container2"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container3"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div></div>';
  };
  $.fn.serializeObject = function()  
  {  
     var o = {};  
     var a = this.serializeArray();  
     $.each(a, function() {  
         if (o[this.name]) {  
             if (!o[this.name].push) {  
                 o[this.name] = [o[this.name]];  
             }  
             o[this.name].push(this.value || '');  
         } else {  
             o[this.name] = this.value || '';  
         }  
     });  
     return o;  
  };
 })(jQuery);

(function(jq) {
	jq.fn.magicTable = function(option) {
		var url = option.url || '';
		var param = option.param || {};
		var path = option.path || '';
		var ajaxType = option.ajaxType || 'GET';
		var needParseJSON = option.needParseJSON || false;
		var needPage = option.needPage || false;
		var pageSize = option.pageSize || 10;
		var pageNumber = option.pageNumber || 1;
		
		var tmpl = option.tmpl || '';
		var container = $(this);
		if('' == url) {
			console.log('缺少url参数，请指定！');
			return ;
		}
		if('' == tmpl) {
			console.log('缺少tmpl参数，请指定tmpl模版容器！');
			return ;
		}
		if(needPage) {
			param.pageSize = pageSize;
			param.pageNumber = pageNumber;
			if(container.children("div.pageContainer").length <= 0 ) {
				container.append('<div class="pageContainer"></div>');
			}
		}
		if(ajaxType == 'POST' || ajaxType == 'post') {
			param = JSON.stringify(param);
		}
		getDataToFill(param);
		function getDataToFill(param) {
			$.ajax({ type : ajaxType, url : url, data : param, dataType:"json", 
				contentType: "application/json; charset=utf-8", 
				beforeSend:function(reData) {
					//增加加载中效果
					container.empty();
					container.append($.loadingPanel());
				},
				success:function(reData) {
					var pageCount = 1;
					if(reData.total) {
						pageCount = Math.ceil(reData.total/pageSize);
					}
					//按照路径拆分table所需数据
					if(path) {
						var pathArr = path.split(',');
						$.each(pathArr,function(i,v){
							reData = reData[v];
						});
					}
					if(reData) {
						if(needParseJSON) {
							reData = $.parseJSON(reData);
						}
						//tmpl解析生成html并载入到容器中
						container.empty();
						$(tmpl).tmpl({data:reData}).appendTo(container);
						
						if(needPage) {
							if($(".tcdPageCode").length<=0) {
								container.after('<div class="tcdPageCode"></div>');
								$(".tcdPageCode").createPage({
									pageCount:pageCount,
									current:pageNumber,
									backFn:function(p) {
										if(ajaxType == 'POST' || ajaxType == 'post') {
											param = $.parseJSON(param);
											param.pageNumber = p;
											param = JSON.stringify(param);
										}else{
											param.pageNumber = p;
										}
										getDataToFill(param);
									}
								});
							}
						}
					}else {
						container.empty();
						container.append('<p class="no-data">暂无数据</p>');
					}
				},
				error : function() {
				     alert("网络异常，请重试！");
				}
			});
		}
	};
})(jQuery);

/**
 * magicForm: 主要解决表单的异步交互问题的组件
 * 			可用于：1、标准的异步表单提交情形$("XXXForm").magicForm();即可
 * 				  2、表单的已有数据更改情形，$("XXXForm").magicForm({initUrl:'XXXurl'});即可
 * 				  3、条件查询页面form提交查询条件的情形,可于magicTable混合使用,
 					$("XXXForm").magicForm({type:'function',callBackFun:function(data){
												$("XXXTable").magicTable({url : '',param: data,path : 'result',needParseJSON: true,tmpl: '#tableTmpl'});
											}
										  });
 * option:
 * 		type			:类型-默认'url',可选填'function',给值方式可选用html5属性给值方法属性名为data-type
 * 		optBtn			:触发提交表单的元素-默认'.submit',可任意填写其他可触发元素的元素,给值方式可选用html5属性给值方法属性名为data-optBtn
 * 		initUrl			:初始化表单数据的请求地址-默认''(不初始化表单),可以填充任意可请求地址来初始化表单数据,给值方式可选用html5属性给值方法属性名为data-initUrl
 * 		callBackFun		:异步提交表单成功回调
 * 		callBackErrFun	:异步提交表单失败回调
 */
(function(jq) {
	jq.fn.magicForm = function(option) {
		var _this = $(this);
		option = option || {};
		var formType = option.type || _this.attr('data-type') || 'url';
		var optBtn = option.optBtn || _this.attr('data-optBtn') || '.submit';
		var initUrl = option.initUrl || _this.attr('data-initUrl') || '';
		var initData = option.initData || function(param){};
		var callBeforeFun = option.callBeforeFun || function(param){
			validateFun(_this);
		};
		var callBackFun = option.callBackFun || function(reData){
			if(reData && reData.data && reData.data.result) {
				alert(reData.data.result);
				parent.location.reload(); //刷新主页面
			}else {
				if(reData.code==200) {
					alert("操作成功！");
					parent.location.reload(); //刷新主页面
				}else {
					alert(reData.message);
				}
			}
		};
		var callBackErrFun = option.callBackErrFun || function(reData){
			if(reData && reData.responseText && reData.responseText.errorMessage) {
				alert(reData.responseText.errorMessage);
			}else if(reData && reData.errorMessage) {
				alert(reData.errorMessage);
			}
		};
		if(_this.find(optBtn).length<=0 && formType != 'fillData') { //仅填充数据，不需要触发按钮
			console.log(_this.find(optBtn));
			alert('optBtn配置错误，请填充正确的触发表单提交参数optBtn，默认.submit！');
		}
		if(initUrl != '') { //如果initUrl不为空，则需要初始化form数据
			$.ajax({
				type: 'GET',
				url: initUrl ,
				async : false,
				success: function(reData){
					if(reData.data) {
						reData = reData.data;
					}
					_this.find("input,select,label,textarea").each(function(i,v){
						var curControl = $(v);
						var curName = curControl.attr("data-name") || curControl.attr("name"); //有data-name以它为准，其他用name
						if(reData.hasOwnProperty(curName)) {
							if(curControl.prop("tagName").toLowerCase() == 'input') {
								if(curControl.attr("type")=="radio") {
									$("input[name='"+curControl.attr("name")+"'][value="+reData[curName]+"]").trigger('click'); 
								}else if(curControl.attr("type")=="checkbox") {
									$("input[name='"+curControl.attr("name")+"'][value="+reData[curName]+"]").trigger('click'); 
								}else {
									curControl.val(reData[curName]);
									if(curControl.attr("data-extend")) {
										var extend = curControl.attr("data-extend");
										$(extend).attr("src", reData[curName]);
									}
								}
							}else if(curControl.prop("tagName").toLowerCase() == 'select') {
								curControl.val(reData[curName]);
								curControl.trigger("change");
							}else if(curControl.prop("tagName").toLowerCase() == 'label') {
								curControl.text(reData[curName]);
								curControl.trigger("change");
							}else {
								curControl.val(reData[curName]);
							}
							
						}
					});
				}
			});
		}
		_this.find(optBtn).on('click', function() {
			initData('');
			if('url' == formType) {
				var url = _this.attr("action");
				$.ajax({
					type: 'POST',
					url: url ,
				    data: JSON.stringify( _this.serializeObject()) ,
				    beforeSend: function(){
						return callBeforeFun('');
					},
					success: function(reData){
						if(!$.isFunction(callBackFun)){
							console.log(window.callBackFun);
							alert('callBackFun配置错误，请填充正确的回调函数名称！');
						}
						callBackFun(reData);
					},
					error: function(reData){
						console.log(reData.responseText);
						if(!$.isFunction(callBackErrFun)){
							console.log(window.callBackErrFun);
							alert('callBackErrFun配置错误，请填充正确的回调函数名称！');
						}
						callBackErrFun($.parseJSON(reData.responseText));
					},
					resetForm: true,
					contentType: "application/json; charset=utf-8", 
					dataType:  'json'
				});
//				_this.ajaxSubmit({
//					
//				});
			}else if('function' == formType) {
				if(!$.isFunction(callBackFun)){
					console.log(window.callBackFun);
					alert('form action配置错误，请填充正确的回调函数名称！');
				}
				if(validateFun(_this)){
					callBackFun(_this.serializeObject());
				}
			}
			return false; //防止sumbit提交
		});
		
		
		function validateFun(obj){
			var flg = true;
			var needCheckItem = obj.find('[data-validate]:visible:enabled').not("[readonly]");
			$.each(needCheckItem, function(i, control){ //需要验证控件
				control = $(control);
				var validateArr = control.attr('data-validate').split(',');
				var errArr = control.attr('data-err').split(',');
				$.each(validateArr, function(j, validate){ //需要验证项目
					if(validate=='required') { //必输入项
						if(control.val() == '') {
							alert(errArr[j]);
							flg = false;
							return false;
						}
					}
				});
				if(!flg) {
					return false;
				}
			});
			return flg;
		};
	};
})(jQuery);

(function(jq) {
	jq.fn.linkedSelect = function(option) {
		option = option || {};
		var _this = $(this);
		if(!_this) return ;
		$.each(_this,function(i,v){
			var _this_cur = $(v);
			if(_this_cur.length>0) {
				//初始化
				var url = _this_cur.attr("data-url") || option.url;
				var path = _this_cur.attr("data-path") || '';
				var key = _this_cur.attr("data-key");
				var value = _this_cur.attr("data-value");
				var type = _this_cur.attr("data-type");
				var extend = _this_cur.attr("data-extend") || '';
				var needParseJSON = _this_cur.attr("data-needParseJSON")|| false;
				var firstValue = _this_cur.attr("data-firstValue") || '';
				var firstName = _this_cur.attr("data-firstName") || '';
				
				var param_str = "";
				if(_this_cur.attr("data-param")){
					param_str = _this_cur.attr("data-param");
				}
				var need_change = _this_cur.attr("next-change") || '';
				$.ajax({
					type: type,
					url: url+param_str,
					async : false,
				    beforeSubmit: function(){
				    	_this_cur.empty();
				    	_this_cur.append('<option value="">加载中...</option>');
					},
					success: function(reData){
						 if (needParseJSON) { 
				            	reData=$.parseJSON(reData);
				            }
							var fill_data = "";
							if(path) {
								var pathArr = path.split(',');
								$.each(pathArr,function(i,v){
									reData = reData[v];
								});
							}
							if(firstName) {
								fill_data+='<option value="'+firstValue+'">'+firstName+'</option>';
							}
							$.each(reData, function(k,v){
								if(extend) {
									fill_data+='<option value="'+v[key]+'" data-extend="'+v[extend]+'">'+v[value]+'</option>';
								}else {
									fill_data+='<option value="'+v[key]+'">'+v[value]+'</option>';
								}
							});
							_this_cur.empty().append(fill_data);
							call_init_child(_this_cur);
					},
					error : function() {
						if(firstName) {
							_this_cur.empty().append('<option value="'+firstValue+'">'+firstName+'</option>');
						}
					}
				});
				//END初始化
				
				//绑定级联事件
				_this_cur.on('change', function(){
					call_init_child($(this));
				});
				//END绑定级联事件
				function call_init_child(optObj) {
					var select_id = optObj.children('option:selected').val();
					if(need_change) { //存在联动
						var need_change_obj = $(need_change);
						need_change_obj.attr("data-param",select_id);
						need_change_obj.linkedSelect(); //初始化
						need_change_obj.change();
					}
				}
			}
		});
		
	};
})(jQuery);

/**
 * 初始化特殊的日历插件
 */
jQuery.extend({
	initSpecialCalendar : function (callBackFun) {
    	var _calendar_type = 1; //日历类型(1:月 2:季 3:年 4:任意) 默认月份 
		var opt_type='month';
		var param = {}; 
		var nowData = new Date();
		var curYear = nowData.getFullYear(); //当前年
		var curMonth = nowData.getMonth(); //当前月
		var curQuarter = Math.floor((curMonth%3==0?(curMonth/3):(curMonth/3+1))); //当前季
		var calendarBody = $(".calendar-body");
		var calendarCustom = $(".calendar-custom");
		
		var calendarBodyDate = $(".calendar-body .date");

		var monthCalculation = function(opt_type) { //月份计算函数
			if(opt_type=='-') {
				if(curMonth-1<0){curYear-=1;curMonth=11;}else{curMonth-=1;};
			}
			else if(opt_type=='+') {
				if(curMonth+1>=12){curYear+=1;curMonth=0;}else{curMonth+=1;};
			}
			param.year = curYear;
			param.month = curMonth+1;
			calendarBodyDate.text(curYear + "年" + (curMonth+1) + "月");
		};
		var quarterCalculation = function(opt_type) { //季计算函数
			if(opt_type=='-') {
				if(curQuarter-1<=0){curYear-=1;curQuarter=4;}else{curQuarter-=1;};
			}
			else if(opt_type=='+') {
				if(curQuarter+1>4){curYear+=1;curQuarter=1;}else{curQuarter+=1;};
			}
			param.year = curYear;
			param.quarter = curQuarter;
			calendarBodyDate.text(curYear + "年" + curQuarter + "季");
		};
		var yearCalculation = function(opt_type) { //年份计算函数
			if(opt_type=='-') {curYear-=1;}
			else if(opt_type=='+') {curYear+=1;}
			param.year = curYear;
			calendarBodyDate.text(curYear + "年");
		};

		var _calendar_Calculation = function(opt_type) { //左右操作计算 默认月份计算function，函数会计算当前操作任务，并将参数写入param，和将显示内容写入calendarBodyDate
			monthCalculation(opt_type);
		};

		param.year = curYear;
		param.month = curMonth+1;
		param.type = opt_type;
		callBackFun(param);
		calendarBodyDate.text(curYear + "年" + (curMonth+1) + "月"); //默认设置当前年月份为显示内容
		
		$(".calendar-tab span").on('click',function(){ //日历类型选择操作触发 默认月份
			var _this = $(this);
			if(_this.hasClass('month')) {
				calendarBody.show();
				calendarCustom.hide();
				_calendar_type = 1;
				opt_type = 'month';
				_calendar_Calculation = function(opt_type) {
					monthCalculation(opt_type);
				};
			}else if(_this.hasClass('quarter')) {
				calendarBody.show();
				calendarCustom.hide();
				_calendar_type = 2;
				opt_type = 'quarter';
				_calendar_Calculation = function(opt_type) {
					quarterCalculation(opt_type);
				};
			}else if(_this.hasClass('year')) {
				calendarBody.show();
				calendarCustom.hide();
				_calendar_type = 3;
				opt_type = 'year';
				_calendar_Calculation = function(opt_type) {
					yearCalculation(opt_type);
				};
			}else if(_this.hasClass('custom')) {
				calendarBody.hide();
				calendarCustom.show();
				_calendar_type = 4;
				opt_type = 'custom';
			}
			param.type = opt_type;
			_this.addClass('active').siblings().removeClass('active'); //日历类型更换选中
			_calendar_Calculation(''); //默认调用一次，换显示方式，不做加减计算
			if(_calendar_type != 4) {
				callBackFun(param);
			}
		});
		$(".calendar-body .opt").on('click', function(){ //左右操作触发
			var _this = $(this);
			if(_this.hasClass('opt-left')) { //left 减
				_calendar_Calculation('-');
			}else if(_this.hasClass('opt-right')) { //right 加
				_calendar_Calculation('+');
			}else {
				_calendar_Calculation('');
			}
			callBackFun(param);
		});
    }
});
//对Date的扩展，将 Date 转化为指定格式的String
//月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
//年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
//例子： 
//(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
//(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
 var o = {
     "M+": this.getMonth() + 1, //月份 
     "d+": this.getDate(), //日 
     "h+": this.getHours(), //小时 
     "m+": this.getMinutes(), //分 
     "s+": this.getSeconds(), //秒 
     "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
     "S": this.getMilliseconds() //毫秒 
 };
 if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
 for (var k in o)
 if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
 return fmt;
};