/*
 * Note: whoever made this script did a nice job.
 *       I would've kept in all licensing info if they didn't try to print out this one annoying alert EVERY TIME THE PAGE LOADED!!
 *       The file was obfuscated, but poorly so. I would've AT THE VERY LEAST encrypted all of the main source code and renamed all the variables to something random.
 *       The popup was too annoying, though - so annoying that I decided to remove the licensing info to punish the author. Next time you'll know.
 */

//from dw_event.js
var dw_event = {

  add: function(obj, etype, fp, cap) {
    cap = cap || false;
    if (obj.addEventListener) obj.addEventListener(etype, fp, cap);
    else if (obj.attachEvent) obj.attachEvent("on" + etype, fp);
  },

  remove: function(obj, etype, fp, cap) {
    cap = cap || false;
    if (obj.removeEventListener) obj.removeEventListener(etype, fp, cap);
    else if (obj.detachEvent) obj.detachEvent("on" + etype, fp);
  },

  DOMit: function(e) {
    e = e? e: window.event;
    e.tgt = e.srcElement? e.srcElement: e.target;

    if (!e.preventDefault) e.preventDefault = function () { return false; }
    if (!e.stopPropagation) e.stopPropagation = function () { if (window.event) window.event.cancelBubble = true; }

    return e;
  }

}
//from dw_viewport.js
var viewport = {
  getWinWidth: function () {
    this.width = 0;
    if (window.innerWidth) this.width = window.innerWidth - 18;
    else if (document.documentElement && document.documentElement.clientWidth)
                this.width = document.documentElement.clientWidth;
    else if (document.body && document.body.clientWidth)
                this.width = document.body.clientWidth;
  },

  getWinHeight: function () {
    this.height = 0;
    if (window.innerHeight) this.height = window.innerHeight - 18;
        else if (document.documentElement && document.documentElement.clientHeight)
                this.height = document.documentElement.clientHeight;
        else if (document.body && document.body.clientHeight)
                this.height = document.body.clientHeight;
  },

  getScrollX: function () {
    this.scrollX = 0;
        if (typeof window.pageXOffset == "number") this.scrollX = window.pageXOffset;
        else if (document.documentElement && document.documentElement.scrollLeft)
                this.scrollX = document.documentElement.scrollLeft;
        else if (document.body && document.body.scrollLeft)
                this.scrollX = document.body.scrollLeft;
        else if (window.scrollX) this.scrollX = window.scrollX;
  },

  getScrollY: function () {
    this.scrollY = 0;
    if (typeof window.pageYOffset == "number") this.scrollY = window.pageYOffset;
    else if (document.documentElement && document.documentElement.scrollTop)
                this.scrollY = document.documentElement.scrollTop;
        else if (document.body && document.body.scrollTop)
                this.scrollY = document.body.scrollTop;
        else if (window.scrollY) this.scrollY = window.scrollY;
  },

  getAll: function () {
    this.getWinWidth(); this.getWinHeight();
    this.getScrollX();  this.getScrollY();
  }

}

var Tooltip = { 
    followMouse: true,
    offX: 8,
    offY: 12,
    tipID: "tipDiv",
    showDelay: 1500,
    hideDelay: 200,
    ready:false,
    timer:null,
    tip:null,
    init: function() {
        if(document.createElement && document.body && typeof(document.body.appendChild)!="undefined") {
            if(!document.getElementById(this.tipID)) {
                var el=document.createElement("DIV");
                el.id=this.tipID;
                document.body.appendChild(el);
            }
            this.ready=true;
        }
    },
    show: function(e,msg) {
        if(this.timer) {
            clearTimeout(this.timer);
            this.timer=0;
        }
        this.tip=document.getElementById(this.tipID);
        if(this.followMouse) {
            dw_event.add(document,"mousemove",this.trackMouse,true);
        }
        this.writeTip("");
        this.writeTip(msg);
        viewport.getAll();
        this.positionTip(e);
        this.timer=setTimeout("Tooltip.toggleVis('"+this.tipID+"', 'visible')",this.showDelay);
    },
    writeTip: function(msg) {
        if(this.tip && typeof this.tip.innerHTML!="undefined") {
            this.tip.innerHTML=msg;
        }
    },
    positionTip: function(e) {
        if(this.tip && this.tip.style) {
            var x=e.pageX ? e.pageX : e.clientX+viewport.scrollX;
            var y=e.pageY ? e.pageY : e.clientY+viewport.scrollY;
            if(x+this.tip.offsetWidth+this.offX > viewport.width+viewport.scrollX) {
                x=x-this.tip.offsetWidth-this.offX;
                if(x<0) {
                    x=0;
                }
            } else {
                x=x+this.offX;
            }
            if(y+this.tip.offsetHeight+this.offY > viewport.height+viewport.scrollY) {
                y=y-this.tip.offsetHeight-this.offY;
                if(y < viewport.scrollY) {
                    y=viewport.height+viewport.scrollY-this.tip.offsetHeight;
                }
            } else {
                y=y+this.offY;
            }
            this.tip.style.left=x+"px";
            this.tip.style.top=y+"px";
        }
    },
    hide: function() {
        if(this.timer) {
            clearTimeout(this.timer);
            this.timer=0;
        }
        this.timer=setTimeout("Tooltip.toggleVis('"+this.tipID+"', 'hidden')", this.hideDelay);
        if(this.followMouse) {
            dw_event.remove(document,"mousemove",this.trackMouse,true);
        }
        this.tip=null;
    },
    toggleVis: function(id,vis) {
        var el=document.getElementById(id);
        if(el) {
            el.style.visibility=vis;
        }
    },
    trackMouse: function(e) {
        e=dw_event.DOMit(e);
        Tooltip.positionTip(e);
    }
};