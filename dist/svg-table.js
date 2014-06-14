// SVG-Table 1.0.0
// author: cocu
// license: Apache v2
// https://github.com/cocu/SVG-Table
Snap.plugin(function (Snap, Element) {
    Element.prototype.css = function (key, value) {
        if (value !== undefined) {
            this.node.style[key] = value;
            return this
        }
        return this.node.style[key];
    };
    Element.prototype.disableUserSelect = function () {
        this.css('user-select', 'none')
            .css('-moz-user-select', 'none')
            .css('-webkit-user-select', 'none')
            .css('-khtml-user-select', 'none')
            .css('-ms-user-select', 'none');
        return this
    }
});
Snap.plugin(function (Snap, Element) {
    var spliters = /[\r\n\f\s]+/;
    var split_classes = function (classes) {
        if(classes){
            return classes.trim().split(spliters);
        }
        return [];
    };
    var toggle_classes = function (classes, current_class_name, is_add) {
        var target_class_list = split_classes(classes);
        current_class_name = ' '+ current_class_name.replace(spliters, ' ')+' ';
        for(var i=target_class_list.length;i--;){
            var target_class = target_class_list[i]+' ';
            var idx = current_class_name.indexOf(' '+target_class);
            if (is_add) {
                if (idx === -1) {
                    current_class_name += target_class;
                }
            } else { // remove
                if (idx !== -1) {
                    current_class_name= current_class_name.replace(target_class, '');
                }
            }
        }
        return current_class_name.trim();
    };
    Element.prototype.toggleClass = function (classes, toggle) {
        if (toggle === undefined) {
            var class_list = split_classes(classes);
            for (var i = class_list.length; i--;) { // foreach
                var has_class = class_list.indexOf(class_list[i]) >= 0;
                toggle_classes(classes, class_list[i], !has_class)
            }
        } else {
            if (toggle) {
                this.addClass(classes);
            } else {
                this.removeClass(classes);
            }
        }
        return this;
    };
    Element.prototype.addClass = function (classes) {
        this.node.className.baseVal = toggle_classes(classes, this.node.className.baseVal, true);
        return this;
    };

    Element.prototype.removeClass = function (classes) {
        this.node.className.baseVal = toggle_classes(classes, this.node.className.baseVal, false);
        return this;
    };
    Element.prototype.hasClass = function(the_class){
        the_class = ' '+the_class + ' ';
        var class_name = ' '+ this.node.className.baseVal + ' ';
        return class_name.indexOf(the_class) != -1;
    };

    Element.prototype.show = function () {
        this.attr('display', '');
        return this;
    };
    Element.prototype.hide = function () {
        this.attr('display', 'none');
        return this;
    };
    Element.prototype.toggle = function (toggle) {
        if (toggle == undefined) {
            toggle = this.attr('display' === 'none')
        }
        toggle = toggle ? '' : 'none';
        this.attr('display', toggle)
        return this;
    }
});
SVGTable = function (root_width, root_height, i_options) {
    // classes
    // - selecting : selecting
    // - 
    var DEFAULTS = {
        cell_texts: null // list(list(str))[col][row]
        , cell_texts_is_row_col: false // set true if cell_texts list(list(str))[row][col]
        , cell_text_transform: 'translate(10,23)'
        //--- rows
        , row_num: null // int : if cell_heights is not null, equal divide
        , row_heights: null // list(int) : active when row_num is null
        , row_heights_is_ratio: null // if true, row_heights use as ratio ( the_cell_height[y][x] = row_heights[y][x]/sum(row_heights[y]))
        , cell_heights: null // list(list(int)) or null : active when both row_num and row_heights is null
        , cell_heights_is_ratio: null // if true, cell_heights use as ratio ( the_cell_height[y][x] = cell_heights[y][x]/sum(cell_heights[y]))

        //--- columns
        , column_num: null  // int : if cell_heights is not null, equal divide
        , column_widths: null // list(int) or null : if cell_heights is null, equal divide
        , column_widths_is_ratio: null // bool : if true, cell_heights use as ratio ( the_cell_height[y][x] = cell_heights[y][x]/sum(cell_heights[y]

        //--- names
        // column names
        , column_names: null // iter(str) or list(str) or null : column_num
        , column_name_height: 0// int
        , column_name_text_transform: '' // string
        , column_name_widths: null //
        , column_name_widths_is_ratio: false //
        // row names
        , row_names: null // iter(str) or list(str) or null : row-num
        , row_name_text_offset: [0, 0] // (int, int) : (offsetX, offsetY)
        , row_name_text_transform: '' // string
        , row_name_width: 0//
        , row_name_heights: null // 
        , row_name_heights_is_ratio: false // 
//        , horizontal_scales: null //list(int) : the int is absolute y position regardless of cell_height_is_ratio
//        , vertical_scales: null //list(int) : the int is absolute y position regardless of cell_height_is_ratio
        , select_mode: 'horizontal' //string : 

        //-- hooks
        , cell_hook: null // func : hook(cell_elem)
        , column_name_hook: null // func : hook (cell_elem)
        , row_name_hook: null // func : hook(cell_elem)

        //-- advance
        , CLASSES: {} // css classes
        , SELECT_MODE_DICT: {} // (function (cell, col, row, status) -> bool)[str]
        , SIGNIFICANT_FIGURE: 1 // int
        , select_cell: null // func : is_active_cell(cell, col, row, status)
    };
    var SVGNS = 'http://www.w3.org/2000/svg';
    var that = this;

    var CLASSES = {
        selecting: 'selecting',
        active: 'active',
        cell: 'svg_cell',
        table: 'svg_table',
        row_name: 'row_name',
        column_name: 'column_name'
    };

    var SELECT_MODE_DICT = {  // select mode dictionary
        'rectangle': function (cell, col, row, status) {
            var c_minY = cell.data('top');
            var c_minX = cell.data('left');
            return (
                (status.col_minX <= c_minX && c_minX < status.col_maxX)
                &&
                (status.col_minY <= c_minY && c_minY < status.col_maxY)
                );
        },
        'horizontal': function (cell, col, row, status) {
            var column_num = args.column_num === null ? args.column_widths.length : args.column_num;
            var x = col + row * column_num;
            var i = status.start_col + status.start_row * column_num;
            var j = status.end_col + status.end_row * column_num;
            return ((i <= x && x <= j) || (j <= x && x <= i));
        },
        'vertical': function (cell, col, row, status) {
            var row_num = args.row_num;
            var x = col * row_num + row;
            var i = status.start_col * row_num + status.start_row;
            var j = status.end_col * row_num + status.end_row;
            return ((i <= x && x <= j) || (j <= x && x <= i));
        }
    };

    // extend args d:jquery
    var args = (function () {
        var options = $.extend(true, {}, DEFAULTS);
        $.extend(true, options, i_options);
        return options;
    })();


    // args
    $.extend(true, CLASSES, args.CLASSES);
    $.extend(true, SELECT_MODE_DICT, args.SELECT_MODE_DICT);
    this.options = args;

    if (args.row_num === null && args.row_heights === null && args.cell_heights === null) {
        throw "row length is not defined, add option (row_num or row_heights or cell_heights)"
    }
    if (args.column_num === null && args.column_widths === null) {
        throw "column length is not defined, add option (column_num or column_width)"
    }

    //significant figure
    that.CLASSES = CLASSES;
    that.SELECT_MODE_DICT = SELECT_MODE_DICT;
    var SIGNIFICANT_FIGURE = args.SIGNIFICANT_FIGURE;
    var _round = function (value) {
        if(SIGNIFICANT_FIGURE === null){
            return value;
        }
        return Math.round(value * SIGNIFICANT_FIGURE) / SIGNIFICANT_FIGURE;
    };


    // init root object d:jquery
    this.table_root = $('<div/>').height(root_height).width(root_width);


    // init svg_root d:snap.svg
    this.svg_root = Snap(document.createElementNS(SVGNS, 'svg'));
    this.svg_root.attr({'width': root_width, 'height': root_height, 'class': 'svg_table', 'viewBox': '0 0 ' + root_width + ' ' + root_height});
    this.table_root.append(this.svg_root.node);


    // actions
    var actions = {};
    actions.clear_selecting = function () {
        var col, row;
        for (col = that.cells.length; col--;) {
            for (row = that.cells[col].length; row--;) {
                that.cells[col][row].removeClass(CLASSES.selecting);
            }
        }
    };
    var _is_in_select = null;

    this.set_select_mode = function (select_mode) {
        _is_in_select = SELECT_MODE_DICT[select_mode]
    };
    this.set_select_mode(args.select_mode);

    actions.toggle_class = function (class_name, status, is_add) {
        if (is_add === undefined) {
            is_add = !that.cells[status.start_col][status.start_row].hasClass(class_name);
        }
        var row, col;
        for (col = that.cells.length; col--;) {
            for (row = that.cells[col].length; row--;) {
                var flag = _is_in_select(that.cells[col][row], col, row, status);
                if (flag) {
                    that.cells[col][row].toggleClass(class_name, is_add);
                }
            }
        }
    };


    // handler
    var status = {
        start_col: 0, end_col: 0,
        start_row: 0, end_row: 0,
        startX: 0, endX: 0,
        startY: 0, endY: 0,
        minX: 0, maxX: 0,
        minY: 0, maxY: 0
    };
    var event_handler_factory = function (ix, iy) {
        return function (event) {
            var save_status_start = function () {
                status.start_col = ix;
                status.start_row = iy;
            };
            var save_status_end = function () {
                status.end_col = ix;
                status.end_row = iy;

                var start_col_top = that.cells[status.start_col][status.start_row].data('top');
                var end_col_top = that.cells[status.end_col][status.end_row].data('top');
                status.col_minY = Math.min(start_col_top, end_col_top);
                status.col_maxY = Math.max(
                        start_col_top + that.cells[status.start_col][status.start_row].data('height'),
                        end_col_top + that.cells[status.end_col][status.end_row].data('height')
                );
                var start_col_left = that.cells[status.start_col][status.start_row].data('left');
                var end_col_left = that.cells[status.end_col][status.end_row].data('left');
                status.col_minX = Math.min(start_col_left, end_col_left);
                status.col_maxX = Math.max(
                        start_col_left + that.cells[status.start_col][status.start_row].data('width'),
                        end_col_left + that.cells[status.end_col][status.end_row].data('width')
                );
            };
            switch (event.type) {
                case 'mousedown':
                    save_status_start();
                    save_status_end();
                    actions.toggle_class(CLASSES.selecting, status, true);
                    break;
                case 'mouseover':
                    actions.clear_selecting();
                    if (event.buttons != 0 && event.which % 2 != 0) {
                        save_status_end();
                        actions.toggle_class(CLASSES.selecting, status, true);
                    }
                    break;
                case 'mouseup':
                    save_status_end();
                    actions.clear_selecting();
                    actions.toggle_class(CLASSES.active, status);
                    break;
                case 'mouseout':
                    actions.clear_selecting();
                    break;
            }
            event.preventDefault();
        };
    };
    document.body.addEventListener('mouseup', actions.clear_selecting);


    // generate names
    this.names_root = that.svg_root.g();

    if (args.column_names !== null && args.row_names !== null) {
        (function () {
            var cell_root = that.names_root.g()
                    .addClass(CLASSES.table).addClass(CLASSES.cell)
                ;
            cell_root.rect(0, 0, args.row_name_width, args.column_name_height);
        })();
    }
    // generate row_name d:snap.svg
    this.row_name_cells = new Array(this.row);
    if (args.row_names !== null) {
        (function () {
            var row_names_root = that.names_root.g();
            var w = args.row_name_width;
            var offsetY = args.column_name_height;
            for (var row = 0; row < args.row_names.length; row++) {
                var cell_root = row_names_root.g()
                    .addClass(CLASSES.table).addClass(CLASSES.row_name).addClass(CLASSES.cell)
                    .data('row', row);
                cell_root.transform('translate(0,' + offsetY + ')');
                that.row_name_cells[row] = cell_root;
                var text = args.row_names[row];
                var h = (function () {
                    if (args.row_name_heights === null) {
                        return _round(((root_height - args.column_name_height) / args.row_names.length))
                    }
                    if (args.row_name_heights_is_ratio) {
                        var sum_height = args.row_name_heights.reduce(function (p, n) {
                            return p + n
                        });
                        return _round(args.row_name_heights[row] * (root_height - args.column_name_height) / sum_height);
                    } else {
                        return args.row_name_heights[row]
                    }
                })();
                cell_root.rect(0, 0, w, h);
                var transform_value = args.row_name_text_transform
                        .replace('${width}', w).replace('${height}', h) // ISSUE#1
                    ;
                cell_root.text(0, 0, text)
                    .transform(transform_value)
                    .disableUserSelect();
                if (args.row_name_hook !== null) {
                    args.row_name_hook(cell_root, that);
                }
                offsetY += h;
            }
        })();
    }


    // generate column_name 
    this.column_name_cells = null;
    if (args.column_names !== null) {
        this.column_name_cells = new Array(args.column_names.length);
        (function () {
            var column_names_root = that.names_root.g();
            var h = args.column_name_height;
            var offsetX = args.row_name_width;
            for (var col = 0; col < args.column_names.length; col++) {
                var cell_root = column_names_root.g()
                    .addClass(CLASSES.table).addClass(CLASSES.column_name).addClass(CLASSES.cell)
                    .data('col', col);
                cell_root.transform('translate(' + offsetX + ',0)')
                that.column_name_cells[col] = cell_root;
                var text = args.column_names[col];
                var w = (function () {
                    if (args.column_name_widths === null) {
                        return ((root_width - args.row_name_width) / args.column_names.length);
                    }
                    if (args.column_name_widths_is_ratio) {
                        return  args.column_name_widths[col] * (root_width - args.row_name_width) / args.column_name_widths.reduce(function (prev, next) {
                            return prev + next;
                        })
                    } else {
                        return args.column_name_widths[col];
                    }
                })();
                cell_root.rect(0, 0, w, h);
                var transform_value = args.column_name_text_transform
                        .replace('${width}', w).replace('${height}', h) // ISSUE#1
                    ;
                cell_root.text(0, 0, text)
                    .attr('transform', transform_value)
                    .disableUserSelect();
                if (args.column_name_hook !== null) {
                    args.column_name_hook(cell_root, that)
                }
                offsetX += w;
            }
        })();
    }


    // generate cells
    this.cells_root = this.svg_root.group();
    this.cells = new Array(args.column_num || args.column_widths.length);
    this.texts = new Array(this.cells.length);
    (function () {
        var get_width = (function () {
            if (args.column_widths === null) {
                return function (col) {
                    return ((root_width - args.row_name_width) / args.column_names.length);
                }
            }
            if (args.column_widths_is_ratio) {
                return  function (col) {
                    return args.column_widths[col] * (root_width - args.row_name_width) / args.column_widths.reduce(function (prev, next) {
                        return prev + next;
                    })
                }
            } else {
                return function (col) {
                    return args.column_widths[col]
                };
            }
        })();
        var get_height = (function () {
            if (args.row_num !== null) {
                return function (col, row) {
                    return (root_height - args.column_name_height) / args.row_num;
                }
            }
            if (args.row_heights !== null) { // args.row_heights is active
                if (args.row_heights_is_ratio) {
                    var height_sum = args.row_heights.reduce(function (p, n) {
                        return p + n
                    });
                    return function (col, row) {
                        var value = args.row_heights[row] * (root_height - args.column_name_height) / height_sum
                        return _round(value);
                    }
                } else {
                    return function (col, row) {
                        return args.row_heights[row];
                    }
                }
            } else { // args.cell_heigts is active
                if (args.cell_heights_is_ratio) {
                    return function (col, row) {
                        var height_sum = args.cell_heights[col].reduce(function (p, n) {
                            return p + n
                        });
                        var value = args.cell_heights[col][row] * (root_height - args.column_name_height) / height_sum
                        return _round(value);
                    }
                } else {
                    return function (col, row) {
                        return args.cell_heights[col][row];
                    }
                }
            }
        })();


        var offsetX, offsetY, h, w, text, col_root, cell_root;
        offsetX = args.row_names === null ? 0 : args.row_name_width;
        var column_num = args.column_num === null ? args.column_widths.length : args.column_num
        for (var col = 0; col < column_num; col++) {
            var row_num = args.row_num === null ? (args.row_heights === null ? args.cell_heights[col].length : args.row_heights.length) : args.row_num;
            offsetY = args.column_names === null ? 0 : args.column_name_height;
            w = get_width(col);
            that.cells[col] = new Array(row_num);
            that.texts[col] = new Array(row_num);
            col_root = that.cells_root.group()
                .transform('translate(' + offsetX + ')');
            for (var row = 0; row < row_num; row++) {
                var handler = event_handler_factory(col, row);
                h = get_height(col, row);
                cell_root = col_root.group()
                    .addClass(CLASSES.table).addClass(CLASSES.cell)
                    .transform('translate(0,' + offsetY + ')')
                    .data('col', col).data('row', row)
                    .data('left', offsetX).data('top', offsetY)
                    .data('width', w).data('height', h)
                    .mousedown(handler).mouseover(handler).mouseup(handler);
                that.cells[col][row] = cell_root;
                text = (function () {
                    if (args.cell_texts === null) {
                        return "";
                    }
                    if (args.cell_texts_is_row_col) {
                        return args.cell_texts[row][col];
                    }
                    if (args.cell_texts[col] === undefined) {
                        return ""
                    } else {
                        return args.cell_texts[col][row];
                    }
                })();
                cell_root.rect(0, 0, w, h);
                that.texts[col][row] = cell_root.text(0, 0, text)
                    .transform(args.cell_text_transform)
                    .disableUserSelect();
                if (args.cell_hook !== null) {
                    args.cell_hook(cell_root, that);
                }
                offsetY += h;
            }
            offsetX += w;
        }
    })();


    this.get_active_cells = function () {
        var active_cells = [];
        for (var col = 0; col < this.cells.length; col++) {
            for (var row = 0; row < this.cells[col].length; row++) {
                if (this.cells[col][row].hasClass(CLASSES.active)) {
                    active_cells.push(this.cells[col][row]);
                }
            }
        }
        return active_cells;
    };
};
SVGTable.prototype.get_root_elem = function () {
    return this.table_root.get(0);
};
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
        , table_options: {} // 
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
    
    // over write
    $.extend(true, table_options, args.table_options);
    
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
SVGTimetable = function (root_width, root_height, i_options) {
    var DEFAULTS = {
        //---requires
        dates: null // list(Date) : not use hours, minutes, seconds.
        , start_date: new Date() // Date : not use hours, minutes, seconds.
        , day_num: 7 // int : day num

        //--- times
        , detail_times: null // list(list(int)) : 
        , week_times: null // list(list(int)) : week_times[week_of_day]
        , times: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300]
          // list(int) : 2340 -> 23:40, separated time list
        , times_is_minutes: false// bool : if true, times set 540 as AM 9:00,
        , cell_hook: null//
        ,CLASSES:{}
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
    that.CLASSES = CLASSES;
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
            if (args.detail_times !== null) {
                return function (idx, date) {
                    return args.detail_times[idx]
                }
            }
            if (args.week_times !== null) {
                return function (idx, date) {
                    return args.week_times[date.getDay()]
                }
            }
            if (args.times !== null) {
                return function (idx, date) {
                    return args.times
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
            args.cell_hook(cell_elem, that);
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
    
    // over write
    $.extend(true, table_options, args.table_options);

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