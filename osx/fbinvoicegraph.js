var gDoneButton;

var gInfoButton;

var fbi = {
	
	restore : function(el) {
		if(el.oldValue && el.value === ''){
			el.value = el.oldValue;
		}
	},
	
	clear : function(el,def) {
		if(el.value === def) {
			el.oldValue = el.value;
			el.value = '';	
		}
	},
	
	init : function() {
		gDoneButton = new AppleGlassButton(document.getElementById("doneButton"), "OK", fbi.hidePrefs);

	    gInfoButton = new AppleInfoButton(document.getElementById("infoButton"), document.getElementById("front"), "black", "black", fbi.showPrefs);
		var data = fbi.getData();
	},
	
	showPrefs : function() {
	    var front = document.getElementById("front");
	    var back = document.getElementById("back");

	    if (window.widget) {
	        widget.prepareForTransition("ToBack");
	    }

	    front.style.display = "none";
	    back.style.display = "block";
	
		if(window.widget){
		    document.getElementById('url').value = widget.preferenceForKey("url") || 'url';
		   	document.getElementById('api').value = widget.preferenceForKey("api") || 'api token';
	
	        setTimeout('widget.performTransition();', 0);
	    }
	},
	
	hidePrefs : function()

	{

	    var front = document.getElementById("front");

	    var back = document.getElementById("back");



	    if (window.widget)

	        widget.prepareForTransition("ToFront");



	    back.style.display="none";

	    front.style.display="block";



	    if (window.widget) {
			widget.setPreferenceForKey(document.getElementById('url').value,"url");
	    	widget.setPreferenceForKey(document.getElementById('api').value,"api");
	        setTimeout ('widget.performTransition();', 0);
	    	fbi.getData();
		}
	},
	
	getData : function(){
		var login = null;
		var api = null;
		
		if(window.widget){
		    login = widget.preferenceForKey("url");
		    api = widget.preferenceForKey("api");
		}
		
		if(!login || !api){
			fbi.showPrefs();
			return;
		}
		
		var now = new Date();
		var oneYearAgo = now;
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
		oneYearAgo.setMonth(oneYearAgo.getMonth() + 1);
	
		var month = (oneYearAgo.getMonth() + 1).toString();
		month = month.length == 1 ? '0' + month : month;

		var stringDate = oneYearAgo.getFullYear() + '-' + month + '-' + oneYearAgo.getDate(); 

		var d = com.freshbooks.api.fetchFullList(login,api,'invoice',{date_from:stringDate},60000, function(returnValue){

			var results = [0,0,0,0,0,0,0,0,0,0,0,0];

			var month = oneYearAgo.getMonth();

			for(var i = 0; i < 12; i++) {
				
				month++;
				
				if(month == 13)
					month = 1;

				jQuery.each(returnValue.list, function(v){ 
					var d = returnValue.list[v].date.split('-')[1] * 1;
			
					if(d === month + 1) {	
						results[i] += parseFloat(returnValue.list[v].amount);
					}
				});
			}

			fbi.displayGraph(results);
		});
	},
	
	displayGraph : function(data) {
		
		var low = [];
		var med = [];
		var high = [];
		var all =  [];
		
		var highThresh = 3000;
		var lowThresh = 2000;
		var now = new Date();
		var oneYearAgo = now;
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
		oneYearAgo.setMonth(oneYearAgo.getMonth() + 1);
		var month = oneYearAgo.getMonth();

		for(var i = 0; i < 12; i++) {
			
			month++;
			
			if(month == 13)
				month = 1;
				
			var val = data[i];
			var t = 200;
			if(val <= lowThresh)
				low.push([month, val < t ? t : val]);
			else if(val >= highThresh)
				high.push([month, val < t ? t : val]);
			else
				med.push([month, val < t ? t : val]);
				
			all[month] = val;
		}
			
		var d = $.plot($("#graph"), [
		        {
					color: '#000000',
		            data: med,
		            bars: { barWidth: 0.5, show: true, lineWidth: 1, align: "center", fillColor: '#000000' },
		        },
				{
					color: '#ff0000',
		           	data: low,
		            bars: { barWidth: 0.5, show: true, lineWidth:1, align: "center", fillColor: '#ff0000' }
		        },
				{
					color: '#009900',
		           	data: high,
		            bars: { barWidth: 0.5, show: true , lineWidth: 1, align: "center", fillColor: '#009900' }
		        }
		], {	
			grid: {
				  labelMargin:0, backgroundColor:'#ffffff', color: '#ffffff',tickColor: '#ffffff'
			},
			   xaxis:{ labelWidth: 0, labelHeight: 0, ticks: 0,autoscaleMargin:0 },
			   yaxis:{ labelWidth: 0, labelHeight: 0, ticks: 0,autoscaleMargin:0 }
			
		});
		
		var tm = all[all.length - 1];
		var lm = all[all.length - 2];
		
		var lmc = '';
		var ytmc = '';
		
		if(lm <= lowThresh)
			lmc = 'bad';
		else if(lm >= highThresh)
			lmc = 'good';
		else
			lmc = 'ok';
		
		if(tm <= lowThresh)
			tmc = 'bad';
		else if(tm >= highThresh)
			tmc = 'good';
		else
			tmc = 'ok';

		$('#thisMonth').text(tm).addClass(tmc);
		$('#lastMonth').text(lm).addClass(lmc);
	}
};

$(document).ready(function(){
	fbi.init();
});