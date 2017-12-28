/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires Hik/popup/PopupEx.js
 */

/**
 * Class: OpenLayers.Popup.LabelPopup
 * 
 * Inherits from:
 *  - <OpenLayers.Popup>
 */
OpenLayers.Popup.LabelPopup = 
  OpenLayers.Class(OpenLayers.Popup, {
	  
	
    /**
     * Parameter: anchor
     * {Object} Object to which we'll anchor the popup. Must expose a 
     *     'size' (<OpenLayers.Size>) and 'offset' (<OpenLayers.Pixel>).
     */
    anchor: null,

    /** 
    * Constructor: OpenLayers.Popup.LabelPopup
    * 
    * Parameters:
    * id - {String}
    * lonlat - {<OpenLayers.LonLat>}
    * contentSize - {<OpenLayers.Size>}
    * contentHTML - {String}
    * anchor - {Object} Object which must expose a 'size' <OpenLayers.Size> 
    *     and 'offset' <OpenLayers.Pixel> (generally an <OpenLayers.Icon>).
    * closeBox - {Boolean}
    * closeBoxCallback - {Function} Function to be called on closeBox click.
    */
    initialize:function(id, lonlat, contentSize, contentHTML, anchor, closeBox,
                        closeBoxCallback) {
        var newArguments = [
            id, lonlat, contentSize, contentHTML, closeBox, closeBoxCallback
        ];
        OpenLayers.Popup.prototype.initialize.apply(this, newArguments);
        this.anchor = (anchor != null) ? anchor : { size: new OpenLayers.Size(0,0), offset: new OpenLayers.Pixel(0,0)};
        this.setBackgroundColor("transparent");                                           
    },

    /**
     * APIMethod: destroy
     */
    destroy: function() {
       	this.anchor = null;
        OpenLayers.Popup.prototype.destroy.apply(this, arguments);        
    },

    /**
     * Method: moveTo
     * Since the popup is moving to a new px, it might need also to be moved
     *     relative to where the marker is. We first calculate the new 
     *     relativePosition, and then we calculate the new px where we will 
     *     put the popup, based on the new relative position. 
     * 
     *     If the relativePosition has changed, we must also call 
     *     updateRelativePosition() to make any visual changes to the popup 
     *     which are associated with putting it in a new relativePosition.
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     */
    moveTo: function(px) {
    	var newPx = this.calculateNewPx(px);
        var newArguments = new Array(newPx); 
        OpenLayers.Popup.prototype.moveTo.apply(this, newArguments);
    },
    
    
    /** 
     * Method: calculateNewPx
     * 
     * Parameters:
     * px - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Pixel>} The the new px position of the popup on the screen
     *     relative to the passed-in px.
     */
    calculateNewPx:function(px) {
        var newPx = px.offset(this.anchor.offset);
        return newPx;   
    },
    
    
    /**
     * Method: setZindex
     * Sets the zindex of the popup.
     * 
     * Parameters: 
     */
	setZIndex: function(zIndex) { 
        if (this.div != null) {
            this.div.style.zIndex = zIndex;
        }
    },
     /**
     * Method: getZIndex
     * get the zindex of the popup.
     * 
     * Parameters: 
     */
    getZIndex: function() { 
        if (this.div != null) {
           return  this.div.style.zIndex;
        }else{
        	return 750;
        }
    },
     
    CLASS_NAME: "OpenLayers.Popup.LabelPopup"
});
