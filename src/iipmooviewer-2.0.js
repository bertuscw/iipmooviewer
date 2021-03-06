/*
   IIPMooViewer 2.0
   IIPImage Javascript Viewer <http://iipimage.sourceforge.net>

   Copyright (c) 2007-2012 Ruven Pillay <ruven@users.sourceforge.net>

   ---------------------------------------------------------------------------

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA.

   ---------------------------------------------------------------------------

   Built using the Mootools 1.4.5 javascript framework <http://www.mootools.net>


   Usage Example:

   viewer = new IIPMooViewer( 'div_id', { server: '/fcgi-bin/iipsrv.fcgi',
                              image: '/images/test.tif',
                              credit: 'copyright me 2011',
			      prefix: '/prefix/',
			      render: 'random',
                              showNavButtons: whether to show navigation buttons: true (default) or false
			      scale: 100 } );

   where the arguments are:
	i) The id of the main div element in which to create the viewer window
	ii) A hash containting:
	      image: the full image path (or array of paths) on the server (required)
              server: the iipsrv server full URL (defaults to "/fcgi-bin/iipsrv.fcgi")
	      credit: image copyright or information (optional)
	      prefix: path prefix if images or javascript subdirectory moved (default 'images/')
              render: tile rendering style - 'spiral' for a spiral from the centre or
                      'random' for a rendering of tiles in a random order
	      scale: pixels per mm
	      showNavWindow: whether to show the navigation window. Default true
	      showNavButtons: whether to show the navigation buttons. Default true
	      protocol: iip (default), zoomify or deepzoom
	      enableFullscreen: allow full screen mode. Default true
	      viewport: object containing x, y, resolution, rotation of initial view
	      winResize: whether view is reflowed on window resize. Default true
	      preload: load extra surrounding tiles
	      tileAltText: what is the alt text of the tiles. Default: 'tile'

   Note: Requires mootools version 1.4 or later <http://www.mootools.net>
       : The page MUST have a standard-compliant HTML declaration at the beginning

   Events:
      onLoad            Fired after the viewer is loaded
                        Signature: onLoad()

      onBeforeZoom      Fired before zoom in, zoom out or zoom to is performed. 
                        Signature: 
                          onBeforeZoom(resolution)
                        Arguments: 
                          1. resolution - (integer) The resolution to which will be zoomed

      onZoom            Fired after zoom in, zoom out or zoom to is performed. 
                        Signature: 
                          onZoom(resolution)
                        Arguments: 
                          1. resolution - (integer) The resolution to which is zoomed

      onZoomIn          Fired after zoom in is performed. 
                        Signature: 
                          onZoomIn(resolution)
                        Arguments: 
                          1. resolution - (integer) The resolution to which is zoomed

      onZoomOut         Fired after zoom out is performed. 
                        Signature: 
                          onZoomOut(resolution)
                        Arguments: 
                          1. resolution - (integer) The resolution to which is zoomed

      onRotate          Fired after a rotation is executed
                        Signature: 
                          onRotate(degrees)
                        Arguments: 
                          1. degrees - (integer) The degrees to which the rotation is made

      onMove            Fired after the image is moved to a particular point
                        Signature: 
                          onMove(x, y)
                        Arguments: 
                          1. x - (integer) 0 is the leftmost border of the actual image
                          2. y - (integer) 0 is the topmost border of the actual image

      onFullscreenEnter Fired after entering fullscreen mode
                        Sinature: onFullscreenEnter()

      onFullscreenExit  Fired after exiting fullscreen
                        Sinature: onFullscreenExit()

      onNavigationShow  Fired after navigation window is shown. Does not fire on initialization even when the navigation is shown.
                        Sinature: onNavigationShow()

      onNavigationHide  Fired after navigation window is hidden
                        Sinature: onNavigationHide()

      onImageChange     Fired after the image was changed. Does not fire on initialization.
                        Signature: onImageChange(image)
                        Arguments: 
                          1. image - (string) The src of the new image

      onResize          Fired after viewer is resized for any reason.
                        Signature: onResize(width, height)
                        Arguments: 
                          1. width - (integer) The new width of the viewer
                          2. height - (integer) The new height of the viewer

      onKeyPress        Fired when a key is pressed. After the build in key press handler.
                        Signature: onKeyPress(e)
                        Arguments: 
                          1. e - (DomEvent) Mootools dom event

      onTilesLoaded     Fired after tiles are loaded
                        Sinature: onTilesLoaded()
                        
*/



/* Main IIPMooViewer Class
 */
var IIPMooViewer = new Class({

  Extends: Events,

  version: '2.0',


  /* Constructor - see documentation for options
   */
  initialize: function( main_id, options ) {

    this.source = main_id || alert( 'No element ID given to IIPMooViewer constructor' );

    this.server = options.server || '/fcgi-bin/iipsrv.fcgi';

    this.render = options.render || 'spiral';

    // Set the initial zoom resolution and viewport
    this.viewport = null;
    if( options.viewport ){
      this.viewport = {
	resolution: (typeof(options.viewport.resolution)=='undefined') ? null : parseInt(options.viewport.resolution),
	rotation: (typeof(options.viewport.rotation)=='undefined') ? null : parseInt(options.viewport.rotation),
	contrast: (typeof(options.viewport.contrast)=='undefined') ? null : parseFloat(options.viewport.contrast),
	x: (typeof(options.viewport.x)=='undefined') ? null : parseFloat(options.viewport.x),
	y: (typeof(options.viewport.y)=='undefined') ? null : parseFloat(options.viewport.y)
      }
    }

    this.images = new Array(options['image'].length);
    options.image || alert( 'Image location not set in class constructor options');
    if( typeOf(options.image) == 'array' ){
       for( i=0; i<options.image.length;i++ ){
	 this.images[i] = { src:options.image[i], sds:"0,90", cnt:(this.viewport&&this.viewport.contrast!=null)? this.viewport.contrast : 1.0 };


       }
    }
    else this.images = [{ src:options.image, sds:"0,90", cnt:(this.viewport&&this.viewport.contrast!=null)? this.viewport.contrast : 1.0 } ];

    this.loadoptions = options.load || null;

    this.credit = options.credit || null;

    this.scale = options.scale || null;

    // Allow a range of units, multiples and labels. Allow user to also pass own user-defined units
    // First define default for meters
    this.units = {
      dims:   ["pm", "nm", "&#181;m", "mm", "cm", "m", "km"], // Unit suffixes
      orders: [ 1e-12, 1e-9, 1e-6, 0.001, 0.01, 1, 1000 ],    // Unit orders
      mults: [1,2,5,10,50,100],                               // Different scalings usable for each unit
      factor: 1000                                            // Default multiplication factor
    }

    if( options.units ){
      if( instanceOf(options.units,String) == false ) this.units = options.units;
      else if( options.units == "degrees" ){
	// Degree units for astronomy
	this.units = {
	  dims:   ["\'\'", "\'", "&deg"],
	  orders: [ 1/3600, 1/60, 1 ],
	  mults: [1,10,15,30],
	  factor: 3600
	}
      }
    }
    
    if (options.tileAltText) {
        this.tileAltText = options.tileAltText;
    } else {
        this.tileAltText = 'tile';
    }


    // Enable fullscreen mode? If false, then disable. Otherwise option can be "native" for HTML5
    // fullscreen API mode or "page" for standard web page fill page mode
    this.enableFullscreen = 'native';
    if( options.enableFullscreen == false ) this.enableFullscreen = false;
    if( options.enableFullscreen == 'page' ) this.enableFullscreen = 'page';
    this.fullscreen = null;
    if( this.enableFullscreen != false ){
      this.fullscreen = {
	isFullscreen: false,
	targetsize: {},
	eventChangeName: null,
	enter: null,
	exit: null
      }
    }


    // Disable the right click context menu on image tiles?
    this.disableContextMenu = true;


    // Navigation window options
    this.showNavWindow = (options.showNavWindow == false) ? false : true;
    this.showNavButtons = (options.showNavButtons == false) ? false : true;
    this.navWinSize = options.navWinSize || 0.2;


    this.winResize = (options.winResize==false)? false : true;

    this.prefix = options.prefix || 'images/';

    // Rotation options. Rotation step in degrees
    this.rotationStep = parseInt(options.rotationStep) || 45;

    // Set up our protocol handler
    if(options.protocol && !instanceOf(options.protocol, String)) {
        this.protocol = options.protocol;
    } else {
        switch( options.protocol ){
        case 'zoomify':
            this.protocol = new Protocols.Zoomify();
            break;
        case 'deepzoom':
            this.protocol = new Protocols.DeepZoom();
            break;
        case 'djatoka':
            this.protocol = new Protocols.Djatoka();
            break;
        default:
            this.protocol = new Protocols.IIP();
        }
    }


    // Preload tiles surrounding view window?
    this.preload = (options.preload == true) ? true : false;
    this.effects = false;

    // Set up our annotations if they have been set and our annotation functions implemented
    this.annotations = ((typeof(this.initAnnotationTips)=="function")&&options.annotations)? options.annotations : null;



    // If we want to assign a function for a click within the image
    // - used for multispectral curve visualization, for example
    this.click = options.click || null;

    this.max_size = {};      // Dimensions of largest resolution
    this.navWin = {w:0,h:0}; // Dimensions of navigation window
    this.opacity = 0;
    this.wid = 0;             // Width of current resolution
    this.hei = 0;             // Height of current resolution
    this.resolutions;         // List of available resolutions
    this.num_resolutions = 0; // Number of available resolutions
    this.view = {
      x: 0,                   // Location and dimensions of current visible view
      y: 0,
      w: this.wid,
      h: this.hei,
      res: 0,                 // Current resolution
      rotation: 0          // Current rotational orientation
    };

    this.navpos = {};         // Location of navigation drag zone
    this.tileSize = {};       // Tile size in pixels {w,h}


    // Number of tiles loaded
    this.tiles = new Array(); // List of tiles currently displayed
    this.nTilesLoaded = 0;    // Number of tiles loaded
    this.nTilesToLoad = 0;    // Number of tiles left to load


    // CSS3: Need to prefix depending on browser. Cannot handle IE<9
    this.CSSprefix = '';
    if( Browser.firefox ) this.CSSprefix = '-moz-';
    else if( Browser.chrome || Browser.safari || Browser.Platform.ios ) this.CSSprefix = '-webkit-';
    else if( Browser.opera ) this.CSSprefix = '-o-';
    else if( Browser.ie ) this.CSSprefix = 'ms-';  // Note that there should be no leading "-" !!


    // Load us up when the DOM is fully loaded!
    window.addEvent( 'domready', this.load.bind(this) );
  },



  /* Create the appropriate CGI strings and change the image sources
   */
  requestImages: function() {

    // Set our cursor
    this.canvas.setStyle( 'cursor', 'wait' );

    // Delete our annotations
    if( this.annotations ) this.destroyAnnotations();

    // Load our image mosaic
    this.loadGrid();

    // Create new annotations and attach the tooltip to them if it already exists
    if( this.annotations ){
      this.createAnnotations();
      if( this.annotationTip ) this.annotationTip.attach( this.canvas.getChildren('div.annotation') );
    }
  },



  /* Create a grid of tiles with the appropriate tile request and positioning
   */
  loadGrid: function(){
    
    var border = this.preload ? 1 : 0;

    // Get the start points for our tiles
    var startx = Math.floor( this.view.x / this.tileSize.w ) - border;
    var starty = Math.floor( this.view.y / this.tileSize.h ) - border;
    if( startx<0 ) startx = 0;
    if( starty<0 ) starty = 0;

    // If our size is smaller than the display window, only get these tiles!
    var len = this.view.rotatedW;
    if( this.wid < this.view.rotatedW ) len = this.wid;
    var endx =  Math.ceil( ((len + this.view.x)/this.tileSize.w) - 1 ) + border;


    len = this.view.rotatedH;
    if( this.hei < this.view.rotatedH ) len = this.hei;
    var endy = Math.ceil( ( (len + this.view.y)/this.tileSize.h) - 1 ) + border;


    // Number of tiles is dependent on view width and height
    var xtiles = Math.ceil( this.wid / this.tileSize.h );
    var ytiles = Math.ceil( this.hei / this.tileSize.h );

    if( endx >= xtiles ) endx = xtiles-1;
    if( endy >= ytiles ) endy = ytiles-1;


    /* Calculate the offset from the tile top left that we want to display.
       Also Center the image if our viewable image is smaller than the window
    */
    var xoffset = Math.floor(this.view.x % this.tileSize.w);
    if( this.wid < this.view.rotatedW ) xoffset -=  (this.view.rotatedW - this.wid)/2;

    var yoffset = Math.floor(this.view.y % this.tileSize.h);
    if( this.hei < this.view.rotatedH ) yoffset -= (this.view.rotatedH - this.hei)/2;

    var tile;
    var i, j, k, n;
    var left, top;
    k = 0;
    n = 0;

    var centerx = startx + Math.round((endx-startx)/2);
    var centery = starty + Math.round((endy-starty)/2);

    var map = new Array((endx-startx)*(endx-startx));
    var newTiles = new Array((endx-startx)*(endx-startx));
    newTiles.empty();

    // Should put this into
    var ntiles = 0;
    for( j=starty; j<=endy; j++ ){
      for (i=startx;i<=endx; i++) {

	map[ntiles] = {};
	if( this.render == 'spiral' ){
	  // Calculate the distance from the centre of the image
	  map[ntiles].n = Math.abs(centery-j)* Math.abs(centery-j) + Math.abs(centerx-i)*Math.abs(centerx-i);
	}
	// Otherwise do a random rendering
	else map[ntiles].n = Math.random();

	map[ntiles].x = i;
	map[ntiles].y = j;
	ntiles++;

	k = i + (j*xtiles);
	newTiles.push(k);

      }
    }

    this.nTilesLoaded = 0;
    this.nTilesToLoad = ntiles * this.images.length;

    // Delete the tiles from our old image mosaic which are not in our new list of tiles
    this.canvas.get('morph').cancel();
    var _this = this;
    this.canvas.getChildren('img').each( function(el){
      var index = parseInt(el.retrieve('tile'));
      if( !newTiles.contains(index) ){
        el.destroy();
	_this.tiles.erase(index);
      }
    });

    map.sort(function s(a,b){return a.n - b.n;});

    for( var m=0; m<ntiles; m++ ){

      var i = map[m].x;
      var j = map[m].y;

      // Sequential index of the tile in the tif image
      k = i + (j*xtiles);

      if( this.tiles.contains(k) ){
        this.nTilesLoaded += this.images.length;
        if( this.showNavWindow ) this.refreshLoadBar();
        if( this.nTilesLoaded >= this.nTilesToLoad ) {
          this.fireEvent('tilesLoaded');
          this.canvas.setStyle( 'cursor', 'move' );
        }
        continue;
      }

      // Iterate over the number of layers we have
      var n;
      for(n=0;n<this.images.length;n++){

        var tile = new Element('img', {
         alt: this.tileAltText,
          'class': 'layer'+n,
          'styles': {
            left: i*this.tileSize.w,
            top: j*this.tileSize.h
          }
        });
	// Move this out of the main constructor to avoid DOM attribute bloat
	if( this.effects ) tile.setStyle('opacity',0.1);

	// Inject into our canvas
	tile.inject(this.canvas);

	// Get tile URL from our protocol object
	var src = this.protocol.getTileURL( this.server, this.images[n].src, this.view.res, (this.images[n].sds||"0,90"), this.images[n].cnt, k, i, j );

	// Add our tile event functions after injection otherwise we get no event
	tile.addEvents({
	  'load': function(tile,id){
	     if( this.effects ) tile.setStyle('opacity',1);
	     if(!(tile.width&&tile.height)){
	       tile.fireEvent('error');
	       return;
	     }
	     this.nTilesLoaded++;
	     if( this.showNavWindow ) this.refreshLoadBar();
	     if( this.nTilesLoaded >= this.nTilesToLoad ) {
             this.fireEvent('tilesLoaded');
             this.canvas.setStyle( 'cursor', 'move' );
         }
	     this.tiles.push(id); // Add to our list of loaded tiles
	  }.bind(this,tile,k),
	  'error': function(){
	     // Try to reload if we have an error.
	     // Add a suffix to prevent caching, but remove error event to avoid endless loops
	     this.removeEvents('error');
	     var src = this.src;
	     this.set( 'src', src + '?'+ Date.now() );
	  }
	});

	// We must set the source at the end so that the 'load' function is properly fired
	tile.set( 'src', src );
	tile.store('tile',k);
      }

    }

    if( this.images.length > 1 ){
      var selector = 'img.layer'+(n-1);
      this.canvas.getChildren(selector).setStyle( 'opacity', this.opacity );
    }

  },


  /* Get a URL for a screenshot of the current view region
   */
  getRegionURL: function(){
    var w = this.resolutions[this.view.res].w;
    var h = this.resolutions[this.view.res].h;
    var region = {x: this.view.x/w, y: this.view.y/h, w: this.view.w/w, h: this.view.h/h};
    var url = this.protocol.getRegionURL( this.server, this.images[0].src, region, w );
    return url;
  },


  /* Handle various keyboard events such as allowing us to navigate within the image via the arrow keys etc.
   */
  key: function(e){

    var event = new DOMEvent(e);

    var d = Math.round(this.view.w/4);

    switch( e.code ){
    case 37: // left
      this.nudge(-d,0);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(-d,0); });
      }
      event.preventDefault(); // Prevent default only for navigational keys
      break;
    case 38: // up
      this.nudge(0,-d);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(0,-d); });
      }
      event.preventDefault();
      break;
    case 39: // right
      this.nudge(d,0);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(d,0); });
      }
      event.preventDefault();
      break;
    case 40: // down
      this.nudge(0,d);
      if( IIPMooViewer.sync ){
	IIPMooViewer.windows(this).each( function(el){ el.nudge(0,d); });
      }
      event.preventDefault();
      break;
    case 107: // plus
      if(!e.control){
	this.zoomIn();
	if( IIPMooViewer.sync ){
	  IIPMooViewer.windows(this).each( function(el){ el.zoomIn(); });
	}
	event.preventDefault();
      }
      break;
    case 109: // minus
      if(!e.control){
	this.zoomOut();
	if( IIPMooViewer.sync ){
	  IIPMooViewer.windows(this).each( function(el){ el.zoomOut(); });
	}
      }
      break;
    case 189: // minus
      if(!e.control) this.zoomOut();
      break;
    case 72: // h
      this.toggleNavigationWindow();
      break;
    case 82: // r
      if(!e.control){
	var r = this.view.rotation;
	if(e.shift) r -= this.rotationStep % 360;
	else r += this.rotationStep % 360;

	this.rotate( r );
	if( IIPMooViewer.sync ){
	  IIPMooViewer.windows(this).each( function(el){ el.rotate(r); });
	}
      }
      break;
    case 65: // a
      if( this.annotations ) this.toggleAnnotations();
      break;
    case 27: // esc
      if( this.fullscreen && this.fullscreen.isFullscreen ) if(!IIPMooViewer.sync) this.toggleFullScreen();
      this.container.getElement('div.info').fade('out');
      break;
    case 70: // f fullscreen, but if we have multiple views
      if(!IIPMooViewer.sync) this.toggleFullScreen();
      break;
    default:
      break;
    }
    
    this.fireEvent('keypress', e);
  },


  /* Rotate our view
   */
  rotate: function( r ){

    // Rotation works in Firefox 3.5+, Chrome, Safari and IE9+
    if( Browser.buggy ) return;
    
    var visibleCenter = this.getPointInCenter();
    
    // Set our rotation
    this.view.rotation = r;
    var angle = 'rotate(' + r + 'deg)';
    this.canvas.setStyle( this.CSSprefix+'transform', angle );
    
    this._updateRotatedWAndH();
    
    this.movePointInCenter(visibleCenter.x, visibleCenter.y);
    
    this.fireEvent('rotate', r);
  },
  
  
  /* Toggle fullscreen
   */
  toggleFullScreen: function(){
    var l,t,w,h;

    if(this.enableFullscreen == false) return;

    if( !this.fullscreen.isFullscreen ){
      // Note our size, location and positioning
      this.fullscreen.targetsize = {
	pos: {x: this.container.style.left, y: this.container.style.top },
	size: {x: this.container.style.width, y: this.container.style.height },
	position: this.container.style.position
      };
      l = 0;
      t = 0;
      w = '100%';
      h = '100%';
      p = 'absolute'; // Must make our container absolute for fullscreen

      if( this.fullscreen.enter && !this.fullscreen.isFullscreen ) this.fullscreen.enter.call(this.container);
    }
    else{
      l = this.fullscreen.targetsize.pos.x;
      t = this.fullscreen.targetsize.pos.y;
      w = this.fullscreen.targetsize.size.x;
      h = this.fullscreen.targetsize.size.y;
      p = this.fullscreen.targetsize.position;

      if( this.fullscreen.exit && this.fullscreen.isFullscreen ) this.fullscreen.exit.call(document);
    }

    if( !this.fullscreen.enter ){
      this.container.setStyles({
	left: l,
	top: t,
	width: w,
	height: h,
	position: p
      });
      this.fullscreen.isFullscreen = !this.fullscreen.isFullscreen;
      // Create a fullscreen message, then delete after a timeout
      if( this.fullscreen.isFullscreen ) this.showPopUp( IIPMooViewer.lang.exitFullscreen );
      else this.container.getElements('div.message').destroy();
      this.reload();
    }
    
    if (this.fullscreen.isFullscreen) {
      this.fireEvent('fullscreenenter');
    } else {
      this.fireEvent('fullscreenexit');
    }
  },


  /* Toggle the visibility of our navigation window
   */
  toggleNavigationWindow: function(){
    // For removing the navigation window if it exists - must use the get('reveal')
    // otherwise we do not have the Mootools extended object
    if( this.navcontainer ){
      this.navcontainer.get('reveal').toggle();
    }
  },


  /* Show a message, then delete after a timeout
   */
  showPopUp: function( text ) {
    var fs = new Element('div',{
      'class': 'message',
      'html': text
    }).inject( this.container );
    var del;
    if( Browser.buggy ) del = function(){ fs.destroy(); };
    else del = function(){ fs.fade('out').get('tween').chain( function(){ fs.destroy(); } ); };
    del.delay(3000);
  },


  /* Scroll resulting from a drag of the navigation window
   */
  scrollNavigation: function( e ) {
    
    //!TODO Currently navigation does not work with rotated images.

    // Cancel any running morphs on the canvas or zone
    this.zone.get('morph').cancel();
    this.canvas.get('morph').cancel();

    var xmove = 0;
    var ymove = 0;

    var zone_size = this.zone.getSize();
    var zone_w = zone_size.x;
    var zone_h = zone_size.y;

    // From a mouse click
    if( e.event ){
      e.stop();
      var pos = this.zone.getParent().getPosition();
      xmove = e.page.x - pos.x - Math.floor(zone_w/2);
      ymove = e.page.y - pos.y - Math.floor(zone_h/2);
    }
    else{
      // From a drag
      xmove = e.offsetLeft;
      ymove = e.offsetTop-10;
      if( (Math.abs(xmove-this.navpos.x) < 3) && (Math.abs(ymove-this.navpos.y) < 3) ) return;
    }

    if( xmove > (this.navWin.w - zone_w) ) xmove = this.navWin.w - zone_w;
    if( ymove > (this.navWin.h - zone_h) ) ymove = this.navWin.h - zone_h;
    if( xmove < 0 ) xmove = 0;
    if( ymove < 0 ) ymove = 0;

    xmove = Math.round(xmove * this.wid / this.navWin.w);
    ymove = Math.round(ymove * this.hei / this.navWin.h);

    // Only morph transition if we have moved a short distance and our rotation is zero
    var morphable = Math.abs(xmove-this.view.x)<this.view.w/2 && Math.abs(ymove-this.view.y)<this.view.h/2 && this.view.rotation==0;
    
    this.view.x = xmove;
    this.view.y = ymove;
    this._refreshCanvasPosition(morphable);

    // The morph event automatically calls requestImages
    if( !morphable ){
      this.requestImages();
    }

    // Position the zone after a click, but not for zone drags
    if( e.event ) this.positionZone();

    if(IIPMooViewer.sync){
      IIPMooViewer.windows(this).each( function(el){ el.moveTo(xmove,ymove); });
    }
    
    this.fireEvent('move', [this.view.x, this.view.y]);
  },



  /* Scroll from a drag event on the tile canvas
   */
  scroll: function(e) {
    
    var xAndY = this.getXAndYByLeftAndTop();
    this.moveTo(xAndY.x, xAndY.y);

    if( IIPMooViewer.sync ){
      IIPMooViewer.windows(this).each( function(el){ el.moveTo(xmove,ymove); });
    }

  },



  /* Check our scroll bounds.
   */
  checkBounds: function( x, y ) {
    
    var rotation = this.getPositiveRotation();
    
    var maxX = 0;
    var maxY = 0;
    if (rotation % 180 == 0) {
      maxX = this.wid - this.view.w;
      maxY = this.hei - this.view.h;
    } else {
      maxX = this.wid - this.view.h;
      maxY = this.hei - this.view.w;
    }
    
    if(x > maxX) x = maxX;
    if(y > maxY) y = maxY;

    if(x < 0 || maxX < 0) x = 0;
    if(y < 0 || maxY < 0) y = 0;

    this.view.x = x;
    this.view.y = y;
  },



  /* Move to a particular position on the image
   */
  moveTo: function( x, y ){

    // To avoid unnecessary redrawing ...
    if( x==this.view.x && y==this.view.y ) return;

    this.checkBounds(x,y);
    
    this._refreshCanvasPosition();

    this.requestImages();
    this.positionZone();
        
    this.fireEvent('move', [x, y]);
  },
  
  /* Nudge the view by a small amount
   */
  nudge: function( dx, dy ){
    var rotation = this.getPositiveRotation();
    
    var rdx, rdy;
    if (rotation % 360 == 0) {
      rdx = dx;
      rdy = dy;
    } else if (rotation % 180 == 0) {
      rdx = -1 * dx;
      rdy = -1 * dy;
    } else if (rotation % 270 == 0) {
      rdx = -1 * dy;
      rdy = dx;
    } else if (rotation % 90 == 0) {
      rdx = dy;
      rdy = -1 * dx;
    }

    this.checkBounds(this.view.x+rdx,this.view.y+rdy);

    // Check whether image size is less than viewport
    this._refreshCanvasPosition(true);
    
    this.positionZone();
    
    // Ensure that onMove event will be fired after the morph effect is finished.
    var _this = this;
    this.canvas.get('morph').chain(function () {
      _this.fireEvent('move', [_this.view.x, _this.view.y]);
    });
  },



  /* Generic zoom function for mouse wheel or click events
   */
  zoom: function( e ) {

    var event = new DOMEvent(e);

    // Stop all mousewheel events in order to prevent stray scrolling events
    event.stop();

    // Set z to +1 if zooming in and -1 if zooming out
    var z = 1;

    // For mouse scrolls
    if( event.wheel && event.wheel < 0 ) z = -1;
    // For double clicks
    else if( event.shift ) z = -1;
    else z = 1;

    // Bail out if at zoom limits
    if( (z==1) && (this.view.res >= this.num_resolutions-1) ) return;
    if( (z==-1) && (this.view.res <= 0) ) return;

    if( event.target ){
      var pos, xmove, ymove;
      var cc = event.target.get('class');

      if( cc != "zone" & cc != 'navimage' ){
	pos = this.canvas.getPosition();

	// Center our zooming on the mouse position when over the main target window        
        var xAndY = this._transformRotateOverCanvasToOverImage(event.page.x - pos.x, event.page.y - pos.y);
        
	this.view.x = xAndY.x - Math.floor(this.view.rotatedW/2);
	this.view.y = xAndY.y - Math.floor(this.view.rotatedH/2);
      }
      else{
	// For zooms with the mouse over the navigation window
        
        //!TODO Currently navigation does not work with rotated images.
        
	pos = this.zone.getParent().getPosition();
	var n_size = this.zone.getParent().getSize();
	var z_size = this.zone.getSize();
	this.view.x = Math.round( (event.page.x - pos.x - z_size.x/2) * this.wid/n_size.x );
	this.view.y = Math.round( (event.page.y - pos.y - z_size.y/2) * this.hei/n_size.y );
      }

      if( IIPMooViewer.sync ){
	var _x = this.view.x;
	var _y = this.view.y;
	IIPMooViewer.windows(this).each( function(el){
	  el.view.x = _x;
	  el.view.y = _y;
        });
      }
    }

    // Now do our actual zoom
    if( z == -1 ) this.zoomOut();
    else this.zoomIn();

    if( IIPMooViewer.sync ){
      IIPMooViewer.windows(this).each( function(el){
	if( z==-1) el.zoomOut();
	else el.zoomIn();
      });
    }
    
    // This zooming also changes x and y so we fire move event
    this.fireEvent('move', [this.view.x, this.view.y]);
  },



  /* Zoom in by a factor of 2
   */
  zoomIn: function(){
    if( this.view.res < this.num_resolutions-1 ) {
      this.zoomTo( this.view.res+1 );
      this.fireEvent('zoomin', this.view.res + 0);
    }
  },



  /* Zoom out by a factor of 2
   */
  zoomOut: function(){
    if( this.view.res > 0 ) {
      this.zoomTo( this.view.res-1 );
      this.fireEvent('zoomout', this.view.res + 0);
    }
  },



  /* Zoom to a particular resolution
   */
  zoomTo: function(r){

    if( r == this.view.res ) return;

    if( (r <= this.num_resolutions-1) && (r >= 0) ){

      this.fireEvent('beforeZoom', r);

      // Calculates zooming factor by actual difference in resolutions.
      var factor = this.resolutions[r].w / this.resolutions[this.view.res].w;

      // Calculate an offset to take into account the view port size
      // Center if our image width at this resolution is smaller than the view width - only need to do this on zooming in as our
      // constraining will automatically recenter when zooming out
      var xoffset, yoffset;
      if( r > this.view.res ){
	xoffset = (this.resolutions[this.view.res].w > this.view.rotatedW) ? this.view.rotatedW*(factor-1)/2 : this.resolutions[r].w/2 - this.view.rotatedW/2;
	yoffset = (this.resolutions[this.view.res].h > this.view.rotatedH) ? this.view.rotatedH*(factor-1)/2 : this.resolutions[r].h/2 - this.view.rotatedH/2;
      }
      else{
	xoffset = -this.view.rotatedW*(1-factor)/2;
	yoffset = -this.view.rotatedH*(1-factor)/2;;
      }

      this.view.x = Math.round( factor*this.view.x + xoffset );
      this.view.y = Math.round( factor*this.view.y + yoffset );

      this.view.res = r;

      this._zoom();
      
      this.fireEvent('zoom', r);
    }
  },


  /* Generic zoom function
   */
  _zoom: function(){

    // Get the image size for this resolution
    this.wid = this.resolutions[this.view.res].w;
    this.hei = this.resolutions[this.view.res].h;

    if( this.view.x + this.view.rotatedW > this.wid ) this.view.x = this.wid - this.view.rotatedW;
    if( this.view.x < 0 ) this.view.x = 0;

    if( this.view.y + this.view.rotatedH > this.hei ) this.view.y = this.hei - this.view.rotatedH;
    if( this.view.y < 0 ) this.view.y = 0;
    
    this._refreshCanvasPosition();
    this.canvas.setStyles({
      width: this.wid,
      height: this.hei
    });

    // Delete our image tiles
    this.canvas.getChildren('img').destroy();

    this.tiles.empty();
    
    this.requestImages();
    this.positionZone();
    if( this.scale ) this.updateScale();

  },


  /* Calculate navigation view size
   */
  calculateNavSize: function(){

    var thumb_width = this.view.w * this.navWinSize;;

    // For panoramic images, use a large navigation window
    if( this.max_size.w > 2*this.max_size.h ) thumb_width = this.view.w / 2;

    // Make sure our height is not more than 50% of view height
    if( (this.max_size.h/this.max_size.w)*thumb_width > this.view.h*0.5 ){
      thumb_width = Math.round( this.view.h * 0.5 * this.max_size.w/this.max_size.h );
    }

    this.navWin.w = thumb_width;
    this.navWin.h = Math.round( (this.max_size.h/this.max_size.w)*thumb_width );
  },


  /* Calculate some dimensions
   */
  calculateSizes: function(){

    // Set up our default sizes
    var target_size = this.container.getSize();
    this.view.x = -1; // Intitalize x,y with dummy values
    this.view.y = -1;
    this.view.w = target_size.x;
    this.view.h = target_size.y;
    this._updateRotatedWAndH();
    
    // Calculate our navigation window size
    this.calculateNavSize();

    // Determine the image size for this image view
    this.view.res = this.num_resolutions;
    var tx = this.max_size.w;
    var ty = this.max_size.h;

    // Calculate our list of resolution sizes and the best resolution
    // for our window size
    if (typeOf(this.protocol.getResolutions) == 'function') {
        // If the protocol provides reolutions - get them from it and do not calculate them here.
        // Num of resolutions comes also from the protocol but when getMetaData is called.
        this.resolutions = this.protocol.getResolutions(this.num_resolutions);

        // Calculates which resolution best fits the window.
        this.view.res = 0;
        for (var i = 0; i < this.resolutions.length; i ++) {
            if (this.resolutions[i].w < this.view.w && this.resolutions[i].h < this.view.h) {
                 this.view.res ++;
            }
        }
        this.view.res -= 1;
    } else {
        this.resolutions = new Array();
        this.resolutions.push({w:tx,h:ty});
        this.view.res = 0;
        for( var i=1; i<this.num_resolutions; i++ ){
          tx = Math.ceil(tx/2);
          ty = Math.ceil(ty/2);
          this.resolutions.push({w:tx,h:ty});
          if( tx < this.view.w && ty < this.view.h ) this.view.res++;
        }
        this.view.res -= 1;
    }

    // Sanity check and watch our for small screen displays causing the res to be negative
    if( this.view.res < 0 ) this.view.res = 0;
    if( this.view.res >= this.num_resolutions ) this.view.res = this.num_resolutions-1;

    // We reverse so that the smallest resolution is at index 0
    this.resolutions.reverse();
    this.wid = this.resolutions[this.view.res].w;
    this.hei = this.resolutions[this.view.res].h;

  },


  /* Update the message in the credit div
   */
  setCredit: function(message){
    this.container.getElement('div.credit').set( 'html', message );
  },


  /* Create our main and navigation windows
   */
  createWindows: function(){

    // Setup our class
    this.container = document.id(this.source);
    this.container.addClass( 'iipmooviewer' );

    // Use a lexical closure rather than binding to pass this to anonymous functions
    var _this = this;


    // Set up fullscreen API event support for Firefox 10+, Safari 5.1+ and Chrome 17+
    if( this.enableFullscreen == 'native' ){

      if( document.documentElement.requestFullscreen ){
        this.fullscreen.eventChangeName = 'fullscreenchange';
        this.enter =  this.container.requestFullscreen;
        this.exit = document.documentElement.cancelFullScreen;
      }
      else if( document.mozCancelFullScreen ){
        this.fullscreen.eventChangeName = 'mozfullscreenchange';
        this.fullscreen.enter = this.container.mozRequestFullScreen;
        this.fullscreen.exit = document.documentElement.mozCancelFullScreen;
      }
      else if( document.webkitCancelFullScreen ){
        this.fullscreen.eventChangeName = 'webkitfullscreenchange';
        this.fullscreen.enter = this.container.webkitRequestFullScreen;
        this.fullscreen.exit = document.documentElement.webkitCancelFullScreen;
      }

      if( this.fullscreen.enter ){
	// Monitor Fullscreen change events
	document.addEvent( this.fullscreen.eventChangeName, function(){
			     _this.fullscreen.isFullscreen = !_this.fullscreen.isFullscreen;
			     _this.reload();
			   });
      }
      else{
	// Disable fullscreen mode if we are already at 100% size and we don't have real Fullscreen
	if( this.container.getStyle('width') == '100%' && this.container.getStyle('height') == '100%' ){
	  this.enableFullscreen = false;
	}
      }
    }


    // Our modal information box
    new Element( 'div', {
      'class': 'info',
      'styles': { opacity: 0 },
      'events': {
	click: function(){ this.fade('out'); }
      },
      'html': '<div><div><h2><a href="http://iipimage.sourceforge.net"><img alt="help icon" src="'+this.prefix+'iip.32x32.png"/></a>IIPMooViewer</h2>IIPImage HTML5 Ajax High Resolution Image Viewer - Version '+this.version+'<br/><ul><li>'+IIPMooViewer.lang.navigate+'</li><li>'+IIPMooViewer.lang.zoomIn+'</li><li>'+IIPMooViewer.lang.zoomOut+'</li><li>'+IIPMooViewer.lang.rotate+'</li><li>'+IIPMooViewer.lang.fullscreen+'<li>'+IIPMooViewer.lang.annotations+'</li><li>'+IIPMooViewer.lang.navigation+'</li></ul><br/>'+IIPMooViewer.lang.more+' <a href="http://iipimage.sourceforge.net">http://iipimage.sourceforge.net</a></div></div>'
    }).inject( this.container );

    // Create our main window target div, add our events and inject inside the frame
    this.canvas = new Element('div', {
      'class': 'canvas',
      'morph': {
	transition: Fx.Transitions.Quad.easeInOut,
	onComplete: function(){
	  _this.requestImages();
	}
      }
    });


    // Create our main view drag object for our canvas.
    // Add synchronization via the Drag start hook
    this.touch = new Drag( this.canvas, {
      onDrag: this.scroll.bind(this)
    });


    // Inject our canvas into the container, but events need to be added after injection
    this.canvas.inject( this.container );
    this.canvas.addEvents({
      'dblclick': this.zoom.bind(this),
      'mousedown': function(e){ var event = new DOMEvent(e); event.stop(); }
    });


    // Initialize canvas events for our annotations
    if( this.annotations ) this.initAnnotationTips();


    // Disable the right click context menu if requested and show our info window instead
    if( this.disableContextMenu ){
      this.container.addEvent( 'contextmenu', function(e){
					   var event = new DOMEvent(e);
					   event.stop();
					   _this.container.getElement('div.info').fade(0.95);
					   return false;
					 } )
    }


    // Add an external callback if we have been given one
    if( this.click ){

      // But add it mouseup rather than click to avoid triggering during dragging
      var fn = this.click.bind(this);
      this.canvas.addEvent( 'mouseup', fn );

      // And additionally disable this during dragging
      this.touch.addEvents({
	start: function(e){ _this.canvas.removeEvents( 'mouseup' ); },
	complete: function(e){ _this.canvas.addEvent( 'mouseup', fn ); }
      });
    }


    // We want to add our keyboard events, but only when we are over the viewer div
    // In order to add keyboard events to a div, we need to give it a tabindex and focus it
    // Focus and defocus when we move into and out of the div.
    // Also prevent default scrolling via mousewheel
    this.container.addEvents({
      'keydown': this.key.bind(this),
      'mouseenter': function(){
	this.set('tabindex',0);
	this.focus();
      },
      'mouseleave': function(){
	this.erase('tabindex');
	this.blur();
      },
      'mousewheel': function(e){ 
        e.preventDefault();
        _this.zoom(e);
      }
    });


    // Add touch and gesture support for mobile iOS and Android
    if( Browser.Platform.ios || Browser.Platform.android ){

      // Prevent dragging on the container div
      this.container.addEvent('touchmove', function(e){ e.preventDefault(); } );

      // Disable elastic scrolling and handle changes in orientation on mobile devices.
      // These events need to be added to the document body itself
      document.body.addEvents({
	'orientationchange': function(){
	   _this.container.setStyles({
	     width: '100%',
	     height: '100%'
	    });
	    // Need to set a timeout the div is not resized immediately on some versions of iOS
	    this.reflow.delay(500,this);
	  }.bind(this)
      });

      // Now add our touch canvas events
      this.container.addEvents({
        'touchstart': function(e){
	  e.preventDefault();
	  // Only handle single finger events
          if(e.touches.length == 1){
	    // Simulate a double click with a timer
	    var t1 = _this.canvas.retrieve('taptime') || 0;
	    var t2 = Date.now();
	    _this.canvas.store( 'taptime', t2 );
	    _this.canvas.store( 'tapstart', 1 );
	    if( t2-t1 < 500 ){
	      _this.canvas.eliminate('taptime');
              // Center our zooming on the mouse position when over the main target window        
              pos = _this.canvas.getPosition();
              var xAndY = _this._transformRotateOverCanvasToOverImage(e.touches[0].pageX - pos.x, e.touches[0].pageY - pos.y);
              _this.view.x = xAndY.x - Math.floor(_this.view.rotatedW/2);
              _this.view.y = xAndY.y - Math.floor(_this.view.rotatedH/2);
	      _this.zoomIn();
              // Thiw zoom also changes x and y so we fire move event.
              _this.fireEvent('move', [_this.view.x, _this.view.y]);
	    }
	    else{
	      var pos = _this.canvas.getPosition(_this.container);
              _this.touchstart = _this._transformRotateOverCanvasToOverImage(e.touches[0].pageX - pos.x, e.touches[0].pageY - pos.y);
	    }
	  }
        },
	'touchmove': function(e){
          e.preventDefault();
	  // Only handle single finger events
	  if(e.touches.length == 1){            
            var pos = _this.canvas.getPosition(_this.container);
            var newXAndY = _this._transformRotateOverCanvasToOverImage(e.touches[0].pageX - pos.x, e.touches[0].pageY - pos.y);
            var xMove = _this.touchstart.x - newXAndY.x;
            var yMove = _this.touchstart.y - newXAndY.y;            
            _this.checkBounds(_this.view.x + xMove, _this.view.y + yMove);
            _this._refreshCanvasPosition();
	  }
        },
	'touchend': function(e){
          e.preventDefault();
	  // Update our tiles and navigation window
	  if( _this.canvas.retrieve('tapstart') == 1 ){
	    _this.canvas.eliminate('tapstart');
	    _this.requestImages();
	    _this.positionZone();
            _this.fireEvent('move', [_this.view.x, _this.view.y]);
	    //	    if(IIPMooViewer.sync){
	    //IIPMooViewer.windows(this).each( function(el){ el.moveTo(_this.view.x,_this.view.); });
	    // }
	  }
        },
	'gesturestart': function(e){
	  e.preventDefault();
	  _this.canvas.store('tapstart', 1);
	},
	'gesturechange': function(e){
	  e.preventDefault();
	},
	'gestureend': function(e){
	  if( _this.canvas.retrieve('tapstart') == 1 ){
	    _this.canvas.eliminate('tapstart');
	    // Handle scale
	    if( Math.abs(1-e.scale)>0.3 ){
	      if( e.scale > 1 ){
		_this.zoomIn();
		if(IIPMooViewer.sync){
		  IIPMooViewer.windows(_this).each( function(el){ el.zoomIn(); });
		}
	      }
	      else{
		_this.zoomOut();
		if(IIPMooViewer.sync){
                  IIPMooViewer.windows(_this).each( function(el){ el.zoomOut(); });
                }
	      }
	    }
	    // And rotation
	    else if( Math.abs(e.rotation) > 10 ){
	      var r = _this.view.rotation;
	      if( e.rotation > 0 ) r += _this.rotationStep % 360;
	      else r -= _this.rotationStep % 360;
	      _this.rotate(r);
	      if(IIPMooViewer.sync){
		IIPMooViewer.windows(_this).each( function(el){ el.rotate(r); });
	      }
	    }
	  }
	}
      });
    }

    // Add our logo and a tooltip explaining how to use the viewer
    var info = new Element( 'img', {
      'src': this.prefix+'iip.32x32.png',
      'class': 'logo',
      'title': IIPMooViewer.lang.help,
      'events': {
	click: function(){ _this.container.getElement('div.info').fade(0.95); },
	// Prevent user from dragging image
	mousedown: function(e){ var event = new DOMEvent(e); event.stop(); }
      }
    }).inject(this.container);

    // For standalone iphone/ipad the logo gets covered by the status bar
    if( Browser.Platform.ios && window.navigator.standalone ) info.setStyle( 'top', 15 );

    // Add some information or credit
    if( this.credit ){
      new Element( 'div', {
	'class': 'credit',
	'html': this.credit,
	'events': {
	  // We specify the start value to stop a strange problem where on the first
	  // mouseover we get a sudden transition to opacity 1.0
	  mouseover: function(){ this.fade([0.6,0.9]); },
	  mouseout: function(){ this.fade(0.6); }
	}
      }).inject(this.container);
    }


    // Add a scale if requested. Make it draggable and add a tween transition on rescaling
    if( this.scale ){
      var scale = new Element( 'div', {
	'class': 'scale',
	'title': IIPMooViewer.lang.scale,
	'html': '<div class="ruler"></div><div class="label"></div>'
      }).inject(this.container);
      scale.makeDraggable({container: this.container});
      scale.getElement('div.ruler').set('tween', {
	transition: Fx.Transitions.Quad.easeInOut
      });
    }


    // Calculate some sizes and create the navigation window
    this.calculateSizes();
    this.createNavigationWindow();
    if( this.annotations ) this.createAnnotations();


    // Add tips if we are not on a mobile device
    if( !(Browser.Platform.ios||Browser.Platform.android) ){
      var tip_list = 'img.logo, div.toolbar, div.scale';
      if( Browser.ie8||Browser.ie7 ) tip_list = 'img.logo, div.toolbar'; // IE8 bug which triggers window resize
      new Tips( tip_list, {
	className: 'tip', // We need this to force the tip in front of nav window
	  onShow: function(tip,hovered){
	    tip.setStyles({ opacity: 0, display: 'block' }).fade(0.9);
	  },
	  onHide: function(tip, hovered){
	    tip.fade('out').get('tween').chain( function(){ tip.setStyle('display', 'none'); } );
	  }
	});
    }

    // Clear invalid this.viewport.resolution values
    if( this.viewport && typeof(this.viewport.resolution!='undefined') &&
	typeof(this.resolutions[this.viewport.resolution])=='undefined'){
      this.viewport.resolution=null;
    }

    // Set our initial viewport resolution if this has been set
    if( this.viewport && this.viewport.resolution!=null ){
      this.view.res = this.viewport.resolution;
      this.wid = this.resolutions[this.view.res].w;
      this.hei = this.resolutions[this.view.res].h;
      this.touch.options.limit = { x: Array(this.view.w-this.wid,0), y: Array(this.view.h-this.hei,0) };
    }

    // Center our view or move to initial viewport position
    if( this.viewport && this.viewport.x!=null && this.viewport.y!=null ){
      this.moveTo( this.viewport.x*this.wid, this.viewport.y*this.hei );
    }
    else this.recenter();


    // Set the size of the canvas to that of the full image at the current resolution
    this.canvas.setStyles({
      width: this.wid,
      height: this.hei
    });


    // Load our images
    this.requestImages();
    this.positionZone();
    if( this.scale ) this.updateScale();

    // Set initial rotation
    if( this.viewport && this.viewport.rotation!=null ){
      this.rotate( this.viewport.rotation );
    }

    // Add our key press and window resize events. Do this at the end to avoid reloading before
    // we are fully set up
    if(this.winResize) window.addEvent( 'resize', this.reflow.bind(this) );

    this.fireEvent('load');

  },



  /* Create our navigation window
   */
  createNavigationWindow: function() {

    // If the user does not want a navigation window, do not create one!
    if( (!this.showNavWindow) && (!this.showNavButtons) ) return;

    this.navcontainer = new Element( 'div', {
      'class': 'navcontainer',
      'styles': {
	position: 'absolute',
	width: this.navWin.w
      }
    });
    
    // For standalone iphone/ipad the logo gets covered by the status bar
    if( Browser.Platform.ios && window.navigator.standalone ) this.navcontainer.setStyle( 'top', 20 );

    var toolbar = new Element( 'div', {
      'class': 'toolbar',
      'events': {
	 dblclick: function(source){
	   source.getElement('div.navbuttons').get('slide').toggle();
         }.pass(this.container)
      }
    });
    toolbar.store( 'tip:text', IIPMooViewer.lang.drag );
    toolbar.inject(this.navcontainer);


    // Create our navigation div and inject it inside our frame if requested
    if( this.showNavWindow ){

      var navwin = new Element( 'div', {
	'class': 'navwin',
        'styles': {
	  height: this.navWin.h
	}
      });
      navwin.inject( this.navcontainer );


      // Create our navigation image and inject inside the div we just created
      var navimage = new Element( 'img', {
	'class': 'navimage',
	'src': this.protocol.getThumbnailURL(this.server,this.images[0].src,this.navWin.w),
        'events': {
          'click': this.scrollNavigation.bind(this),
          'mousewheel:throttle(75)': this.zoom.bind(this),
          // Prevent user from dragging navigation image
          'mousedown': function(e){ var event = new DOMEvent(e); event.stop(); }
        }
      });
      navimage.inject(navwin);


      // Create our navigation zone and inject inside the navigation div
      this.zone = new Element( 'div', {
        'class': 'zone',
        'morph': {
	  duration: 500,
	  transition: Fx.Transitions.Quad.easeInOut
        },
	'events': {
 	  'mousewheel:throttle(75)': this.zoom.bind(this),
 	  'dblclick': this.zoom.bind(this)
	}
      });
      this.zone.inject(navwin);

    }


    // Create our nav buttons if requested
    if( this.showNavButtons ){

      var navbuttons = new Element('div', {
	'class': 'navbuttons'
      });

      // Create our buttons as SVG with fallback to PNG
      var prefix = this.prefix;
      ['reset','zoomIn','zoomOut'].each( function(k){
	new Element('img',{
	  'src': prefix + k + (Browser.buggy?'.png':'.svg'),
	  'class': k,
 	  'events':{
	    'error': function(){
	      this.removeEvents('error'); // Prevent infinite reloading
	      this.src = this.src.replace('.svg','.png'); // PNG fallback
	    }
	  }
	}).inject(navbuttons);
      });

      navbuttons.inject(this.navcontainer);

      // Need to set this after injection
      navbuttons.set('slide', {duration: 300, transition: Fx.Transitions.Quad.easeInOut, mode:'vertical'});

      // Add events to our buttons
      navbuttons.getElement('img.zoomIn').addEvent( 'click', function(){
	IIPMooViewer.windows(this).each( function(el){ el.zoomIn(); });
	this.zoomIn();
      }.bind(this) );

      navbuttons.getElement('img.zoomOut').addEvent( 'click', function(){
	IIPMooViewer.windows(this).each( function(el){ el.zoomOut(); });
	this.zoomOut();
      }.bind(this) );

      navbuttons.getElement('img.reset').addEvent( 'click', function(){
	IIPMooViewer.windows(this).each( function(el){ el.reload(); });
	this.reload();
      }.bind(this) );

    }

    // Add a progress bar only if we have the navigation window visible
    if( this.showNavWindow ){

      // Create our progress bar
      var loadBarContainer = new Element('div', {
	'class': 'loadBarContainer',
        'html': '<div class="loadBar"></div>',
        'styles': {
           width: this.navWin.w - 2
         },
         'tween': {
           duration: 1000,
           transition: Fx.Transitions.Sine.easeOut,
	   link: 'cancel'
         }
      });
      loadBarContainer.inject(this.navcontainer);
    }


    // Inject our navigation container into our holding div
    this.navcontainer.inject(this.container);


    if( this.showNavWindow ){
      this.zone.makeDraggable({
	container: this.navcontainer.getElement('div.navwin'),
          // Take a note of the starting coords of our drag zone
          onStart: function() {
	    var pos = this.zone.getPosition();
	    this.navpos = {x: pos.x, y: pos.y-10};
	    this.zone.get('morph').cancel();
	  }.bind(this),
	onComplete: this.scrollNavigation.bind(this)
        });
    }

    this.navcontainer.makeDraggable( {container:this.container, handle:toolbar} );
    
    // Attaching onNavigationShow and onNavigationHide events
    var _this = this;
    this.navcontainer.get('reveal').addEvent('show', function () {
      _this.fireEvent('navigationshow');
    });
    this.navcontainer.get('reveal').addEvent('hide', function () {
      _this.fireEvent('navigationhide');
    });
  },



  /* Update the tile download progress bar
   */
  refreshLoadBar: function() {

    // Update the loaded tiles number, grow the loadbar size
    var w = (this.nTilesLoaded / this.nTilesToLoad) * this.navWin.w;

    var loadBarContainer = this.navcontainer.getElement('div.loadBarContainer');
    var loadBar = loadBarContainer.getElement('div.loadBar');
    loadBar.setStyle( 'width', w );

    // Display the % in the progress bar
    loadBar.set( 'html', IIPMooViewer.lang.loading + '&nbsp;:&nbsp;' + Math.round(this.nTilesLoaded/this.nTilesToLoad*100) + '%' );

    if( loadBarContainer.style.opacity != '0.85' ){
      loadBarContainer.setStyles({
	visibility: 'visible',
	opacity: 0.85
      });
    }

    // If we're done with loading, fade out the load bar
    if( this.nTilesLoaded >= this.nTilesToLoad ){
      // Fade out our progress bar and loading animation in a chain
      loadBarContainer.fade('out');
    }

  },



  /* Update the scale on our image - change the units if necessary
   */
  updateScale: function() {


    // Determine the number of pixels a unit takes at this scale. x1000 because we want per m
    var pixels = this.units.factor * this.scale * this.wid / this.max_size.w;

    // Loop through until we get a good fit scale. Be careful to break fully from the outer loop
    var i, j;
    outer: for( i=0;i<this.units.orders.length;i++ ){
      for( j=0; j<this.units.mults.length; j++ ){
	if( this.units.orders[i]*this.units.mults[j]*pixels > this.view.w/20 ) break outer;
      }
    }
    // Make sure we don't overrun the end of our array if we don't find a match
    if( i >= this.units.orders.length ) i = this.units.orders.length-1;
    if( j >= this.units.mults.length ) j = this.units.mults.length-1;

    var label = this.units.mults[j] + this.units.dims[i];
    pixels = pixels*this.units.orders[i]*this.units.mults[j];

    // Use a smooth transition to resize and set the units
    this.container.getElement('div.scale div.ruler').tween( 'width', pixels );
    this.container.getElement('div.scale div.label').set( 'html', label );

  },



  /* Change our image and reload our view
   */
  changeImage: function( image ){
      
    // Replace our image array
    this.images = [{ src:image, sds:"0,90", cnt:(this.viewport&&this.viewport.contrast!=null)? this.viewport.contrast : 1.0 } ];

    // Send a new AJAX request for the metadata
    if(this.protocol.getMetaData) {        
      this.protocol.getMetaData(function(result) {
        this.max_size = result.max_size;
        this.tileSize = result.tileSize;
        this.num_resolutions = result.num_resolutions;

        this.reload();

        // Change our navigation image
        if (this.container.getElement('div.navcontainer img.navimage')) {
          this.container.getElement('div.navcontainer img.navimage').src =
            this.protocol.getThumbnailURL(this.server, image, this.navWin.w );
        }
        
        this.fireEvent('imagechange', image);
      }.bind(this), this.server, this.images[0].src);
    } else {
      var metadata = new Request({
        method: 'get',
        url: this.protocol.getMetaDataURL( this.server, this.images[0].src ),
        onComplete: function(transport){
          var response = transport || alert( "Error: No response from server " + this.server );
          
          var result = this.protocol.parseMetaData(response);
          
          this.max_size = result.max_size;
          this.tileSize = result.tileSize;
          this.num_resolutions = result.num_resolutions;
          
          this.reload();
          
          // Change our navigation image
          if (this.container.getElement('div.navcontainer img.navimage')) {
            this.container.getElement('div.navcontainer img.navimage').src =
              this.protocol.getThumbnailURL(this.server, image, this.navWin.w );
          }
        
          this.fireEvent('imagechange', image);
        }.bind(this),
          onFailure: function(){ alert('Error: Unable to get image metadata from server!'); }
      } );

      // Send the metadata request
      metadata.send();
    }
  },



  /* Use an AJAX request to get the image size, tile size and number of resolutions from the server
   */
  load: function(){

    // If we have supplied the relevent information, simply use the given data
    if( this.loadoptions ){
      this.max_size = this.loadoptions.size;
      this.tileSize = this.loadoptions.tiles;
      this.num_resolutions = this.loadoptions.resolutions;
      this.createWindows();
    }
    else{
      
      if(this.protocol.getMetaData) {
        this.protocol.getMetaData(function(result) {
          this.max_size = result.max_size;
          this.tileSize = result.tileSize;
          this.num_resolutions = result.num_resolutions;

          this.createWindows();
        }.bind(this), this.server, this.images[0].src);
      } else {
        var metadata = new Request({
          method: 'get',
          url: this.protocol.getMetaDataURL( this.server, this.images[0].src ),
          onComplete: function(transport){
            var response = transport || alert( "Error: No response from server " + this.server );

            // Parse the result
            var result = this.protocol.parseMetaData( response );
            this.max_size = result.max_size;
            this.tileSize = result.tileSize;
            this.num_resolutions = result.num_resolutions;

            this.createWindows();
          }.bind(this),
          onFailure: function(){ alert('Error: Unable to get image metadata from server!'); }
        });
        
        // Send the metadata request
        metadata.send();
      }
    }
  },


  /* Reflow our viewer after a resize
   */
  reflow: function(){

    var target_size = this.container.getSize();
    this.view.w = target_size.x;
    this.view.h = target_size.y;
    this._updateRotatedWAndH();

    // Move and constrain our canvas
    this._refreshCanvasPosition();

    // Calculate our new navigation window size
    this.calculateNavSize();

    // Resize our navigation window
    this.container.getElements('div.navcontainer, div.navcontainer div.loadBarContainer').setStyle('width', this.navWin.w);

    // And reposition the navigation window
    if( this.showNavWindow ){
      if( this.navcontainer ) this.navcontainer.setStyles({
	top: (Browser.Platform.ios&&window.navigator.standalone) ? 20 : 10, // Nudge down window in iOS standalone mode
	left: this.container.getPosition(this.container).x + this.container.getSize().x - this.navWin.w - 10
      });

      // Resize our navigation window div
      if(this.zone) this.zone.getParent().setStyle('height', this.navWin.h );
    }

    // Reset and reposition our scale
    if( this.scale ){
      this.updateScale();
      pos = this.container.getSize().y -
	this.container.getElement('div.scale').getSize().y - 10;
      this.container.getElement('div.scale').setStyles({
	left: 10,
	top: pos
      });
    }

    this.requestImages();
    this.positionZone();

    this.fireEvent('resize', [this.view.w, this.view.h]);
  },


  /* Reload our view
   */
  reload: function(){

    // First cancel any effects on the canvas and delete the tiles within
    this.canvas.get('morph').cancel();
    this.canvas.getChildren('img').destroy();
    this.tiles.empty();
    this.calculateSizes();

    // Resize the main tile canvas
    if( this.viewport && this.viewport.resolution!=null ){
      this.view.res = this.viewport.resolution;
      this.wid = this.resolutions[this.view.res].w;
      this.hei = this.resolutions[this.view.res].h;
      this.touch.options.limit = { x: Array(this.view.w-this.wid,0), y: Array(this.view.h-this.hei,0) };
    }
    // Center our view or move to initial viewport position
    if( this.viewport && this.viewport.x!=null && this.viewport.y!=null ){
      this.moveTo( this.viewport.x*this.wid, this.viewport.y*this.hei );
    }
    else this.recenter();

    this.canvas.setStyles({
      width: this.wid,
      height: this.hei
    });


    this.reflow();

    // Set initial rotation - do this after a reflow as requestimages resets rotation to zero
    if( this.viewport && this.viewport.rotation!=null ){
      this.rotate( this.viewport.rotation );
    }
    else this.rotate(0);

  },


  /* Recenter the image view
   */
  recenter: function(){

    // Calculate the x,y for a centered view, making sure we have no negative
    // in case our resolution is smaller than the viewport
    var xoffset = Math.round( (this.wid-this.view.rotatedW)/2 );
    this.view.x = (xoffset<0)? 0 : xoffset;

    var yoffset = Math.round( (this.hei-this.view.rotatedH)/2 );
    this.view.y = (yoffset<0)? 0 : yoffset;

    // Center our canvas, taking into account images smaller than the viewport
    this._refreshCanvasPosition();
  },


  /* Constrain the movement of our canvas to our containing div
   */
  constrain: function(){

    var verticalDiff = 0;
    var horizontalDiff = 0;
    if (this.view.rotation % 180 == 0) {
        verticalDiff = this.view.w - this.wid;
        horizontalDiff = this.view.h - this.hei;
    } else {
        verticalDiff = this.view.w - this.hei;
        horizontalDiff = this.view.h - this.wid;
    }
    
    var startX = verticalDiff > 0 ? Math.round(verticalDiff / 2) : 0;
    var startY = horizontalDiff > 0 ? Math.round(horizontalDiff / 2) : 0;
    
    var leftAndTop = this._transformRotateLeftAndTopForCss(startX, startY);    
    startX = leftAndTop.left;
    startY = leftAndTop.top;
    
    var ax = verticalDiff > 0 ? Array(startX, startX) : Array(startX + verticalDiff, startX);
    var ay = horizontalDiff > 0 ? Array(startY, startY) : Array(startY + horizontalDiff, startY);
    
    this.touch.options.limit = { x: ax, y: ay };
  },
  
  
  /* Reposition the navigation rectangle on the overview image
   */
  positionZone: function(){

    if( !this.showNavWindow ) return;

    var pleft = (this.view.x/this.wid) * (this.navWin.w);
    if( pleft > this.navWin.w ) pleft = this.navWin.w;
    if( pleft < 0 ) pleft = 0;

    var ptop = (this.view.y/this.hei) * (this.navWin.h);
    if( ptop > this.navWin.h ) ptop = this.navWin.h;
    if( ptop < 0 ) ptop = 0;

    var width = (this.view.w/this.wid) * (this.navWin.w);
    if( pleft+width > this.navWin.w ) width = this.navWin.w - pleft;

    var height = (this.view.h/this.hei) * (this.navWin.h);
    if( height+ptop > this.navWin.h ) height = this.navWin.h - ptop;

    var border = this.zone.offsetHeight - this.zone.clientHeight;

    // Move the zone to the new size and position
    this.zone.morph({
      left: pleft,
      top: ptop + 8, // 8 is the height of toolbar
      width: (width-border>0)? width - border : 1, // Watch out for zero sizes!
      height: (height-border>0)? height - border : 1
    });

  },
  
  /**
   * Get x and y relative to image by left and top of the canvas.
   *
   */
  getXAndYByLeftAndTop: function() {
    var left = this.canvas.getStyle('left').toInt();
    var top = this.canvas.getStyle('top').toInt();
    var leftAndTop = this._transformRotateLeftAndTopForCss(left, top, true);
    var xAndY = this._transformRotateXAndY(-1 * leftAndTop.left, -1 * leftAndTop.top);
    
    return xAndY;
  },
  
  /**
   * Gets left and top for rotated canvas after the rotation.
   *
   */
  getVisibleLeftAndTop: function() {
    var left = this.canvas.getStyle('left').toInt();
    var top = this.canvas.getStyle('top').toInt();
    return this._transformRotateLeftAndTopForCss(left, top, true);
  },
  
  /**
   * Gets the coordinates of the point of the image which is in the center currently.
   * 
   */
  getPointInCenter: function() {
    var x = ( this.wid>this.view.rotatedW ? Math.round(this.view.x+this.view.rotatedW/2) : Math.round(this.wid/2) );
    var y = ( this.hei>this.view.rotatedH ? Math.round(this.view.y+this.view.rotatedH/2) : Math.round(this.hei/2) );
    return {'x': x, 'y': y};
  },
  
  /**
   * Moves the image to a posisiton where the point given will be in the center.
   * 
   */
  movePointInCenter: function(x, y) {
    // Enforce the move to reload the images.
    this.view.x = -1;
    this.view.y = -1;
    this.moveTo(Math.round(x - this.view.rotatedW/2), Math.round(y - this.view.rotatedH/2));
  },
  
  /**
   * If rotation is < 0 returns its positive equivalent.
   * 
   */
  getPositiveRotation: function() {
    var rotation = this.view.rotation;
    rotation = rotation % 360;
    if (rotation < 0) {
      rotation += 360;
    }
    return rotation;
  },
  
  /**
   * Set canvas left and top.
   * 
   */
  _refreshCanvasPosition: function(doMorph) {
    
    this.constrain();
    var limit = this.touch.options.limit;
    
    var xAndY = this._transformRotateXAndY(this.view.x, this.view.y, true);
    var leftAndTop = this._transformRotateLeftAndTopForCss(-1 * xAndY.x, -1 * xAndY.y);
    var left = leftAndTop.left;
    var top = leftAndTop.top;
    
    if (doMorph) {
      this.canvas.morph({
        left: limit.x[0] != limit.x[1] ? left : limit.x[0],
        top: limit.y[0] != limit.y[1] ? top : limit.y[0]
      });
    } else {
      this.canvas.setStyles({
        left: limit.x[0] != limit.x[1] ? left : limit.x[0],
        top: limit.y[0] != limit.y[1] ? top : limit.y[0]
      });
    }
  },
  
  /**
   * Transform x and y depending on rotation.
   * This transformation is symetrical - will work in both directions.
   * 
   */
  _transformRotateXAndY: function(x, y, reverse) {
    
    var rotation = this.getPositiveRotation();
    
    var verticalDiff = 0;
    var horizontalDiff = 0;
    if (rotation % 180 == 0) {
      verticalDiff = this.view.w - this.wid;
      horizontalDiff = this.view.h - this.hei;
    } else {
      verticalDiff = this.view.w - this.hei;
      horizontalDiff = this.view.h - this.wid;
      
      if (reverse) {
        var tempVDiff = verticalDiff;
        verticalDiff = horizontalDiff;
        horizontalDiff = tempVDiff;
        rotation += 180;
      }
    }
    
    var newX = 0;
    var newY = 0;
    if (rotation % 360 == 0) {
      newX = x;
      newY = y;
    } else if (rotation % 180 == 0) {
      newX = -1 * (x + verticalDiff);
      newY = -1 * (y + horizontalDiff);
    } else if (rotation % 270 == 0) {
      newX = -1 * (y + horizontalDiff);
      newY = x;
    } else if (rotation % 90 == 0) {
      newX = y;
      newY = -1 * (x + verticalDiff);
    }

    return {'x': newX, 'y': newY};
  },
  
  /**
   * Transforms original left and top to handle rotation. 
   * The css left and top are applied to the element as if it was not rotated. This method transform normal left and top to left and top which can be used for css to achieve the required left and top.
   * Only 90 degreees rotation is handled.
   * If needs to handle any rotation calculations with rotation matrix ((sin r, cos r), (-cos r, sin r)) is needed.
   * 
   */
  _transformRotateLeftAndTopForCss: function(left, top, reverse) {
    
    var rotation = this.getPositiveRotation();
    
    /* We do not move transform origin anymore.
    var transformOrigin = this.canvas.getStyle(this.CSSprefix+'transform-origin').replace('px', '').replace('px', '').split(' ');
    var transformOriginX = parseInt(transformOrigin[0]);
    var transformOriginY = parseInt(transformOrigin[1]);
    */
    var transformOriginX = Math.round(this.wid/2);
    var transformOriginY = Math.round(this.hei/2);
   
    var realToCssDiffLeft = 0;
    var realToCssDiffTop = 0;
    
    if (rotation % 360 == 0) {
        // No transformation required.
    } else if (rotation % 180 == 0) {
        realToCssDiffLeft = ((this.wid - transformOriginX) - transformOriginX);
        realToCssDiffTop = ((this.hei - transformOriginY) - transformOriginY);
    } else if (rotation % 270 == 0) {
        realToCssDiffLeft = ((transformOriginY) - transformOriginX);
        realToCssDiffTop = ((this.wid - transformOriginX) - transformOriginY);
    } else if (rotation % 90 == 0) {
        realToCssDiffLeft = ((this.hei - transformOriginY) - transformOriginX);
        realToCssDiffTop = ((transformOriginX) - transformOriginY);
    }

    if ( ! reverse) {
      left += realToCssDiffLeft;
      top += realToCssDiffTop;
    } else {
      left -= realToCssDiffLeft;
      top -= realToCssDiffTop;
    }    

    return {'left': left, 'top': top};
  },
  
  /**
   * Calculates what are the x and y over image (equivalent of view.x and view.y) depending on x and y calculated over the canvas.
   * 
   */
  _transformRotateOverCanvasToOverImage: function (overCanvasX, overCanvasY) {
    var rotation = this.getPositiveRotation();
    
    var x, y;
    if (rotation % 360 == 0) {
      x = overCanvasX;
      y = overCanvasY;
    } else if (rotation % 180 == 0) {
      x = this.wid - overCanvasX;
      y = this.hei - overCanvasY;
    } else if (rotation % 270 == 0) {
      x = this.wid - overCanvasY;
      y = overCanvasX;
    } else if (rotation % 90 == 0) {
      x = overCanvasY;
      y = this.hei - overCanvasX;
    }
    return {'x': x, 'y': y};
  },
  
  /**
   * Update view.rotatedW and view.rotatedH.
   * 
   */
  _updateRotatedWAndH: function() {
    this.view.rotatedW = this.view.w;
    this.view.rotatedH = this.view.h;
    if (this.view.rotation % 180 != 0) {
      this.view.rotatedW = this.view.h;
      this.view.rotatedH = this.view.w;
    }
  }
});


/* Static function for synchronizing iipmooviewer instances
 */
IIPMooViewer.synchronize = function(viewers){
  this.sync = viewers;
};


/* Static function get get an array of the windows that are
   synchronized to this one
 */
IIPMooViewer.windows = function(s){
  if( !this.sync || !this.sync.contains(s) ) return Array();
  return this.sync.filter( function(t){
     return (t!=s);
  });
};


/* Add a little convenience variable to detect buggy IE versions
 */
if( Browser.ie && Browser.version<9 ) Browser.buggy = true;
else Browser.buggy = false;


/* Setup our list of protocol objects
 */
if(typeof Protocols === 'undefined') {
    Protocols = {};
}
