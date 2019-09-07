Snap.plugin(function (Snap, Element) {
    var spliters = /[\r\n\f\s]+/;
    var split_classes = function (classes) {
        return classes.trim().split(spliters);
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