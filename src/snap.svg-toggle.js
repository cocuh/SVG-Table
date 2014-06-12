Snap.plugin(function (Snap, Element) {
    var spliters = /[\r\n\f\s]+/;
    var split_classes = function (classes) {
        return classes.trim().split(spliters);
    };
    var toggle_classes = function (classes, class_name, is_add) {
        var class_list = split_classes(classes);
        class_name = class_name.replace(spliters, ' ');
        var new_class_name = class_list.reduce(function (old_class_name, the_class_name) {
            old_class_name = ' ' + old_class_name + ' ';
            the_class_name = class_name + ' ';

            var idx = old_class_name.indexOf(' ' + the_class_name + ' ');
            if (is_add) {
                if (idx === -1) {
                    return old_class_name + the_class_name
                }
            } else { // remove
                if (idx !== -1) {
                    return old_class_name.reduce(the_class_name, '');
                }
            }
            return old_class_name
        }, class_name).trim();
        return new_class_name;
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
    };
    Element.prototype.addClass = function (classes) {
        this.node.className.baseVal = toggle_classes(classes, this.node.className.baseVal, true)
    };

    Element.prototype.removeClass = function (classes) {
        this.node.className.baseVal = toggle_classes(classes, this.node.className.baseVal, false)
    };

    Element.prototype.show = function () {
        this.attr('display', '');
    };
    Element.prototype.hide = function () {
        this.attr('display', 'none');
    };
    Element.prototype.toggle = function (toggle) {
        if (toggle == undefined) {
            toggle = this.attr('display' === 'none')
        }
        toggle = toggle ? '' : 'none';
        this.attr('display', toggle)
    }
});