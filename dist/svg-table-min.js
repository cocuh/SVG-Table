// SVG-Table 1.0.0
// author: cocu
// license: Apache v2
// https://github.com/cocu/SVG-Table
Snap.plugin(function(a,b){b.prototype.css=function(a,b){return void 0!==b?(this.node.style[a]=b,this):this.node.style[a]},b.prototype.disableUserSelect=function(){return this.css("user-select","none").css("-moz-user-select","none").css("-webkit-user-select","none").css("-khtml-user-select","none").css("-ms-user-select","none"),this}}),Snap.plugin(function(a,b){var c=/[\r\n\f\s]+/,d=function(a){return a.trim().split(c)},e=function(a,b,e){var f=d(a);b=" "+b.replace(c," ")+" ";for(var g=f.length;g--;){var h=f[g]+" ",i=b.indexOf(" "+h);e?-1===i&&(b+=h):-1!==i&&(b=b.replace(h,""))}return b.trim()};b.prototype.toggleClass=function(a,b){if(void 0===b)for(var c=d(a),f=c.length;f--;){var g=c.indexOf(c[f])>=0;e(a,c[f],!g)}else b?this.addClass(a):this.removeClass(a);return this},b.prototype.addClass=function(a){return this.node.className.baseVal=e(a,this.node.className.baseVal,!0),this},b.prototype.removeClass=function(a){return this.node.className.baseVal=e(a,this.node.className.baseVal,!1),this},b.prototype.hasClass=function(a){a=" "+a+" ";var b=" "+this.node.className.baseVal+" ";return-1!=b.indexOf(a)},b.prototype.show=function(){return this.attr("display",""),this},b.prototype.hide=function(){return this.attr("display","none"),this},b.prototype.toggle=function(a){return void 0==a&&(a=this.attr(!1)),a=a?"":"none",this.attr("display",a),this}}),SVGCalendar=function(a,b,c){var d={start_date:new Date,end_date:null,day_num:null,week_num:4,day_name_height:30,day_name_transform:"translate(0, ${height})",start_day:"monday"},e={selecting:"selecting",active:"active",cell:"svg_cell",table:"svg_calendar",row_name:"row_name",column_name:"column_name",even_month:"even_month",odd_month:"odd_month",holiday:"holiday"},f=function(){var a=$.extend(!0,{},d);return $.extend(!0,a,c),a}();$.extend(!0,e,f.CLASSES),this.options=f;var g=function(a){return a=a.toLowerCase().slice(0,3),["sun","mon","tue","wed","thu","fri","sat"].indexOf(a)},h=function(a,b){return day_str=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][a%7],b&&(day_str=day_str.slice(0,3)),day_str},i=function(a,b){var c=Math.abs(a.getTime()-b.getTime());return Math.ceil(c/864e5)},j=new Date,k=f.start_date,l=function(){if(null===f.start_day)return k;var a=g(f.start_day),b=(j.getDay()+7-a)%7,c=new Date;return c.setDate(j.getDate()-b),c}(),m=function(){var a=new Date(k.getTime());return null!==f.end_date?f.end_date:null!==f.day_num?(a.setDate(a.getDate()+f.day_num),a):null!==f.week_num?(a.setDate(l.getDate()+7*f.week_num-1),a):void 0}(),n=function(){var a=(7+l.getDay()-1)%7,b=7-(m.getDay()-a)%7,c=new Date(m.getTime());return c.setDate(c.getDate()+b),c}(),o=Math.ceil(i(l,n)/7),p=new Array(7);!function(){for(var a=new Date(l.getTime()),b=0;o>b;b++){p[b]=new Array(7);for(var c=0;7>c;c++)p[b][c]=0==b&&0==c||1==a.getDate()?""+a.getMonth()+"/"+a.getDate():""+a.getDate(),a.setDate(a.getDate()+1)}}();var q=new Array(7);!function(){for(var a=l.getDay(),b=0;7>b;b++)q[b]=h(b+a)}();var r=function(a){var b=7*a.data("row")+a.data("col"),c=new Date(l.getTime()+24*b*60*60*1e3);a.data("date",c.getDate()).data("month",c.getMonth()).data("time",c.getTime()),a.addClass([e.even_month,e.odd_month][c.getMonth()%2]),(6==c.getDay()||0==c.getDay())&&a.addClass(e.holiday)},s={column_num:7,row_num:o,cell_texts:p,cell_texts_is_row_col:!0,CLASSES:e,column_names:q,column_name_height:f.day_name_height,column_name_text_transform:f.day_name_transform,select_mode:"horizontal",cell_hook:r};this.table=new SVGTable(a,b,s)},SVGCalendar.prototype.get_root_elem=function(){return this.table.get_root_elem()},SVGCalendar.prototype.get_active_dates=function(){for(var a=this.table.get_active_cells(),b=[],c=a.length;c--;){var d=new Date(a[c].data("time"));b.push(d)}return b},SVGTable=function(a,b,c){var d={cell_texts:null,cell_texts_is_row_col:!1,cell_text_transform:"translate(10,23)",row_num:null,row_heights:null,row_heights_is_ratio:null,cell_heights:null,cell_heights_is_ratio:null,column_num:null,column_widths:null,column_widths_is_ratio:null,column_names:null,column_name_height:0,column_name_text_transform:"",column_name_widths:null,column_name_widths_is_ratio:!1,row_names:null,row_name_text_offset:[0,0],row_name_text_transform:"",row_name_width:0,row_name_heights:null,row_name_heights_is_ratio:!1,select_mode:"horizontal",CLASSES:{},SELECT_MODE_DICT:{},select_cell:null,cell_hook:null},e="http://www.w3.org/2000/svg",f=this,g={selecting:"selecting",active:"active",cell:"svg_cell",table:"svg_table",row_name:"row_name",column_name:"column_name"},h={rectangle:function(a,b,c,d){var e=a.data("top"),f=a.data("left");return d.col_minX<=f&&f<d.col_maxX&&d.col_minY<=e&&e<d.col_maxY},horizontal:function(a,b,c,d){var e=null===i.column_num?i.column_widths.length:i.column_num,f=b+c*e,g=d.start_col+d.start_row*e,h=d.end_col+d.end_row*e;return f>=g&&h>=f||f>=h&&g>=f},vertical:function(a,b,c,d){var e=i.row_num,f=b*e+c,g=d.start_col*e+d.start_row,h=d.end_col*e+d.end_row;return f>=g&&h>=f||f>=h&&g>=f}},i=function(){var a=$.extend(!0,{},d);return $.extend(!0,a,c),a}();if($.extend(!0,g,i.CLASSES),$.extend(!0,h,i.SELECT_MODE_DICT),this.options=i,null===i.row_num&&null===i.row_heights&&null===i.cell_heights)throw"row length is not defined, add option (row_num or row_heights or cell_heights)";if(null===i.column_num&&null===i.column_widths)throw"column length is not defined, add option (column_num or column_width)";this.table_root=$("<div/>").height(b).width(a),this.svg_root=Snap(document.createElementNS(e,"svg")),this.svg_root.attr({width:a,height:b,"class":"svg_table",viewBox:"0 0 "+a+" "+b}),this.table_root.append(this.svg_root.node);var j={};j.clear_selecting=function(){var a,b;for(a=f.cells.length;a--;)for(b=f.cells[a].length;b--;)f.cells[a][b].removeClass(g.selecting)};var k=null;this.set_select_mode=function(a){k=h[a]},this.set_select_mode(i.select_mode),j.toggle_class=function(a,b,c){void 0===c&&(c=!f.cells[b.start_col][b.start_row].hasClass(a));var d,e;for(e=f.cells.length;e--;)for(d=f.cells[e].length;d--;){var g=k(f.cells[e][d],e,d,b);g&&f.cells[e][d].toggleClass(a,c)}};var l={start_col:0,end_col:0,start_row:0,end_row:0,startX:0,endX:0,startY:0,endY:0,minX:0,maxX:0,minY:0,maxY:0},m=function(a,b){return function(c){var d=function(){l.start_col=a,l.start_row=b},e=function(){l.end_col=a,l.end_row=b;var c=f.cells[l.start_col][l.start_row].data("top"),d=f.cells[l.end_col][l.end_row].data("top");l.col_minY=Math.min(c,d),l.col_maxY=Math.max(c+f.cells[l.start_col][l.start_row].data("height"),d+f.cells[l.end_col][l.end_row].data("height"));var e=f.cells[l.start_col][l.start_row].data("left"),g=f.cells[l.end_col][l.end_row].data("left");l.col_minX=Math.min(e,g),l.col_maxX=Math.max(e+f.cells[l.start_col][l.start_row].data("width"),g+f.cells[l.end_col][l.end_row].data("width"))};switch(c.type){case"mousedown":d(),e(),j.toggle_class(g.selecting,l,!0);break;case"mouseover":j.clear_selecting(),0!=c.buttons&&c.which%2!=0&&(e(),j.toggle_class(g.selecting,l,!0));break;case"mouseup":e(),j.clear_selecting(),j.toggle_class(g.active,l);break;case"mouseout":j.clear_selecting()}c.preventDefault()}};document.body.addEventListener("mouseup",j.clear_selecting),this.names_root=f.svg_root.g(),null!==i.column_names&&null!==i.row_names&&!function(){var a=f.names_root.g().addClass(g.table).addClass(g.cell);a.rect(0,0,i.row_name_width,i.column_name_height)}(),this.row_name_cells=new Array(this.row),null!==i.row_names&&!function(){for(var a=f.names_root.g(),c=i.row_name_width,d=i.column_name_height,e=0;e<i.row_names.length;e++){var h=a.g().addClass(g.table).addClass(g.row_name).addClass(g.cell);h.transform("translate(0,"+d+")"),f.row_name_cells[e]=h;var j=i.row_names[e],k=null===i.row_name_heights?(b-i.column_name_height)/i.row_names.length:i.row_name_heights[e];h.rect(0,0,c,k);var l=i.row_name_text_transform.replace("${width}",c).replace("${height}",k);h.text(0,0,j).transform(l).disableUserSelect(),d+=k}}(),this.column_name_cells=null,null!==i.column_names&&(this.column_name_cells=new Array(i.column_names.length),function(){for(var b=f.names_root.g(),c=i.column_name_height,d=i.row_name_width,e=0;e<i.column_names.length;e++){var h=b.g().addClass(g.table).addClass(g.column_name).addClass(g.cell);h.transform("translate("+d+",0)"),f.column_name_cells[e]=h;var j=i.column_names[e],k=function(){return null===i.column_name_widths?(a-i.row_name_width)/i.column_names.length:i.column_name_widths_is_ratio?i.column_name_widths[e]*(a-i.row_name_width)/i.column_name_widths.reduce(function(a,b){return a+b}):i.column_name_widths[e]}();h.rect(0,0,k,c);var l=i.column_name_text_transform.replace("${width}",k).replace("${height}",c);h.text(0,0,j).attr("transform",l).disableUserSelect(),d+=k}}()),this.cells_root=this.svg_root.group(),this.cells=new Array(i.column_num||i.column_widths.length),this.texts=new Array(this.cells.length),function(){var c,d,e,h,j,k,l,n=function(){return null===i.column_widths?function(){return(a-i.row_name_width)/i.column_names.length}:i.column_widths_is_ratio?function(b){return i.column_widths[b]*(a-i.row_name_width)/i.column_widths.reduce(function(a,b){return a+b})}:function(a){return i.column_widths[a]}}(),o=function(){if(null!==i.row_num)return function(){return(b-i.column_name_height)/i.row_num};if(null!==i.row_heights){if(i.row_heights_is_ratio){var a=i.row_heights.reduce(function(a,b){return a+b});return function(c,d){var e=i.row_heights[d]*(b-i.column_name_height)/a;return Math.round(e)}}return function(a,b){return i.row_heights[b]}}return i.cell_heights_is_ratio?function(a,c){var d=i.cell_heights[a].reduce(function(a,b){return a+b}),e=i.cell_heights[a][c]*(b-i.column_name_height)/d;return Math.round(e)}:function(a,b){return i.cell_heights[a][b]}}();c=null===i.row_names?0:i.row_name_width;for(var p=null===i.column_num?i.column_widths.length:i.column_num,q=0;p>q;q++){var r=null===i.row_num?null===i.row_heights?i.cell_heights[q].length:i.row_heights.length:i.row_num;d=null===i.column_names?0:i.column_name_height,h=n(q),f.cells[q]=new Array(r),f.texts[q]=new Array(r),k=f.cells_root.group().transform("translate("+c+")");for(var s=0;r>s;s++){var t=m(q,s);e=o(q,s),l=k.group().addClass(g.table).addClass(g.cell).transform("translate(0,"+d+")").data("col",q).data("row",s).data("left",c).data("top",d).data("width",h).data("height",e).mousedown(t).mouseover(t).mouseup(t),f.cells[q][s]=l,j=function(){return null===i.cell_texts?"":i.cell_texts_is_row_col?i.cell_texts[s][q]:void 0===i.cell_texts[q]?"":i.cell_texts[q][s]}(),l.rect(0,0,h,e),f.texts[q][s]=l.text(0,0,j).transform(i.cell_text_transform).disableUserSelect(),null!==i.cell_hook&&i.cell_hook(l),d+=e}c+=h}}(),this.get_active_cells=function(){for(var a=[],b=0;b<this.cells.length;b++)for(var c=0;c<this.cells[b].length;c++)this.cells[b][c].hasClass(g.active)&&a.push(this.cells[b][c]);return a}},SVGTable.prototype.get_root_elem=function(){return this.table_root.get(0)},SVGTimetable=function(a,b,c){var d={dates:null,start_date:new Date,day_num:10,detail_times:null,week_times:[[1e3,1100,1200,1300,1400,1500,1600,1700,1800,1900,2e3,2100,2200,2300],[840,955,1010,1125,1215,1330,1345,1500,1515,1630,1645,1800,1900,2e3,2100,2200,2300],[840,955,1010,1125,1215,1330,1345,1500,1515,1630,1645,1800,1900,2e3,2100,2200,2300],[840,955,1010,1125,1215,1330,1345,1500,1515,1630,1645,1800,1900,2e3,2100,2200,2300],[840,955,1010,1125,1215,1330,1345,1500,1515,1630,1645,1800,1900,2e3,2100,2200,2300],[840,955,1010,1125,1215,1330,1345,1500,1515,1630,1645,1800,1900,2e3,2100,2200,2300],[1e3,1100,1200,1300,1400,1500,1600,1700,1800,1900,2e3,2100,2200,2300]],times:null,times_is_minutes:!1,cell_hook:null},e=this,f={selecting:"selecting",active:"active",cell:"svg_cell",table:"svg_table",row_name:"row_name",column_name:"column_name",holiday:"holiday",sunday:"sunday",saturday:"saturday"},g=function(){var a=$.extend(!0,{},d);return $.extend(!0,a,c),a}();if($.extend(!0,f,g.CLASSES),this.options=g,null===g.times&&null===g.week_times&&null===g.detail_times)throw"times is undefined, set option (times or week_times or detail_times)";null===g.dates&&!function(){g.dates=[];for(var a=new Date(g.start_date.getTime()),b=0;b<g.day_num;b++)g.dates.push(new Date(a.getTime())),a.setDate(a.getDate()+1)}();var h=new Array(g.dates.length),i=new Array(g.dates.length);!function(){var a,b=function(){return null!==g.times?function(){return g.times}:null!==g.week_times?function(a,b){return g.week_times[b.getDay()]}:null!==g.detail_times?function(a){return g.detail_times[a]}:void 0}(),c=null,d=null;for(a=0;a<g.dates.length;a++){h[a]=[];var e=g.dates[a];i[a]=b(a,e);var f=i[a][0],j=i[a][i[a].length-1];(null===c||c>f)&&(c=f),(null===d||j>d)&&(d=j)}if(d===c)throw"times is invalid";var k,l=function(a){return 60*Math.floor(a/100)+a%100},m=function(a,b){if(g.times_is_minutes||(a=l(a),b=l(b)),a>b)throw"times is invalid";return b-a};for(a=0;a<g.dates.length;a++)for(i[a][0]!==c&&i[a].splice(0,0,c),i[a][i[a].length-1]!==d&&i[a].splice(i[a].length,0,d),k=0;k<i[a].length-1;k++)h[a].push(m(i[a][k],i[a][k+1]))}();var j=new Array(g.dates.length);!function(){for(var a=0;a<g.dates.length;a++){var b=g.dates[a];j[a]=""+b.getMonth()+"/"+b.getDate()}}();var k=function(a){var b=a.data("col"),c=a.data("row");a.data("date",g.dates[b]),a.data("start_time",i[b][c]),a.data("end_time",i[b][c+1]),0==a.data("date").getDay()&&(a.addClass(f.holiday),a.addClass(f.sunday)),6==a.data("date").getDay()&&(a.addClass(f.holiday),a.addClass(f.saturday)),null!==g.cell_hook&&g.cell_hook(a)},l={column_num:h.length,cell_heights:h,cell_heights_is_ratio:!0,column_names:j,column_name_height:25,column_name_text_transform:"translate(0,20)",cell_hook:k,select_mode:"rectangle"};this.table=new SVGTable(a,b,l),this.get_active_times=function(){for(var a=e.table.get_active_cells(),b={},c=0;c<a.length;c++){var d=a[c],f=d.data("start_time"),g=d.data("end_time"),h=d.data("date");void 0===b[h]&&(b[h]=[]);var i=b[h].length;i>=1&&b[h][i-1][1]==f?b[h][i-1][1]=g:b[h].push([f,g])}return b}},SVGTimetable.prototype.get_root_elem=function(){return this.table.get_root_elem()};