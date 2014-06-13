SVGTable = function (root_width, root_height, input_options) {
    // classes
    // - selecting : selecting
    // - 
    var DEFAULTS = {
        cell_text: null // list(list(str))
        , cell_text_offset: [10, 23]
        // rows
        , row_num: null // int : if cell_heights is not null, equal divide
        , cell_heights: null // list(list(int)) or null : if cell_heights is null, equal divide
        , cell_heights_is_ratio: null // if true, cell_heights use as ratio ( the_cell_height[y][x] = cell_heights[y][x]/sum(cell_heights[y]))

        // columns
        , column_num: null  // int : if cell_heights is not null, equal divide
        , column_widths: null // list(int) or null : if cell_heights is null, equal divide
        , column_widths_is_ratio: null // bool : if true, cell_heights use as ratio ( the_cell_height[y][x] = cell_heights[y][x]/sum(cell_heights[y]

        // column and row names
        , column_name_list: null // iter(str) or list(str) or null : column_num
        , column_name_cell_height: 0// int
        , column_name_text_offset: null // (int, int) : (offsetX, offsetY)
        , row_name_list: null // iter(str) or list(str) or null : row-num
        , row_name_text_offset: null // (int, int) : (offsetX, offsetY)
        , row_name_cell_width: 0, horizontal_scale_list: null //list(int) : the int is absolute y position regardless of cell_height_is_ratio
        , vertical_scale_list: null //list(int) : the int is absolute y position regardless of cell_height_is_ratio
        , select_mode: 'horizontal' //string : 

        // active
        , CLASSES: {} // css classes
        , select_cell: null // func : is_active_cell(elem, start_col, start_row, end_col, end_row, start_posX, start_posY, end_posX, end_posY)
    };
    var SVGNS = 'http://www.w3.org/2000/svg';
    var that = this;

    var CLASSES = {
        selecting: 'selecting', active: 'active', cell: 'svg_cell', table: 'svg_table'
    };


    // extend args d:jquery
    var args = (function () {
        var options = $.extend(true, {}, DEFAULTS);
        $.extend(true, options, input_options);
        return options;
    })();


    // args
    $.extend(true, CLASSES, args.CLASSES);
    this.options = args;


    // init root object d:jquery
    this.table_root = $('<div/>').height(root_height).width(root_width);


    // init svg_root d:snap.svg
    this.svg_root = Snap(document.createElementNS(SVGNS, 'svg'));
    this.svg_root.attr({'width': root_width, 'height': root_height, 'class': 'svg_table'});
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
    var _is_in_select = {  // select mode dictionary
        null: args.activate_cell,
        'rectangle': function (cell, col, row, status) {
            // TODO
        },
        'horizontal': function (cell, col, row, status) {
            var column_num = args.column_num===null?args.column_widths.length:args.column_num;
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
    }[args.select_mode];
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
    };
    var event_handler_factory = function (ix, iy) {
        return function (event) {
            var save_status_start = function () {
                status.start_col = ix;
                status.start_row = iy;
                status.startX = event.clientX;
                status.startY = event.clientY;
            };
            var save_status_end = function () {
                status.end_col = ix;
                status.end_row = iy;
                status.endX = event.clientX;
                status.endY = event.clientY;
            };
            switch (event.type) {
                case 'mousedown':
                    save_status_start();
                    save_status_end();
                    actions.toggle_class(CLASSES.selecting, status, true);
                    break;
                case 'mouseover':
                    save_status_end();
                    actions.clear_selecting();
                    if (event.buttons != 0 && event.which % 2 != 0) {
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


    //generate row_name d:snap.svg
    this.row_name_cells = new Array(this.row);
    if (args.row_name_list !== null) {
        (function () {
            var w = args.row_name_cell_width;
            var offsetY = 0;
            var text_offsetX = args.row_name_text_offset[0];
            var text_offsetY = args.row_name_text_offset[0];
            for (var y = 0; y < args.row_num; y++) {
                var text = args.row_name_list[y];
                var h = args.column_name_cell_height;
                args.row_name_cells[y] = that.svg_root.rect(0, offsetY, w, h);
                that.svg_root.text(text_offsetX, offsetY + text_offsetY, text);
                offsetY += h;
            }
        })();
    }


    // generate column_name 
    // TODO


    // generate cells
    this.cells_root = this.svg_root.group();
    this.cells = new Array(this.row_num);
    this.texts = new Array(this.row_num);
    (function () {
        var get_width = args.column_num === null ?
            function (col) {
                return args.column_widths_is_ratio
                    ? args.column_widths[col] * root_width / args.column_widths.reduce(function (p, n) {
                    return p + n;
                })
                    : args.column_widths[col];
            } :
            function (col) {
                return (root_width - args.row_name_cell_width) / args.column_num;
            };
        var get_height = args.row_num === null ?
            function (col, row) {
                return args.cell_heights_is_ratio
                    ? args.cell_heights[col][row] * root_height / args.cell_heights[col].reduce(function (p, n) {
                    return p + n
                })
                    : args.cell_heights[col][row];
            } :
            function (col, row) {
                return (root_height - args.column_name_cell_height) / args.row_num;
            };
        var gen_rect = function (parent, col, row, offsetX, offsetY, width, height) {
            var cell = parent
                .rect(offsetX, offsetY, width, height)
                .addClass(CLASSES.table).addClass(CLASSES.cell)
                .data('col', col).data('row', row);
            var handler = event_handler_factory(col, row);
            cell.mousedown(handler)
                .mouseover(handler)
                .mouseup(handler);
            return cell;
        };
        var gen_text = function (parent, col, row, offsetX, offsetY, width, height) {

        };

        var offsetX = 0, h, w, text, col_root, cell_root;
        var column_num = args.column_num === null ? args.column_widths.length : args.column_num
        for (var col = 0; col < column_num; col++) {
            var row_num = args.row_num === null ? args.cell_heights[col].length : args.row_num;
            var offsetY = 0;
            w = get_width(col);
            that.cells[col] = new Array(row_num);
            that.texts[col] = new Array(row_num);
            col_root = that.cells_root.group();
            for (var row = 0; row < row_num; row++) {
                cell_root = col_root.group();
                h = get_height(col, row);
                text = args.cell_text === null ? "" : args.cell_text[col][row];
                that.cells[col][row] = gen_rect(cell_root, col, row, offsetX, offsetY, w, h);
                var text_offsetX = args.cell_text_offset === null ? 0 : args.cell_text_offset[0],
                    text_offsetY = args.cell_text_offset === null ? 0 : args.cell_text_offset[1];
                that.texts[col][row] = cell_root.text(offsetX + text_offsetX, offsetY + text_offsetY, text);
                offsetY += get_height(col, row);
            }
            offsetX += w;
        }
    })();
};
SVGTable.prototype.get_root_elem = function () {
    return this.table_root.get(0);
};
