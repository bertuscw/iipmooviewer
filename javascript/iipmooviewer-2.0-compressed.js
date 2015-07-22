var IIPMooViewer=new Class({Extends:Events,version:"2.0",initialize:function(a,b){this.source=a||alert("No element ID given to IIPMooViewer constructor");this.server=b.server||"/fcgi-bin/iipsrv.fcgi";this.render=b.render||"spiral";this.viewport=null;b.viewport&&(this.viewport={resolution:"undefined"==typeof b.viewport.resolution?null:parseInt(b.viewport.resolution),rotation:"undefined"==typeof b.viewport.rotation?null:parseInt(b.viewport.rotation),contrast:"undefined"==typeof b.viewport.contrast?
null:parseFloat(b.viewport.contrast),x:"undefined"==typeof b.viewport.x?null:parseFloat(b.viewport.x),y:"undefined"==typeof b.viewport.y?null:parseFloat(b.viewport.y)});this.images=Array(b.image.length);b.image||alert("Image location not set in class constructor options");if("array"==typeOf(b.image))for(i=0;i<b.image.length;i++)this.images[i]={src:b.image[i],sds:"0,90",cnt:this.viewport&&null!=this.viewport.contrast?this.viewport.contrast:1};else this.images=[{src:b.image,sds:"0,90",cnt:this.viewport&&
null!=this.viewport.contrast?this.viewport.contrast:1}];this.loadoptions=b.load||null;this.credit=b.credit||null;this.scale=b.scale||null;this.units={dims:"pm nm &#181;m mm cm m km".split(" "),orders:[1E-12,1E-9,1E-6,0.001,0.01,1,1E3],mults:[1,2,5,10,50,100],factor:1E3};b.units&&(!1==instanceOf(b.units,String)?this.units=b.units:"degrees"==b.units&&(this.units={dims:["''","'","&deg"],orders:[1/3600,1/60,1],mults:[1,10,15,30],factor:3600}));this.enableFullscreen="native";!1==b.enableFullscreen&&(this.enableFullscreen=
!1);"page"==b.enableFullscreen&&(this.enableFullscreen="page");this.fullscreen=null;!1!=this.enableFullscreen&&(this.fullscreen={isFullscreen:!1,targetsize:{},eventChangeName:null,enter:null,exit:null});this.disableContextMenu=!0;this.showNavWindow=!1==b.showNavWindow?!1:!0;this.showNavButtons=!1==b.showNavButtons?!1:!0;this.navWinSize=b.navWinSize||0.2;this.winResize=!1==b.winResize?!1:!0;this.prefix=b.prefix||"images/";this.rotationStep=parseInt(b.rotationStep)||45;if(b.protocol&&!instanceOf(b.protocol,
String))this.protocol=b.protocol;else switch(b.protocol){case "zoomify":this.protocol=new Protocols.Zoomify;break;case "deepzoom":this.protocol=new Protocols.DeepZoom;break;case "djatoka":this.protocol=new Protocols.Djatoka;break;default:this.protocol=new Protocols.IIP}this.preload=!0==b.preload?!0:!1;this.effects=!1;this.annotations="function"==typeof this.initAnnotationTips&&b.annotations?b.annotations:null;this.click=b.click||null;this.max_size={};this.navWin={w:0,h:0};this.hei=this.wid=this.opacity=
0;this.resolutions;this.num_resolutions=0;this.view={x:0,y:0,w:this.wid,h:this.hei,res:0,rotation:0};this.navpos={};this.tileSize={};this.tiles=[];this.nTilesToLoad=this.nTilesLoaded=0;this.CSSprefix="";Browser.firefox?this.CSSprefix="-moz-":Browser.chrome||Browser.safari||Browser.Platform.ios?this.CSSprefix="-webkit-":Browser.opera?this.CSSprefix="-o-":Browser.ie&&(this.CSSprefix="ms-");window.addEvent("domready",this.load.bind(this))},requestImages:function(){this.canvas.setStyle("cursor","wait");
this.annotations&&this.destroyAnnotations();this.loadGrid();this.annotations&&(this.createAnnotations(),this.annotationTip&&this.annotationTip.attach(this.canvas.getChildren("div.annotation")))},loadGrid:function(){var a=this.preload?1:0,b=Math.floor(this.view.x/this.tileSize.w)-a,c=Math.floor(this.view.y/this.tileSize.h)-a;0>b&&(b=0);0>c&&(c=0);var d=this.view.rotatedW;this.wid<this.view.rotatedW&&(d=this.wid);var e=Math.ceil((d+this.view.x)/this.tileSize.w-1)+a,d=this.view.rotatedH;this.hei<this.view.rotatedH&&
(d=this.hei);var f=Math.ceil((d+this.view.y)/this.tileSize.h-1)+a,a=Math.ceil(this.wid/this.tileSize.h),d=Math.ceil(this.hei/this.tileSize.h);e>=a&&(e=a-1);f>=d&&(f=d-1);var g,h;h=d=0;var m=b+Math.round((e-b)/2),n=c+Math.round((f-c)/2),j=Array((e-b)*(e-b)),l=Array((e-b)*(e-b));l.empty();var k=0;for(g=c;g<=f;g++)for(c=b;c<=e;c++)j[k]={},j[k].n="spiral"==this.render?Math.abs(n-g)*Math.abs(n-g)+Math.abs(m-c)*Math.abs(m-c):Math.random(),j[k].x=c,j[k].y=g,k++,d=c+g*a,l.push(d);this.nTilesLoaded=0;this.nTilesToLoad=
k*this.images.length;this.canvas.get("morph").cancel();var q=this;this.canvas.getChildren("img").each(function(a){var b=parseInt(a.retrieve("tile"));l.contains(b)||(a.destroy(),q.tiles.erase(b))});j.sort(function(a,b){return a.n-b.n});for(e=0;e<k;e++)if(c=j[e].x,g=j[e].y,d=c+g*a,this.tiles.contains(d))this.nTilesLoaded+=this.images.length,this.showNavWindow&&this.refreshLoadBar(),this.nTilesLoaded>=this.nTilesToLoad&&(this.fireEvent("tilesLoaded"),this.canvas.setStyle("cursor","move"));else for(h=
0;h<this.images.length;h++)b=new Element("img",{alt:"tile","class":"layer"+h,styles:{left:c*this.tileSize.w,top:g*this.tileSize.h}}),this.effects&&b.setStyle("opacity",0.1),b.inject(this.canvas),f=this.protocol.getTileURL(this.server,this.images[h].src,this.view.res,this.images[h].sds||"0,90",this.images[h].cnt,d,c,g),b.addEvents({load:function(a,b){this.effects&&a.setStyle("opacity",1);!a.width||!a.height?a.fireEvent("error"):(this.nTilesLoaded++,this.showNavWindow&&this.refreshLoadBar(),this.nTilesLoaded>=
this.nTilesToLoad&&(this.fireEvent("tilesLoaded"),this.canvas.setStyle("cursor","move")),this.tiles.push(b))}.bind(this,b,d),error:function(){this.removeEvents("error");this.set("src",this.src+"?"+Date.now())}}),b.set("src",f),b.store("tile",d);1<this.images.length&&this.canvas.getChildren("img.layer"+(h-1)).setStyle("opacity",this.opacity)},getRegionURL:function(){var a=this.resolutions[this.view.res].w,b=this.resolutions[this.view.res].h;return this.protocol.getRegionURL(this.server,this.images[0].src,
{x:this.view.x/a,y:this.view.y/b,w:this.view.w/a,h:this.view.h/b},a)},key:function(a){var b=new DOMEvent(a),c=Math.round(this.view.w/4);switch(a.code){case 37:this.nudge(-c,0);IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.nudge(-c,0)});b.preventDefault();break;case 38:this.nudge(0,-c);IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.nudge(0,-c)});b.preventDefault();break;case 39:this.nudge(c,0);IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.nudge(c,
0)});b.preventDefault();break;case 40:this.nudge(0,c);IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.nudge(0,c)});b.preventDefault();break;case 107:a.control||(this.zoomIn(),IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.zoomIn()}),b.preventDefault());break;case 109:a.control||(this.zoomOut(),IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.zoomOut()}));break;case 189:a.control||this.zoomOut();break;case 72:this.toggleNavigationWindow();break;case 82:if(!a.control){var d=
this.view.rotation,d=a.shift?d-this.rotationStep%360:d+this.rotationStep%360;this.rotate(d);IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.rotate(d)})}break;case 65:this.annotations&&this.toggleAnnotations();break;case 27:this.fullscreen&&this.fullscreen.isFullscreen&&(IIPMooViewer.sync||this.toggleFullScreen());this.container.getElement("div.info").fade("out");break;case 70:IIPMooViewer.sync||this.toggleFullScreen()}this.fireEvent("keypress",a)},rotate:function(a){if(!Browser.buggy){var b=
this.getPointInCenter();this.view.rotation=a;this.canvas.setStyle(this.CSSprefix+"transform","rotate("+a+"deg)");this._updateRotatedWAndH();this.movePointInCenter(b.x,b.y);this.fireEvent("rotate",a)}},toggleFullScreen:function(){var a,b,c,d;!1!=this.enableFullscreen&&(this.fullscreen.isFullscreen?(a=this.fullscreen.targetsize.pos.x,b=this.fullscreen.targetsize.pos.y,c=this.fullscreen.targetsize.size.x,d=this.fullscreen.targetsize.size.y,p=this.fullscreen.targetsize.position,this.fullscreen.exit&&
this.fullscreen.isFullscreen&&this.fullscreen.exit.call(document)):(this.fullscreen.targetsize={pos:{x:this.container.style.left,y:this.container.style.top},size:{x:this.container.style.width,y:this.container.style.height},position:this.container.style.position},b=a=0,d=c="100%",p="absolute",this.fullscreen.enter&&!this.fullscreen.isFullscreen&&this.fullscreen.enter.call(this.container)),this.fullscreen.enter||(this.container.setStyles({left:a,top:b,width:c,height:d,position:p}),this.fullscreen.isFullscreen=
!this.fullscreen.isFullscreen,this.fullscreen.isFullscreen?this.showPopUp(IIPMooViewer.lang.exitFullscreen):this.container.getElements("div.message").destroy(),this.reload()),this.fullscreen.isFullscreen?this.fireEvent("fullscreenenter"):this.fireEvent("fullscreenexit"))},toggleNavigationWindow:function(){this.navcontainer&&this.navcontainer.get("reveal").toggle()},showPopUp:function(a){var b=(new Element("div",{"class":"message",html:a})).inject(this.container);(Browser.buggy?function(){b.destroy()}:
function(){b.fade("out").get("tween").chain(function(){b.destroy()})}).delay(3E3)},scrollNavigation:function(a){this.zone.get("morph").cancel();this.canvas.get("morph").cancel();var b=0,c=0,d=this.zone.getSize(),e=d.x,d=d.y;if(a.event){a.stop();var f=this.zone.getParent().getPosition(),b=a.page.x-f.x-Math.floor(e/2),c=a.page.y-f.y-Math.floor(d/2)}else if(b=a.offsetLeft,c=a.offsetTop-10,3>Math.abs(b-this.navpos.x)&&3>Math.abs(c-this.navpos.y))return;b>this.navWin.w-e&&(b=this.navWin.w-e);c>this.navWin.h-
d&&(c=this.navWin.h-d);0>b&&(b=0);0>c&&(c=0);b=Math.round(b*this.wid/this.navWin.w);c=Math.round(c*this.hei/this.navWin.h);e=Math.abs(b-this.view.x)<this.view.w/2&&Math.abs(c-this.view.y)<this.view.h/2&&0==this.view.rotation;this.view.x=b;this.view.y=c;this._refreshCanvasPosition(e);e||this.requestImages();a.event&&this.positionZone();IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.moveTo(b,c)});this.fireEvent("move",[this.view.x,this.view.y])},scroll:function(){var a=this.getXAndYByLeftAndTop();
this.moveTo(a.x,a.y);IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){a.moveTo(xmove,ymove)})},checkBounds:function(a,b){var c=0,d=0;0==this.getPositiveRotation()%180?(c=this.wid-this.view.w,d=this.hei-this.view.h):(c=this.wid-this.view.h,d=this.hei-this.view.w);a>c&&(a=c);b>d&&(b=d);if(0>a||0>c)a=0;if(0>b||0>d)b=0;this.view.x=a;this.view.y=b},moveTo:function(a,b){a==this.view.x&&b==this.view.y||(this.checkBounds(a,b),this._refreshCanvasPosition(),this.requestImages(),this.positionZone(),
this.fireEvent("move",[a,b]))},nudge:function(a,b){var c=this.getPositiveRotation(),d,e;0==c%360?(d=a,e=b):0==c%180?(d=-1*a,e=-1*b):0==c%270?(d=-1*b,e=a):0==c%90&&(d=b,e=-1*a);this.checkBounds(this.view.x+d,this.view.y+e);this._refreshCanvasPosition(!0);this.positionZone();var f=this;this.canvas.get("morph").chain(function(){f.fireEvent("move",[f.view.x,f.view.y])})},zoom:function(a){a=new DOMEvent(a);a.stop();var b=1,b=a.wheel&&0>a.wheel?-1:a.shift?-1:1;if(!(1==b&&this.view.res>=this.num_resolutions-
1)&&!(-1==b&&0>=this.view.res)){if(a.target){var c;c=a.target.get("class");if("zone"!=c&"navimage"!=c)c=this.canvas.getPosition(),a=this._transformRotateOverCanvasToOverImage(a.page.x-c.x,a.page.y-c.y),this.view.x=a.x-Math.floor(this.view.rotatedW/2),this.view.y=a.y-Math.floor(this.view.rotatedH/2);else{c=this.zone.getParent().getPosition();var d=this.zone.getParent().getSize(),e=this.zone.getSize();this.view.x=Math.round((a.page.x-c.x-e.x/2)*this.wid/d.x);this.view.y=Math.round((a.page.y-c.y-e.y/
2)*this.hei/d.y)}if(IIPMooViewer.sync){var f=this.view.x,g=this.view.y;IIPMooViewer.windows(this).each(function(a){a.view.x=f;a.view.y=g})}}-1==b?this.zoomOut():this.zoomIn();IIPMooViewer.sync&&IIPMooViewer.windows(this).each(function(a){-1==b?a.zoomOut():a.zoomIn()});this.fireEvent("move",[this.view.x,this.view.y])}},zoomIn:function(){this.view.res<this.num_resolutions-1&&(this.zoomTo(this.view.res+1),this.fireEvent("zoomin",this.view.res+0))},zoomOut:function(){0<this.view.res&&(this.zoomTo(this.view.res-
1),this.fireEvent("zoomout",this.view.res+0))},zoomTo:function(a){if(a!=this.view.res&&a<=this.num_resolutions-1&&0<=a){this.fireEvent("beforeZoom",a);var b=this.resolutions[a].w/this.resolutions[this.view.res].w,c,d;a>this.view.res?(c=this.resolutions[this.view.res].w>this.view.rotatedW?this.view.rotatedW*(b-1)/2:this.resolutions[a].w/2-this.view.rotatedW/2,d=this.resolutions[this.view.res].h>this.view.rotatedH?this.view.rotatedH*(b-1)/2:this.resolutions[a].h/2-this.view.rotatedH/2):(c=-this.view.rotatedW*
(1-b)/2,d=-this.view.rotatedH*(1-b)/2);this.view.x=Math.round(b*this.view.x+c);this.view.y=Math.round(b*this.view.y+d);this.view.res=a;this._zoom();this.fireEvent("zoom",a)}},_zoom:function(){this.wid=this.resolutions[this.view.res].w;this.hei=this.resolutions[this.view.res].h;this.view.x+this.view.rotatedW>this.wid&&(this.view.x=this.wid-this.view.rotatedW);0>this.view.x&&(this.view.x=0);this.view.y+this.view.rotatedH>this.hei&&(this.view.y=this.hei-this.view.rotatedH);0>this.view.y&&(this.view.y=
0);this._refreshCanvasPosition();this.canvas.setStyles({width:this.wid,height:this.hei});this.canvas.getChildren("img").destroy();this.tiles.empty();this.requestImages();this.positionZone();this.scale&&this.updateScale()},calculateNavSize:function(){var a=this.view.w*this.navWinSize;this.max_size.w>2*this.max_size.h&&(a=this.view.w/2);this.max_size.h/this.max_size.w*a>0.5*this.view.h&&(a=Math.round(0.5*this.view.h*this.max_size.w/this.max_size.h));this.navWin.w=a;this.navWin.h=Math.round(this.max_size.h/
this.max_size.w*a)},calculateSizes:function(){var a=this.container.getSize();this.view.x=-1;this.view.y=-1;this.view.w=a.x;this.view.h=a.y;this._updateRotatedWAndH();this.calculateNavSize();this.view.res=this.num_resolutions;var a=this.max_size.w,b=this.max_size.h;if("function"==typeOf(this.protocol.getResolutions)){this.resolutions=this.protocol.getResolutions(this.num_resolutions);for(var c=this.view.res=0;c<this.resolutions.length;c++)this.resolutions[c].w<this.view.w&&this.resolutions[c].h<this.view.h&&
this.view.res++}else{this.resolutions=[];this.resolutions.push({w:a,h:b});this.view.res=0;for(c=1;c<this.num_resolutions;c++)a=Math.ceil(a/2),b=Math.ceil(b/2),this.resolutions.push({w:a,h:b}),a<this.view.w&&b<this.view.h&&this.view.res++}this.view.res-=1;0>this.view.res&&(this.view.res=0);this.view.res>=this.num_resolutions&&(this.view.res=this.num_resolutions-1);this.resolutions.reverse();this.wid=this.resolutions[this.view.res].w;this.hei=this.resolutions[this.view.res].h},setCredit:function(a){this.container.getElement("div.credit").set("html",
a)},createWindows:function(){this.container=document.id(this.source);this.container.addClass("iipmooviewer");var a=this;"native"==this.enableFullscreen&&(document.documentElement.requestFullscreen?(this.fullscreen.eventChangeName="fullscreenchange",this.enter=this.container.requestFullscreen,this.exit=document.documentElement.cancelFullScreen):document.mozCancelFullScreen?(this.fullscreen.eventChangeName="mozfullscreenchange",this.fullscreen.enter=this.container.mozRequestFullScreen,this.fullscreen.exit=
document.documentElement.mozCancelFullScreen):document.webkitCancelFullScreen&&(this.fullscreen.eventChangeName="webkitfullscreenchange",this.fullscreen.enter=this.container.webkitRequestFullScreen,this.fullscreen.exit=document.documentElement.webkitCancelFullScreen),this.fullscreen.enter?document.addEvent(this.fullscreen.eventChangeName,function(){a.fullscreen.isFullscreen=!a.fullscreen.isFullscreen;a.reload()}):"100%"==this.container.getStyle("width")&&"100%"==this.container.getStyle("height")&&
(this.enableFullscreen=!1));(new Element("div",{"class":"info",styles:{opacity:0},events:{click:function(){this.fade("out")}},html:'<div><div><h2><a href="http://iipimage.sourceforge.net"><img alt="help icon" src="'+this.prefix+'iip.32x32.png"/></a>IIPMooViewer</h2>IIPImage HTML5 Ajax High Resolution Image Viewer - Version '+this.version+"<br/><ul><li>"+IIPMooViewer.lang.navigate+"</li><li>"+IIPMooViewer.lang.zoomIn+"</li><li>"+IIPMooViewer.lang.zoomOut+"</li><li>"+IIPMooViewer.lang.rotate+"</li><li>"+
IIPMooViewer.lang.fullscreen+"<li>"+IIPMooViewer.lang.annotations+"</li><li>"+IIPMooViewer.lang.navigation+"</li></ul><br/>"+IIPMooViewer.lang.more+' <a href="http://iipimage.sourceforge.net">http://iipimage.sourceforge.net</a></div></div>'})).inject(this.container);this.canvas=new Element("div",{"class":"canvas",morph:{transition:Fx.Transitions.Quad.easeInOut,onComplete:function(){a.requestImages()}}});this.touch=new Drag(this.canvas,{onDrag:this.scroll.bind(this)});this.canvas.inject(this.container);
this.canvas.addEvents({dblclick:this.zoom.bind(this),mousedown:function(a){(new DOMEvent(a)).stop()}});this.annotations&&this.initAnnotationTips();this.disableContextMenu&&this.container.addEvent("contextmenu",function(b){(new DOMEvent(b)).stop();a.container.getElement("div.info").fade(0.95);return!1});if(this.click){var b=this.click.bind(this);this.canvas.addEvent("mouseup",b);this.touch.addEvents({start:function(){a.canvas.removeEvents("mouseup")},complete:function(){a.canvas.addEvent("mouseup",
b)}})}this.container.addEvents({keydown:this.key.bind(this),mouseenter:function(){this.set("tabindex",0);this.focus()},mouseleave:function(){this.erase("tabindex");this.blur()},mousewheel:function(b){b.preventDefault();a.zoom(b)}});if(Browser.Platform.ios||Browser.Platform.android)this.container.addEvent("touchmove",function(a){a.preventDefault()}),document.body.addEvents({orientationchange:function(){a.container.setStyles({width:"100%",height:"100%"});this.reflow.delay(500,this)}.bind(this)}),this.container.addEvents({touchstart:function(b){b.preventDefault();
if(1==b.touches.length){var c=a.canvas.retrieve("taptime")||0,f=Date.now();a.canvas.store("taptime",f);a.canvas.store("tapstart",1);500>f-c?(a.canvas.eliminate("taptime"),c=a.canvas.getPosition(),b=a._transformRotateOverCanvasToOverImage(b.touches[0].pageX-c.x,b.touches[0].pageY-c.y),a.view.x=b.x-Math.floor(a.view.rotatedW/2),a.view.y=b.y-Math.floor(a.view.rotatedH/2),a.zoomIn(),a.fireEvent("move",[a.view.x,a.view.y])):(c=a.canvas.getPosition(a.container),a.touchstart=a._transformRotateOverCanvasToOverImage(b.touches[0].pageX-
c.x,b.touches[0].pageY-c.y))}},touchmove:function(b){b.preventDefault();if(1==b.touches.length){var c=a.canvas.getPosition(a.container),b=a._transformRotateOverCanvasToOverImage(b.touches[0].pageX-c.x,b.touches[0].pageY-c.y);a.checkBounds(a.view.x+(a.touchstart.x-b.x),a.view.y+(a.touchstart.y-b.y));a._refreshCanvasPosition()}},touchend:function(b){b.preventDefault();1==a.canvas.retrieve("tapstart")&&(a.canvas.eliminate("tapstart"),a.requestImages(),a.positionZone(),a.fireEvent("move",[a.view.x,a.view.y]))},
gesturestart:function(b){b.preventDefault();a.canvas.store("tapstart",1)},gesturechange:function(a){a.preventDefault()},gestureend:function(b){if(1==a.canvas.retrieve("tapstart"))if(a.canvas.eliminate("tapstart"),0.3<Math.abs(1-b.scale))1<b.scale?(a.zoomIn(),IIPMooViewer.sync&&IIPMooViewer.windows(a).each(function(a){a.zoomIn()})):(a.zoomOut(),IIPMooViewer.sync&&IIPMooViewer.windows(a).each(function(a){a.zoomOut()}));else if(10<Math.abs(b.rotation)){var c=a.view.rotation,c=0<b.rotation?c+a.rotationStep%
360:c-a.rotationStep%360;a.rotate(c);IIPMooViewer.sync&&IIPMooViewer.windows(a).each(function(a){a.rotate(c)})}}});var c=(new Element("img",{src:this.prefix+"iip.32x32.png","class":"logo",title:IIPMooViewer.lang.help,events:{click:function(){a.container.getElement("div.info").fade(0.95)},mousedown:function(a){(new DOMEvent(a)).stop()}}})).inject(this.container);Browser.Platform.ios&&window.navigator.standalone&&c.setStyle("top",15);this.credit&&(new Element("div",{"class":"credit",html:this.credit,
events:{mouseover:function(){this.fade([0.6,0.9])},mouseout:function(){this.fade(0.6)}}})).inject(this.container);this.scale&&(c=(new Element("div",{"class":"scale",title:IIPMooViewer.lang.scale,html:'<div class="ruler"></div><div class="label"></div>'})).inject(this.container),c.makeDraggable({container:this.container}),c.getElement("div.ruler").set("tween",{transition:Fx.Transitions.Quad.easeInOut}));this.calculateSizes();this.createNavigationWindow();this.annotations&&this.createAnnotations();
if(!Browser.Platform.ios&&!Browser.Platform.android){c="img.logo, div.toolbar, div.scale";if(Browser.ie8||Browser.ie7)c="img.logo, div.toolbar";new Tips(c,{className:"tip",onShow:function(a){a.setStyles({opacity:0,display:"block"}).fade(0.9)},onHide:function(a){a.fade("out").get("tween").chain(function(){a.setStyle("display","none")})}})}this.viewport&&(typeof("undefined"!=this.viewport.resolution)&&"undefined"==typeof this.resolutions[this.viewport.resolution])&&(this.viewport.resolution=null);this.viewport&&
null!=this.viewport.resolution&&(this.view.res=this.viewport.resolution,this.wid=this.resolutions[this.view.res].w,this.hei=this.resolutions[this.view.res].h,this.touch.options.limit={x:[this.view.w-this.wid,0],y:[this.view.h-this.hei,0]});this.viewport&&null!=this.viewport.x&&null!=this.viewport.y?this.moveTo(this.viewport.x*this.wid,this.viewport.y*this.hei):this.recenter();this.canvas.setStyles({width:this.wid,height:this.hei});this.requestImages();this.positionZone();this.scale&&this.updateScale();
this.viewport&&null!=this.viewport.rotation&&this.rotate(this.viewport.rotation);this.winResize&&window.addEvent("resize",this.reflow.bind(this));this.fireEvent("load")},createNavigationWindow:function(){if(this.showNavWindow||this.showNavButtons){this.navcontainer=new Element("div",{"class":"navcontainer",styles:{position:"absolute",width:this.navWin.w}});Browser.Platform.ios&&window.navigator.standalone&&this.navcontainer.setStyle("top",20);var a=new Element("div",{"class":"toolbar",events:{dblclick:function(a){a.getElement("div.navbuttons").get("slide").toggle()}.pass(this.container)}});
a.store("tip:text",IIPMooViewer.lang.drag);a.inject(this.navcontainer);if(this.showNavWindow){var b=new Element("div",{"class":"navwin",styles:{height:this.navWin.h}});b.inject(this.navcontainer);(new Element("img",{"class":"navimage",src:this.protocol.getThumbnailURL(this.server,this.images[0].src,this.navWin.w),events:{click:this.scrollNavigation.bind(this),"mousewheel:throttle(75)":this.zoom.bind(this),mousedown:function(a){(new DOMEvent(a)).stop()}}})).inject(b);this.zone=new Element("div",{"class":"zone",
morph:{duration:500,transition:Fx.Transitions.Quad.easeInOut},events:{"mousewheel:throttle(75)":this.zoom.bind(this),dblclick:this.zoom.bind(this)}});this.zone.inject(b)}if(this.showNavButtons){var c=new Element("div",{"class":"navbuttons"}),d=this.prefix;["reset","zoomIn","zoomOut"].each(function(a){(new Element("img",{src:d+a+(Browser.buggy?".png":".svg"),"class":a,events:{error:function(){this.removeEvents("error");this.src=this.src.replace(".svg",".png")}}})).inject(c)});c.inject(this.navcontainer);
c.set("slide",{duration:300,transition:Fx.Transitions.Quad.easeInOut,mode:"vertical"});c.getElement("img.zoomIn").addEvent("click",function(){IIPMooViewer.windows(this).each(function(a){a.zoomIn()});this.zoomIn()}.bind(this));c.getElement("img.zoomOut").addEvent("click",function(){IIPMooViewer.windows(this).each(function(a){a.zoomOut()});this.zoomOut()}.bind(this));c.getElement("img.reset").addEvent("click",function(){IIPMooViewer.windows(this).each(function(a){a.reload()});this.reload()}.bind(this))}this.showNavWindow&&
(new Element("div",{"class":"loadBarContainer",html:'<div class="loadBar"></div>',styles:{width:this.navWin.w-2},tween:{duration:1E3,transition:Fx.Transitions.Sine.easeOut,link:"cancel"}})).inject(this.navcontainer);this.navcontainer.inject(this.container);this.showNavWindow&&this.zone.makeDraggable({container:this.navcontainer.getElement("div.navwin"),onStart:function(){var a=this.zone.getPosition();this.navpos={x:a.x,y:a.y-10};this.zone.get("morph").cancel()}.bind(this),onComplete:this.scrollNavigation.bind(this)});
this.navcontainer.makeDraggable({container:this.container,handle:a});var e=this;this.navcontainer.get("reveal").addEvent("show",function(){e.fireEvent("navigationshow")});this.navcontainer.get("reveal").addEvent("hide",function(){e.fireEvent("navigationhide")})}},refreshLoadBar:function(){var a=this.nTilesLoaded/this.nTilesToLoad*this.navWin.w,b=this.navcontainer.getElement("div.loadBarContainer"),c=b.getElement("div.loadBar");c.setStyle("width",a);c.set("html",IIPMooViewer.lang.loading+"&nbsp;:&nbsp;"+
Math.round(100*(this.nTilesLoaded/this.nTilesToLoad))+"%");"0.85"!=b.style.opacity&&b.setStyles({visibility:"visible",opacity:0.85});this.nTilesLoaded>=this.nTilesToLoad&&b.fade("out")},updateScale:function(){var a=this.units.factor*this.scale*this.wid/this.max_size.w,b,c;b=0;a:for(;b<this.units.orders.length;b++)for(c=0;c<this.units.mults.length;c++)if(this.units.orders[b]*this.units.mults[c]*a>this.view.w/20)break a;b>=this.units.orders.length&&(b=this.units.orders.length-1);c>=this.units.mults.length&&
(c=this.units.mults.length-1);var d=this.units.mults[c]+this.units.dims[b],a=a*this.units.orders[b]*this.units.mults[c];this.container.getElement("div.scale div.ruler").tween("width",a);this.container.getElement("div.scale div.label").set("html",d)},changeImage:function(a){this.images=[{src:a,sds:"0,90",cnt:this.viewport&&null!=this.viewport.contrast?this.viewport.contrast:1}];this.protocol.getMetaData?this.protocol.getMetaData(function(b){this.max_size=b.max_size;this.tileSize=b.tileSize;this.num_resolutions=
b.num_resolutions;this.reload();this.container.getElement("div.navcontainer img.navimage")&&(this.container.getElement("div.navcontainer img.navimage").src=this.protocol.getThumbnailURL(this.server,a,this.navWin.w));this.fireEvent("imagechange",a)}.bind(this),this.server,this.images[0].src):(new Request({method:"get",url:this.protocol.getMetaDataURL(this.server,this.images[0].src),onComplete:function(b){b||alert("Error: No response from server "+this.server);this.reload();this.container.getElement("div.navcontainer img.navimage")&&
(this.container.getElement("div.navcontainer img.navimage").src=this.protocol.getThumbnailURL(this.server,a,this.navWin.w));this.fireEvent("imagechange",a)}.bind(this),onFailure:function(){alert("Error: Unable to get image metadata from server!")}})).send()},load:function(){this.loadoptions?(this.max_size=this.loadoptions.size,this.tileSize=this.loadoptions.tiles,this.num_resolutions=this.loadoptions.resolutions,this.createWindows()):this.protocol.getMetaData?this.protocol.getMetaData(function(a){this.max_size=
a.max_size;this.tileSize=a.tileSize;this.num_resolutions=a.num_resolutions;this.createWindows()}.bind(this),this.server,this.images[0].src):(new Request({method:"get",url:this.protocol.getMetaDataURL(this.server,this.images[0].src),onComplete:function(a){a=a||alert("Error: No response from server "+this.server);a=this.protocol.parseMetaData(a);this.max_size=a.max_size;this.tileSize=a.tileSize;this.num_resolutions=a.num_resolutions;this.createWindows()}.bind(this),onFailure:function(){alert("Error: Unable to get image metadata from server!")}})).send()},
reflow:function(){var a=this.container.getSize();this.view.w=a.x;this.view.h=a.y;this._updateRotatedWAndH();this._refreshCanvasPosition();this.calculateNavSize();this.container.getElements("div.navcontainer, div.navcontainer div.loadBarContainer").setStyle("width",this.navWin.w);this.showNavWindow&&(this.navcontainer&&this.navcontainer.setStyles({top:Browser.Platform.ios&&window.navigator.standalone?20:10,left:this.container.getPosition(this.container).x+this.container.getSize().x-this.navWin.w-10}),
this.zone&&this.zone.getParent().setStyle("height",this.navWin.h));this.scale&&(this.updateScale(),pos=this.container.getSize().y-this.container.getElement("div.scale").getSize().y-10,this.container.getElement("div.scale").setStyles({left:10,top:pos}));this.requestImages();this.positionZone();this.fireEvent("resize",[this.view.w,this.view.h])},reload:function(){this.canvas.get("morph").cancel();this.canvas.getChildren("img").destroy();this.tiles.empty();this.calculateSizes();this.viewport&&null!=
this.viewport.resolution&&(this.view.res=this.viewport.resolution,this.wid=this.resolutions[this.view.res].w,this.hei=this.resolutions[this.view.res].h,this.touch.options.limit={x:[this.view.w-this.wid,0],y:[this.view.h-this.hei,0]});this.viewport&&null!=this.viewport.x&&null!=this.viewport.y?this.moveTo(this.viewport.x*this.wid,this.viewport.y*this.hei):this.recenter();this.canvas.setStyles({width:this.wid,height:this.hei});this.reflow();this.viewport&&null!=this.viewport.rotation?this.rotate(this.viewport.rotation):
this.rotate(0)},recenter:function(){var a=Math.round((this.wid-this.view.rotatedW)/2);this.view.x=0>a?0:a;a=Math.round((this.hei-this.view.rotatedH)/2);this.view.y=0>a?0:a;this._refreshCanvasPosition()},constrain:function(){var a=0,b=0;0==this.view.rotation%180?(a=this.view.w-this.wid,b=this.view.h-this.hei):(a=this.view.w-this.hei,b=this.view.h-this.wid);var c=0<a?Math.round(a/2):0,d=0<b?Math.round(b/2):0,d=this._transformRotateLeftAndTopForCss(c,d),c=d.left,d=d.top;this.touch.options.limit={x:0<
a?[c,c]:[c+a,c],y:0<b?[d,d]:[d+b,d]}},positionZone:function(){if(this.showNavWindow){var a=this.view.x/this.wid*this.navWin.w;a>this.navWin.w&&(a=this.navWin.w);0>a&&(a=0);var b=this.view.y/this.hei*this.navWin.h;b>this.navWin.h&&(b=this.navWin.h);0>b&&(b=0);var c=this.view.w/this.wid*this.navWin.w;a+c>this.navWin.w&&(c=this.navWin.w-a);var d=this.view.h/this.hei*this.navWin.h;d+b>this.navWin.h&&(d=this.navWin.h-b);var e=this.zone.offsetHeight-this.zone.clientHeight;this.zone.morph({left:a,top:b+
8,width:0<c-e?c-e:1,height:0<d-e?d-e:1})}},getXAndYByLeftAndTop:function(){var a=this.canvas.getStyle("left").toInt(),b=this.canvas.getStyle("top").toInt(),a=this._transformRotateLeftAndTopForCss(a,b,!0);return this._transformRotateXAndY(-1*a.left,-1*a.top)},getVisibleLeftAndTop:function(){var a=this.canvas.getStyle("left").toInt(),b=this.canvas.getStyle("top").toInt();return this._transformRotateLeftAndTopForCss(a,b,!0)},getPointInCenter:function(){var a=this.wid>this.view.rotatedW?Math.round(this.view.x+
this.view.rotatedW/2):Math.round(this.wid/2),b=this.hei>this.view.rotatedH?Math.round(this.view.y+this.view.rotatedH/2):Math.round(this.hei/2);return{x:a,y:b}},movePointInCenter:function(a,b){this.view.x=-1;this.view.y=-1;this.moveTo(Math.round(a-this.view.rotatedW/2),Math.round(b-this.view.rotatedH/2))},getPositiveRotation:function(){var a=this.view.rotation,a=a%360;0>a&&(a+=360);return a},_refreshCanvasPosition:function(a){this.constrain();var b=this.touch.options.limit,c=this._transformRotateXAndY(this.view.x,
this.view.y,!0),d=this._transformRotateLeftAndTopForCss(-1*c.x,-1*c.y),c=d.left,d=d.top;a?this.canvas.morph({left:b.x[0]!=b.x[1]?c:b.x[0],top:b.y[0]!=b.y[1]?d:b.y[0]}):this.canvas.setStyles({left:b.x[0]!=b.x[1]?c:b.x[0],top:b.y[0]!=b.y[1]?d:b.y[0]})},_transformRotateXAndY:function(a,b,c){var d=this.getPositiveRotation(),e=0,f=0;0==d%180?(e=this.view.w-this.wid,f=this.view.h-this.hei):(e=this.view.w-this.hei,f=this.view.h-this.wid,c&&(c=e,e=f,f=c,d+=180));var g=c=0;0==d%360?(c=a,g=b):0==d%180?(c=-1*
(a+e),g=-1*(b+f)):0==d%270?(c=-1*(b+f),g=a):0==d%90&&(c=b,g=-1*(a+e));return{x:c,y:g}},_transformRotateLeftAndTopForCss:function(a,b,c){var d=this.getPositiveRotation(),e=Math.round(this.wid/2),f=Math.round(this.hei/2),g=0,h=0;0!=d%360&&(0==d%180?(g=this.wid-e-e,h=this.hei-f-f):0==d%270?(g=f-e,h=this.wid-e-f):0==d%90&&(g=this.hei-f-e,h=e-f));c?(a-=g,b-=h):(a+=g,b+=h);return{left:a,top:b}},_transformRotateOverCanvasToOverImage:function(a,b){var c=this.getPositiveRotation(),d,e;0==c%360?(d=a,e=b):0==
c%180?(d=this.wid-a,e=this.hei-b):0==c%270?(d=this.wid-b,e=a):0==c%90&&(d=b,e=this.hei-a);return{x:d,y:e}},_updateRotatedWAndH:function(){this.view.rotatedW=this.view.w;this.view.rotatedH=this.view.h;0!=this.view.rotation%180&&(this.view.rotatedW=this.view.h,this.view.rotatedH=this.view.w)}});IIPMooViewer.synchronize=function(a){this.sync=a};IIPMooViewer.windows=function(a){return!this.sync||!this.sync.contains(a)?[]:this.sync.filter(function(b){return b!=a})};
Browser.buggy=Browser.ie&&9>Browser.version?!0:!1;"undefined"===typeof Protocols&&(Protocols={});
