/**
 * Class: OpenLayers.Popup.HikPopup
 * 
 * Inherits from:
 *  - <OpenLayers.Popup>
 */
OpenLayers.Popup.HikPopup = 
  OpenLayers.Class(OpenLayers.Popup,OpenLayers.Popup.Framed, {

	 /** 
     * Property: contentDisplayClass
     * {String} The CSS class of the popup content div.
     */
    contentDisplayClass: "hikPopupContent",
	  
    /**
     * APIProperty: autoSize
     * {Boolean} Framed Cloud is autosizing by default.
     */
    autoSize: true,

    /**
     * APIProperty: panMapIfOutOfView
     * {Boolean} Framed Cloud does pan into view by default.
     */
    panMapIfOutOfView: true,
    
    /**
     * APIProperty: imageSize
     * {<OpenLayers.Size>}
     */
    imageSize: new OpenLayers.Size(1200, 800),

    /**
     * APIProperty: isAlphaImage
     * {Boolean} The HikFrameCloud does not use an alpha image (in honor of the 
     *     good ie6 folk out there)
     */
    isAlphaImage: false,

    /** 
     * APIProperty: fixedRelativePosition
     * {Boolean} The Framed Cloud popup works in just one fixed position.
     */
    fixedRelativePosition: true,
    
    /**固定的位置**/
    relativePosition: "tr",
    
    /**
     * APIProperty: minSize
     * {<OpenLayers.Size>}
     */
    minSize: new OpenLayers.Size(100, 100),

    /**
     * APIProperty: maxSize
     * {<OpenLayers.Size>}
     */
    maxSize: new OpenLayers.Size(1200, 750),
    
    /**
     * 不占用空间的关闭按钮
     */
    noSpaceCloseDiv : null,
    
    
    /** 
    * Constructor: OpenLayers.Popup.HikPopup
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
    	
    	this.imageSrc = OpenLayers.Util.getImageLocation('hik-popup-w.png');
    	var needCloseBox=closeBox;
    	closeBox=false;
    	OpenLayers.Popup.Framed.prototype.initialize.apply(this, arguments);
        this.contentDiv.className = this.contentDisplayClass;
        //背景透明
        this.setBackgroundColor("transparent");  
        //关闭按钮
        if (needCloseBox) {
            this.addCloseBox(closeBoxCallback);
            this.noSpaceCloseDiv.style.zIndex = 1;
        }
    },

    /**
     * Property: positionBlocks
     * {Object} Hash of differen position blocks, keyed by relativePosition
     *     two-character code string (ie "tl", "tr", "bl", "br")
     */
    positionBlocks: {
    	"tr": {
    		 'offset': new OpenLayers.Pixel(-61, 0),
             'padding': new OpenLayers.Bounds(6, 23, 6, 3),
             'closeBox': {
     			position: new OpenLayers.Pixel(11, 8)
             },
             'blocks': [
                 { // top-left
                     size: new OpenLayers.Size('auto', 'auto'),
                     anchor: new OpenLayers.Bounds(0, 33, 13, 0),
                     position: new OpenLayers.Pixel(-19, 0)
                 },
                 { //top-right
                     size: new OpenLayers.Size(13, 'auto'),
                     anchor: new OpenLayers.Bounds(null, 33, 0, 0),
                     position: new OpenLayers.Pixel(-1128, 0)
                 },
                 { //bottom-left
                     size: new OpenLayers.Size('auto',33),
                     anchor: new OpenLayers.Bounds(0, 0, 13, null),
                     position: new OpenLayers.Pixel(-19, -710)
                 },
                 { //bottom-right
                     size: new OpenLayers.Size(13, 33),
                     anchor: new OpenLayers.Bounds(null, 0, 0, null),
                     position: new OpenLayers.Pixel(-1128, -710)
                 }
             ]
    	}
    },
    
	
    /**
     * Method: addCloseBox
     * 
     * Parameters:
     * callback - {Function} The callback to be called when the close button
     *     is clicked.
     */
    addCloseBox: function(callback) {
    	//创建关闭按钮div
        this.noSpaceCloseDiv = OpenLayers.Util.createDiv(this.id + "_close");
        //设置关闭按钮位置
        var closeBox = this.positionBlocks[this.relativePosition].closeBox;
        this.noSpaceCloseDiv.className ="hik-popup-close"; 
        this.noSpaceCloseDiv.style.right =closeBox.position.x+ 'px';
        this.noSpaceCloseDiv.style.top =closeBox.position.y+ 'px';
        this.groupDiv.appendChild(this.noSpaceCloseDiv);

        var closePopup = callback || function(e) {
            this.hide();
            OpenLayers.Event.stop(e);
        };
        OpenLayers.Event.observe(this.noSpaceCloseDiv, "touchend", 
                OpenLayers.Function.bindAsEventListener(closePopup, this));
        OpenLayers.Event.observe(this.noSpaceCloseDiv, "click", 
                OpenLayers.Function.bindAsEventListener(closePopup, this));
    },
    
    /** 
     * APIMethod: destroy
     */
    destroy: function() {
        if (this.noSpaceCloseDiv) {
            OpenLayers.Event.stopObservingElement(this.noSpaceCloseDiv); 
            this.groupDiv.removeChild(this.noSpaceCloseDiv);
        }
        this.noSpaceCloseDiv = null;
        OpenLayers.Popup.Framed.prototype.destroy.apply(this, arguments);
    },


    CLASS_NAME: "OpenLayers.Popup.HikPopup"
});
