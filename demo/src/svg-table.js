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

        //-- advance
        , CLASSES: {} // css classes
        , SELECT_MODE_DICT: {} // (function (cell, col, row, status) -> bool)[str]
        , select_cell: null // func : is_active_cell(cell, col, row, status)
        , cell_hook: null // func : hook(cell_elem)
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
        minY: 0, maxY: 0,
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
            for (var y = 0; y < args.row_names.length; y++) {
                var cell_root = row_names_root.g()
                        .addClass(CLASSES.table).addClass(CLASSES.row_name).addClass(CLASSES.cell)
                    ;
                cell_root.transform('translate(0,' + offsetY + ')');
                that.row_name_cells[y] = cell_root;
                var text = args.row_names[y];
                var h = args.row_name_heights === null ? ((root_height - args.column_name_height) / args.row_names.length) : args.row_name_heights[y];
                cell_root.rect(0, 0, w, h);
                var transform_value = args.row_name_text_transform
                        .replace('${width}', w).replace('${height}', h) // ISSUE#1
                    ;
                cell_root.text(0, 0, text)
                    .transform(transform_value)
                    .disableUserSelect();
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
                    ;
                cell_root.transform('translate(' + offsetX + ',0)');
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
                        var ratio = args.row_heights[row] * (root_height - args.column_name_height) / height_sum
                        return Math.round(ratio);
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
                        var ratio = args.cell_heights[col][row] * (root_height - args.column_name_height) / height_sum
                        return Math.round(ratio);
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
                    args.cell_hook(cell_root);
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