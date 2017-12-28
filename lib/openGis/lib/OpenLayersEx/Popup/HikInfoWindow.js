
OpenLayers.Popup.HIKInfoWindow = OpenLayers.Class(OpenLayers.Popup.Anchored,{
	
	topDiv : null,
	topTitleDiv : null,
	border  : null,
	localImgDiv : null,
	panMapIfOutOfView : false , 
    initialize:function(id, lonlat, contentSize, contentHTML, anchor , closeBox, closeBoxCallback) {
        if (id == null) {
            id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
        }

        this.id = id;
        this.lonlat = lonlat;

        this.contentSize = (contentSize != null) ? contentSize 
                                  : new OpenLayers.Size(
                                                   OpenLayers.Popup.WIDTH,
                                                   OpenLayers.Popup.HEIGHT);
        if (contentHTML != null) { 
             this.contentHTML = contentHTML;
        }
        this.backgroundColor = OpenLayers.Popup.COLOR;
        this.opacity = OpenLayers.Popup.OPACITY;
        this.div = document.createElement('div');
        this.div.id = this.id;
        this.div.className = "hikgis_infowindow";
        
        var topDivId = this.id + '_TopDiv';
        this.topDiv = document.createElement('div');
        this.topDiv.id = topDivId;
        this.topDiv.className = 'hikgis_infowindow_top';
        var topTitleDivId = topDivId + '_title';
        this.topTitleDiv = document.createElement('div'); 
        this.topTitleDiv.id = topTitleDivId;
        this.topTitleDiv.className = 'hikgis_infowindow_top_title';
        this.topTitleDiv.innerHTML = "测试infowindow";
        
        var imgLocation = OpenLayers.Util.getImageLocation("iw_tail.png");
        this.localImgDiv = document.createElement('img');
        this.localImgDiv.src = imgLocation;
        this.localImgDiv.id = this.id + '_LocalImgDiv';
        this.localImgDiv.className = 'hikgis_infowindow_localimg';
//        this.groupDiv = this.topDiv;
//        var groupDivId = this.id + "_GroupDiv";
//        this.groupDiv = OpenLayers.Util.createDiv(groupDivId, null, null, 
//                                                    null, "relative", null,
//                                                   "hidden");
        this.topDiv.appendChild(this.topTitleDiv);
		this.div.appendChild(this.topDiv);
		var id = this.div.id + "_contentDiv";
        this.contentDiv = OpenLayers.Util.createDiv(id, null, this.contentSize.clone(), 
                                                    null, "relative",1,"auto",-1);
        this.contentDiv.className = 'hikgis_infowindow_content';
        //this.groupDiv.appendChild(this.contentDiv);
        this.div.appendChild(this.contentDiv);
		this.div.appendChild(this.localImgDiv);
		
        if (closeBox) {
            this.addCloseBox(closeBoxCallback);
        } 

        this.registerEvents();
		this.anchor = (anchor != null) ? anchor : {
				size : new OpenLayers.Size(0, 0),
				offset : new OpenLayers.Pixel(0, 0)
			};
    },
	setBorder : function(border) {
		if (border != undefined) {
			this.border = border;
		}

		if (this.div != null && this.border != null) {
			this.div.style.border = this.border;
		}
		
	},
	
    setSize:function(contentSize) { 
        this.size = contentSize.clone(); 
        var contentDivPadding = this.getContentDivPadding();
        var wPadding = contentDivPadding.left + contentDivPadding.right;
        var hPadding = contentDivPadding.top + contentDivPadding.bottom;

        this.fixPadding();
        wPadding += this.padding.left + this.padding.right;
        hPadding += this.padding.top + this.padding.bottom;
     
        this.size.w += wPadding;
        this.size.h += hPadding;

        if (OpenLayers.BROWSER_NAME == "msie") {
            this.contentSize.w += 
                contentDivPadding.left + contentDivPadding.right;
            this.contentSize.h += 
                contentDivPadding.bottom + contentDivPadding.top;
        }
        //this.size.w += 1;
		this.size.h += 32;
        if (this.div != null) {
            this.div.style.width = this.size.w + "px";
            this.div.style.height = this.size.h + "px";
        }
        if (this.contentDiv != null){
            this.contentDiv.style.width = contentSize.w + "px";
            this.contentDiv.style.height = contentSize.h + "px";
        }
        if(this.localImgDiv !== null){
        	this.localImgDiv.style.left = this.size.w/2 + "px";
        }
        if ((this.lonlat) && (this.map)) {
            var px = this.map.getLayerPxFromLonLat(this.lonlat);
            this.moveTo(px);
        }
    }, 
    destroy : function() {
    	this.id = null;
        this.lonlat = null;
        this.size = null;
        this.contentHTML = null;
        
        this.backgroundColor = null;
        this.opacity = null;
        this.border = null;
        
        if (this.map) {
            this.map.events.unregister("movestart", this, this.hide);
        }

        if (this.events) {
        	this.events.destroy();
        	this.events = null;
        }
        
        if (this.closeDiv) {
            OpenLayers.Event.stopObservingElement(this.closeDiv); 
            this.topDiv.removeChild(this.closeDiv);
        }
        this.closeDiv = null;
        
        if (this.div) {
        	this.div.removeChild(this.contentDiv);
        }
       	this.contentDiv = null;

        if (this.map != null) {
            this.map.removePopup(this);
        }
        this.map = null;
        this.div = null;
        
        this.autoSize = null;
        this.minSize = null;
        this.maxSize = null;
        this.padding = null;
        this.panMapIfOutOfView = null;
    },
    /**
     * 移动到位置
     * @param {} px
     */
    moveTo: function(px) {
        var oldRelativePosition = this.relativePosition;
        this.relativePosition = this.calculateRelativePosition(px);
        
        var newPx = this.calculateNewPx(px);
        
        var newArguments = new Array(newPx);        
        OpenLayers.Popup.prototype.moveTo.apply(this, newArguments);
        
        if (this.relativePosition != oldRelativePosition) {
            this.updateRelativePosition();
        }
    },
    calculateRelativePosition:function(px) {
        var lonlat = this.map.getLonLatFromLayerPx(px);        
        var extent = this.map.getExtent();
        var quadrant = extent.determineQuadrant(lonlat);
        return OpenLayers.Bounds.oppositeQuadrant(quadrant);
    },
    
    calculateNewPx:function(px) {
        var newPx = px.offset(this.anchor.offset);
        var size = this.size || this.contentSize;
        newPx.y += -size.h-31;
        newPx.x += -size.w /2;

        return newPx;   
    },
     getSafeContentSize: function(size) {

        var safeContentSize = size.clone();

        var contentDivPadding = this.getContentDivPadding();
        var wPadding = contentDivPadding.left + contentDivPadding.right;
        var hPadding = contentDivPadding.top + contentDivPadding.bottom;

        this.fixPadding();
        wPadding += this.padding.left + this.padding.right;
        hPadding += this.padding.top + this.padding.bottom;

        if (this.minSize) {
            safeContentSize.w = Math.max(safeContentSize.w, 
                (this.minSize.w - wPadding));
            safeContentSize.h = Math.max(safeContentSize.h, 
                (this.minSize.h - hPadding));
        }

        if (this.maxSize) {
            safeContentSize.w = Math.min(safeContentSize.w, 
                (this.maxSize.w - wPadding));
            safeContentSize.h = Math.min(safeContentSize.h, 
                (this.maxSize.h - hPadding));
        }
        
        if (this.map && this.map.size) {
            
            var extraX = 0, extraY = 0;
            if (this.keepInMap && !this.panMapIfOutOfView) {
                var px = this.map.getPixelFromLonLat(this.lonlat);
                switch (this.relativePosition) {
                    case "tr":
                        extraX = px.x;
                        extraY = this.map.size.h - px.y;
                        break;
                    case "tl":
                        extraX = this.map.size.w - px.x;
                        extraY = this.map.size.h - px.y;
                        break;
                    case "bl":
                        extraX = this.map.size.w - px.x;
                        extraY = px.y;
                        break;
                    case "br":
                        extraX = px.x;
                        extraY = px.y;
                        break;
                    default:    
                        extraX = px.x;
                        extraY = this.map.size.h - px.y;
                        break;
                }
            }    
            var maxY = this.map.size.h - 
                this.map.paddingForPopups.top - 
                this.map.paddingForPopups.bottom - 
                hPadding - extraY;
            
            var maxX = this.map.size.w - 
                this.map.paddingForPopups.left - 
                this.map.paddingForPopups.right - 
                wPadding - extraX;
            
            safeContentSize.w = Math.min(safeContentSize.w, maxX);
            safeContentSize.h = Math.min(safeContentSize.h, maxY);
        }
        
        return safeContentSize;
    },
    addCloseBox: function(callback) {
        this.closeDiv = document.createElement('div');
        this.closeDiv.className = "hikgis_infowindow_top_close"; 
        this.closeDiv.title = '关闭';
        var closeDivImg = document.createElement('img'); 
        var imgLocation = OpenLayers.Util.getImageLocation("iw_close.gif");
        closeDivImg.src = imgLocation;
        closeDivImg.className = 'hikgis_infowindow_top_close_img';
        this.closeDiv.appendChild(closeDivImg);
        this.topDiv.appendChild(this.closeDiv);

        var closePopup = function(e) {
            this.hide();
            OpenLayers.Event.stop(e);
            if(callback){
            	callback();
            }
        };
        OpenLayers.Event.observe(this.closeDiv, "touchend", 
                OpenLayers.Function.bindAsEventListener(closePopup, this));
        OpenLayers.Event.observe(this.closeDiv, "click", 
                OpenLayers.Function.bindAsEventListener(closePopup, this));
    },
    
    setTitleHTML : function(html){
    	this.topTitleDiv.innerHTML = html;
    },
    
    panIntoView: function() {
        var mapSize = this.map.getSize();
    
        var origTL = new OpenLayers.Pixel(
            parseInt(this.div.style.left),
            parseInt(this.div.style.top)
        );
        
        var newTL = origTL.clone();
    
        if (origTL.x < this.map.paddingForPopups.left) {
            newTL.x = this.map.paddingForPopups.left;
        } else 
        if ( (origTL.x + this.size.w) > (mapSize.w - this.map.paddingForPopups.right)) {
            newTL.x = mapSize.w - this.map.paddingForPopups.right - this.size.w;
        }
        
        if (origTL.y < this.map.paddingForPopups.top) {
            newTL.y = this.map.paddingForPopups.top;
        } else 
        if ( (origTL.y + this.size.h) > (mapSize.h - this.map.paddingForPopups.bottom)) {
            newTL.y = mapSize.h - this.map.paddingForPopups.bottom - this.size.h;
        }
        
        var dx = origTL.x - newTL.x;
        var dy = origTL.y - newTL.y;
        
        this.map.pan(dx, dy);
    },
    CLASS_NAME: "OpenLayers.Popup.HIKInfoWindow"

});
