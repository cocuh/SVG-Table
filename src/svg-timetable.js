SVGTimetable = function (root_width, root_height, i_options) {
    var DEFAULTS = {
        //---requires
        dates: null // list(Date) : not use hours, minutes, seconds.
        , start_date: new Date() // Date : not use hours, minutes, seconds.
        , day_num: 10 // int : day num

        //--- times
        , detail_times: null // list(list(int)) : 
        , week_times: [
            [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300],
            [ 840, 955, 1010, 1125, 1215, 1330, 1345, 1500, 1515, 1630, 1645, 1800, 1900, 2000, 2100, 2200, 2300],
            [ 840, 955, 1010, 1125, 1215, 1330, 1345, 1500, 1515, 1630, 1645, 1800, 1900, 2000, 2100, 2200, 2300],
            [ 840, 955, 1010, 1125, 1215, 1330, 1345, 1500, 1515, 1630, 1645, 1800, 1900, 2000, 2100, 2200, 2300],
            [ 840, 955, 1010, 1125, 1215, 1330, 1345, 1500, 1515, 1630, 1645, 1800, 1900, 2000, 2100, 2200, 2300],
            [ 840, 955, 1010, 1125, 1215, 1330, 1345, 1500, 1515, 1630, 1645, 1800, 1900, 2000, 2100, 2200, 2300],
            [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300],
        ] // list(list(int)) : week_times[week_of_day]
        , times: null // list(int) : 2340 -> 23:40, separated time list
        , times_is_minutes: false// bool : if true, times set 540 as AM 9:00,
        , cell_hook: null
    };

    var SVGNS = 'http://www.w3.org/2000/svg';
    var that = this;

    var CLASSES = {
        selecting: 'selecting',
        active: 'active',
        cell: 'svg_cell',
        table: 'svg_table',
        row_name: 'row_name',
        column_name: 'column_name',
        holiday: 'holiday',
        sunday: 'sunday',
        saturday: 'saturday'
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

    if (args.times === null && args.week_times === null && args.detail_times === null) {
        throw "times is undefined, set option (times or week_times or detail_times)"
    }


    // convert (args.day_num, args.start_date) to args.dates
    if (args.dates === null) {
        (function () {
            args.dates = [];
            var date = new Date(args.start_date.getTime());
            for (var i = 0; i < args.day_num; i++) {
                args.dates.push(new Date(date.getTime()));
                date.setDate(date.getDate() + 1);
            }
        })();
    }


    // generate times
    var cell_heights = new Array(args.dates.length);
    var times = new Array(args.dates.length);
    (function () {
        var get_times = (function () { // function(idx,date) -> list(int) : times
            if (args.times !== null) {
                return function (idx, date) {
                    return args.times
                }
            }
            if (args.week_times !== null) {
                return function (idx, date) {
                    return args.week_times[date.getDay()]
                }
            }
            if (args.detail_times !== null) {
                return function (idx, date) {
                    return args.detail_times[idx]
                }
            }
        })();
        var min_start_time = null;
        var max_end_time = null;
        // get start_time

        var idx;
        for (idx = 0; idx < args.dates.length; idx++) {
            cell_heights[idx] = [];
            var date = args.dates[idx];
            times[idx] = get_times(idx, date);

            var start_time = times[idx][0];
            var end_time = times[idx][times[idx].length - 1];

            if (min_start_time === null || start_time < min_start_time) {
                min_start_time = start_time;
            }
            if (max_end_time === null || max_end_time < end_time) {
                max_end_time = end_time;
            }
        }
        if (max_end_time === min_start_time) {
            throw "times is invalid"
        }

        // normalization
        var time2minutes = function (t) {
            return Math.floor(t / 100) * 60 + (t % 100)
        };
        var get_delta = function (prev, next) {
            if (!args.times_is_minutes) {
                prev = time2minutes(prev);
                next = time2minutes(next);
            }
            if (next < prev) {
                throw 'times is invalid'
            }
            return (next - prev)
        };
        var i;
        for (idx = 0; idx < args.dates.length; idx++) {
            if (times[idx][0] !== min_start_time) {
                times[idx].splice(0, 0, min_start_time);
            }
            if (times[idx][times[idx].length - 1] !== max_end_time) {
                times[idx].splice(times[idx].length, 0, max_end_time);
            }
            for (i = 0; i < times[idx].length - 1; i++) {
                cell_heights[idx].push(get_delta(times[idx][i], times[idx][i + 1]))
            }
        }
    })();

    // init columns
    var column_names = new Array(args.dates.length);
    (function () {
        for (var i = 0; i < args.dates.length; i++) {
            var date = args.dates[i];
            column_names[i] = '' + date.getMonth() + '/' + date.getDate();
        }
    })();

    var cell_hook = function (cell_elem) {
        var col = cell_elem.data('col');
        var row = cell_elem.data('row');
        cell_elem.data('date', args.dates[col]);
        cell_elem.data('start_time', times[col][row]);
        cell_elem.data('end_time', times[col][row + 1]);
        if (cell_elem.data('date').getDay() == 0) {
            cell_elem.addClass(CLASSES.holiday);
            cell_elem.addClass(CLASSES.sunday);
        }
        if (cell_elem.data('date').getDay() == 6) {
            cell_elem.addClass(CLASSES.holiday);
            cell_elem.addClass(CLASSES.saturday);
        }
        if(args.cell_hook !== null){
            args.cell_hook(cell_elem);
        }
    };


    // init table options
    var table_options = {
        column_num: cell_heights.length,
        cell_heights: cell_heights,
        cell_heights_is_ratio: true,
        column_names: column_names,
        column_name_height: 25,
        column_name_text_transform: 'translate(0,20)',
        cell_hook: cell_hook,
        select_mode: 'rectangle'
    };

    // init table
    this.table = new SVGTable(root_width, root_height, table_options);


    // method
    this.get_active_times = function () {
        var cells = that.table.get_active_cells();
        var res = {};
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var start_time = cell.data('start_time');
            var end_time = cell.data('end_time');
            var date = cell.data('date')
            if (res[date] === undefined) {
                res[date] = [];
            }
            var leng = res[date].length;
            if (leng >= 1 && res[date][leng - 1][1] == start_time) {
                res[date][leng - 1][1] = end_time;
            } else {
                res[date].push([start_time, end_time]);
            }
        }
        return res;
    };
};

SVGTimetable.prototype.get_root_elem = function () {
    return this.table.get_root_elem();
};