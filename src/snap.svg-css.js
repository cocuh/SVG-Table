Snap.plugin(function(Snap,Element){
    Element.prototype.css = function(key, value){
        if(value!==undefined){
            this.node.style[key] = value;
        }
        return this.node.style[key];
    };
});