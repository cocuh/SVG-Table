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