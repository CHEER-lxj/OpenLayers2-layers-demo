/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Box.js
 */

/**
 * Class: OpenLayers.Control.ZoomBoxSelect
 * The ZoomBox control enables zooming directly to a given extent, by drawing 
 * a box on the map. The box is drawn by holding down shift, whilst dragging 
 * the mouse.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ZoomBoxSelect = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Property: type
     * {OpenLayers.Control.TYPE}
     */
    type: OpenLayers.Control.TYPE_TOOL,
    
    /**
     * Property: needZoom
     * {Boolean} 是否需要zoom，即拉宽放大
     */
    needZoom : true,
    
    /**
     * Property: onlyOnce
     * {Boolean} 是否只执行一次
     */
    onlyOnce : false,
    
    /**
     * Property: alwaysZoom
     * {Boolean} Always zoom in/out, when box drawed 
     */
    alwaysZoom: false,

     /**
     * APIProperty: persist
     * {Boolean} 是否保留绘制后的矩形
     */
    persist: false,
    
    initialize: function (options) {
		if(!(options && options.layerOptions && options.layerOptions.styleMap)) {
            this.style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['zoomBoxSelect'], {});
        }
		OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },
    
    
    /**
     * Method: draw
     */    
    draw: function() {
        this.handler = new OpenLayers.Handler.Box( this,
                            {done: this.zoomBox}, {keyMask: this.keyMask, boxDivClassName: "olHandlerBoxZoomBoxSelect"} );
    },

    /**
     * Method: zoomBox
     *
     * Parameters:
     * position - {<OpenLayers.Bounds>} or {<OpenLayers.Pixel>}
     */
    zoomBox: function (position) {
        if (position instanceof OpenLayers.Bounds) {
        	
            var minXY = this.map.getLonLatFromPixel(
                        new OpenLayers.Pixel(position.left, position.bottom));
            var maxXY = this.map.getLonLatFromPixel(
                        new OpenLayers.Pixel(position.right, position.top));
         	var bounds = new OpenLayers.Bounds(minXY.lon, minXY.lat,
                                               maxXY.lon, maxXY.lat);
           
         	if(this.needZoom){
         		var lastZoom = this.map.getZoom(); 
	            this.map.zoomToExtent(bounds);
	            if (lastZoom == this.map.getZoom() && this.alwaysZoom == true){ 
	                this.map.zoomTo(lastZoom + 1); 
	            }
         	}
            this.callback(bounds);
            if(this.persist){
            	this.createFeature(bounds);
            }
            if(this.onlyOnce){
            	this.deactivate();
            }
            
        } 
    },
    
    //回调函数
	callback : function(bounds){},
	
	/**
     * APIMethod: activate
     * turn on the handler
     */
    activate: function() {
        if(!OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            return false;
        }
        // create temporary vector layer for rendering geometry sketch
        // TBD: this could be moved to initialize/destroy - setting visibility here
        var options = OpenLayers.Util.extend({
            displayInLayerSwitcher: false,
            // indicate that the temp vector layer will never be out of range
            // without this, resolution properties must be specified at the
            // map-level for this temporary layer to init its resolutions
            // correctly
            calculateInRange: OpenLayers.Function.True
        }, this.layerOptions);
        this.layer = new OpenLayers.Layer.Vector(this.CLASS_NAME, options);
        this.map.addLayer(this.layer);
        return true;
    },
    
    /**
     * Method: createFeature
     * Add temporary features
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     */
    createFeature: function(bounds) {
    	var geometry=bounds.toGeometry();
        this.polygon = new OpenLayers.Feature.Vector(geometry,null,this.style);
        this.layer.addFeatures([this.polygon], {silent: true});
    },

    /**
     * APIMethod: deactivate
     * turn off the handler
     */
    deactivate: function() {
        if(!OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            return false;
        }
        // If a layer's map property is set to null, it means that that layer
        // isn't added to the map. Since we ourself added the layer to the map
        // in activate(), we can assume that if this.layer.map is null it means
        // that the layer has been destroyed (as a result of map.destroy() for
        // example.
        if (this.layer.map != null) {
            this.destroyFeature(true);
            this.layer.destroy(false);
        }
        this.layer = null;
        return true;
    },
    
    /**
     * Method: destroyFeature
     * Destroy the temporary geometries
     *
     * Parameters:
     * force - {Boolean} Destroy even if persist is true.
     */
    destroyFeature: function(force) {
        if(this.layer && (force || !this.persist)) {
            this.layer.destroyFeatures();
        }
        this.polygon = null;
    },

    CLASS_NAME: "OpenLayers.Control.ZoomBoxSelect"
});
