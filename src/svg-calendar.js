SVGCalendar = function (root_width, root_height, i_options) {
    var DEFAULTS = {
        start_date: new Date()// Date : default is today

        //--- end_date
        , end_date: null// Date : default is today
        , day_num: null// int : active when end_date is null
        , week_num: 4// int : active when end_date and day_num is null
        
        //--- layouts
        , day_name_height: 30 // int
        , day_name_transform: 'translate(0, ${height})' // str

        //-- options
        , start_day: 'monday' // str or null : if null, calendar start today
    };
    var SVGNS = 'http://www.w3.org/2000/svg';
    var that = this;

    var CLASSES = {
        selecting: 'selecting',
        active: 'active',
        cell: 'svg_cell',
        table: 'svg_calendar',
        row_name: 'row_name',
        column_name: 'column_name',
        even_month:'even_month',
        odd_month:'odd_month',
        holiday: 'holiday'
    };


    // extend args d:jquery
    var args = (function () {
        var options = $.extend(true, {}, DEFAULTS);
        $.extend(true, options, i_options);
        return options;
    })();

    // args
    $.extend(true, CLASSES, args.CLASSES);
    this.options = args;


    // week of days
    var day2int = function (day_str) {
        // if invalid input, return -1
        day_str = day_str.toLowerCase().slice(0, 3);
        return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(day_str);
    };
    var int2day = function (day_int, is_short) {
        // if invalid input, return undefined
        day_str = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day_int%7];
        if(is_short){
            day_str = day_str.slice(0,3);
        }
        return day_str;
    };
    var get_date_delta_by_day = function (date1,date2) {
        var diff = Math.abs(date1.getTime() - date2.getTime());
        return Math.ceil(diff/(24*60*60*1000))
    };

    // today
    var today = new Date();

    //--- gen start and end
    // - assigned_start_date
    // - assigned_end_date
    // - table_start_date
    // - table_end_date
    var assigned_start_date = args.start_date;
    var table_start_date = (function () {
        if (args.start_day === null) {
            return assigned_start_date;
        }
        var week_of_day = day2int(args.start_day);
        var delta_day = (today.getDay() + 7 - week_of_day) % 7;
        var res_day = new Date();
        res_day.setDate(today.getDate() - delta_day);
        return res_day;
    })();
    var assigned_end_date = (function () {
        var res_date = new Date(assigned_start_date.getTime());
        if (args.end_date !== null) {
            return args.end_date;
        }
        if (args.day_num !== null) {
            res_date.setDate(res_date.getDate() + args.day_num);
            return res_date;
        }
        if (args.week_num !== null) {
            res_date.setDate(table_start_date.getDate() + 7 * args.week_num-1);
            return res_date;
        }
    })();
    var table_end_date = (function () {
        var last_week_of_day = (7 + table_start_date.getDay() - 1)%7;
        var delta_day = 7-(assigned_end_date.getDay() - last_week_of_day) % 7;
        var res_date = new Date(assigned_end_date.getTime());
        res_date.setDate(res_date.getDate() + delta_day);
        return res_date;
    })();
    
    var row_num = Math.ceil(get_date_delta_by_day(table_start_date, table_end_date)/7);
    
    // init calendar text value
    var cell_texts = new Array(7);
    (function(){
        var ptr_date = new Date(table_start_date.getTime());
        for(var row=0;row<row_num;row++){
            cell_texts[row] = new Array(7);
            for(var col=0;col<7;col++){
                if((row==0&&col==0) || ptr_date.getDate()==1){
                    cell_texts[row][col] = ""+ptr_date.getMonth()+"/"+ptr_date.getDate();
                }else{
                    cell_texts[row][col] = ""+ptr_date.getDate();
                }
                ptr_date.setDate(ptr_date.getDate()+1);
            }
        }
    })();
    
    // init column_name
    var column_names = new Array(7);
    (function(){
        var offset = table_start_date.getDay();
        for(var i = 0;i<7;i++){
            column_names[i] = int2day(i+offset)
        }
    })();
    
    var cell_hook = function (cell_elem) {
        var delta = cell_elem.data('row')*7+cell_elem.data('col');
        var date = new Date(table_start_date.getTime()+delta*24*60*60*1000);
        
        cell_elem.data('date', date.getDate()).data('month', date.getMonth()).data('time',date.getTime());
        
        cell_elem.addClass([CLASSES.even_month,CLASSES.odd_month][date.getMonth()%2]);
        if(date.getDay()==6 ||date.getDay()==0){
            cell_elem.addClass(CLASSES.holiday);
        }
    };

    // table options
    var table_options = {
        column_num:7,
        row_num:row_num,
        cell_texts: cell_texts,
        cell_texts_is_row_col:true,
        CLASSES:CLASSES,
        column_names: column_names,
        column_name_height: args.day_name_height,
        column_name_text_transform: args.day_name_transform,
        select_mode:'horizontal',
        cell_hook: cell_hook
    };
    
    // init table
    this.table = new SVGTable(root_width, root_height, table_options);
};

SVGCalendar.prototype.get_root_elem = function () {
    return this.table.get_root_elem();
};
SVGCalendar.prototype.get_active_dates = function(){
    var active_cells = this.table.get_active_cells();
    var active_dates = [];
    for(var i=active_cells.length;i--;){
        var date = new Date(active_cells[i].data('time'));
        active_dates.push(date)
    }
    return active_dates;
};