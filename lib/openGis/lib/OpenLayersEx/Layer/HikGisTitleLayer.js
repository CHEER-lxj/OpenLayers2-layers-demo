/** 
 * @requires OpenLayers/Layer/XYZ.js
 */ 
   
OpenLayers.Layer.AgsTiledLayer = OpenLayers.Class(OpenLayers.Layer.ArcGISCache, {  

	tileOptions : {
		onImageError : function() {  //切片数据加载失败使用空白图片代替
			var img = this.imgDiv;
			if (img.src != null) {
				this.imageReloadAttempts++;
				if (this.imageReloadAttempts <= OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
					this.setImgSrc(this.layer.getURL(this.bounds));
				} else {
					OpenLayers.Element.addClass(img, "olImageLoadError");
					this.events.triggerEvent("loaderror");
					img.src = this.blankImageUrl;
					this.onImageLoad();
				}
			}
		}
	},
	
	
	/**
    * Constructor: OpenLayers.Layer.ArcGISCache 
    * Creates a new instance of this class 
    * 
    * Parameters: 
    * name - {String} 
    * url - {String} 
    * options - {Object} extra layer options
    */ 
    initialize: function(name, url, options) { 
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);

        if (this.resolutions) {        
            this.serverResolutions = this.resolutions;
            this.maxExtent = this.getMaxExtentForResolution(this.resolutions[0]);
        }

        // this block steps through translating the values from the server layer JSON 
        // capabilities object into values that we can use.  This is also a helpful
        // reference when configuring this layer directly.
        if (this.layerInfo) {
            // alias the object
            var info = this.layerInfo;
            
            // build our extents
            var startingTileExtent = new OpenLayers.Bounds(
                info.fullExtent.xmin, 
                info.fullExtent.ymin, 
                info.fullExtent.xmax, 
                info.fullExtent.ymax  
            );

            // set our projection based on the given spatial reference.
            // esri uses slightly different IDs, so this may not be comprehensive
            this.projection = 'EPSG:' + info.spatialReference.wkid;
            this.sphericalMercator = (info.spatialReference.wkid == 102100);
            
            // convert esri units into openlayers units (basic feet or meters only)
            this.units = (info.units == "esriFeet") ? 'ft' : 'm';

            // optional extended section based on whether or not the server returned
            // specific tile information
            if (!!info.tileInfo) {            
                // either set the tiles based on rows/columns, or specific width/height
                this.tileSize = new OpenLayers.Size(
                    info.tileInfo.width || info.tileInfo.cols, 
                    info.tileInfo.height || info.tileInfo.rows
                );
                
                // this must be set when manually configuring this layer
                this.tileOrigin = new OpenLayers.LonLat(
                    info.tileInfo.origin.x, 
                    info.tileInfo.origin.y
                );

                var upperLeft = new OpenLayers.Geometry.Point(
                    startingTileExtent.left, 
                    startingTileExtent.top
                );
                
                var bottomRight = new OpenLayers.Geometry.Point(
                    startingTileExtent.right, 
                    startingTileExtent.bottom
                );            
                
                if (this.useScales) {
                    this.scales = [];
                } else {
                    this.resolutions = [];
                }
                
                this.lods = [];
                //添加zoomOffset后需要特殊处理的
                var startLoadIndex=0;
                var endLoadIndex=info.tileInfo.lods.length-1;
                if(this.zoomOffset>0 && this.numZoomLevels>0){
                	startLoadIndex = this.zoomOffset;
                	endLoadIndex = this.numZoomLevels+this.zoomOffset-1;
                }
                alert(startLoadIndex+" "+endLoadIndex);
                for(var key in info.tileInfo.lods) {
                    if (info.tileInfo.lods.hasOwnProperty(key)) {
                    	if(key >= startLoadIndex && key <= endLoadIndex){
                    		var lod = info.tileInfo.lods[key];
	                        if (this.useScales) {
	                            this.scales.push(lod.scale);
	                        } else {
	                            this.resolutions.push(lod.resolution);
	                        }
	                        var start = this.getContainingTileCoords(upperLeft, lod.resolution);
	                        lod.startTileCol = start.x;
	                        lod.startTileRow = start.y;
	                    
	                        var end = this.getContainingTileCoords(bottomRight, lod.resolution);
	                        lod.endTileCol = end.x;
	                        lod.endTileRow = end.y;    
	                        this.lods.push(lod);
                    	}
                    }
                }

                this.maxExtent = this.calculateMaxExtentWithLOD(this.lods[0]);
                this.serverResolutions = this.resolutions;
                if (this.overrideDPI && info.tileInfo.dpi) {
                    // see comment above for 'overrideDPI'
                    OpenLayers.DOTS_PER_INCH = info.tileInfo.dpi;
                }
            } 
       }
    }, 
	
	clone: function (obj) { 
        if (obj == null) { 
        	//此处clone方法克隆的不是AgsTiledLayer而是ArcGISCache，主要是为了使鹰眼能缩放的更小级
        	//即鹰眼需要设置zoomOffset=0，使resolutions为完成的数组，不进行截取
            obj = new OpenLayers.Layer.AgsTiledLayer(this.name, this.url, OpenLayers.Util.extend(this.options,{zoomOffset :0}));
        }
        return OpenLayers.Layer.XYZ.prototype.clone.apply(this, [obj]);
	},
	
    getURL: function (bounds) {
        var res = this.getResolution(); 

        // tile center
        var originTileX = (this.tileOrigin.lon + (res * this.tileSize.w/2)); 
        var originTileY = (this.tileOrigin.lat - (res * this.tileSize.h/2));

        var center = bounds.getCenterLonLat();
        var point = { x: center.lon, y: center.lat };
        var x = (Math.round(Math.abs((center.lon - originTileX) / (res * this.tileSize.w)))); 
        var y = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h)))); 
        var z = this.map.getZoom()+this.zoomOffset;

        // this prevents us from getting pink tiles (non-existant tiles)
        if (this.lods) {    
            var lod = this.lods[this.map.getZoom()];
            if ((x < lod.startTileCol || x > lod.endTileCol) 
                || (y < lod.startTileRow || y > lod.endTileRow)) {
                    return null;
            }
        }
        else {
            var start = this.getUpperLeftTileCoord(res);
            var end = this.getLowerRightTileCoord(res);
            if ((x < start.x || x >= end.x)
                || (y < start.y || y >= end.y)) {
                    return null;
            }        
        }

        // Construct the url string
        var url = this.url;
        var s = '' + x + y + z;

        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(s, url);
        }
       
        if (this.useArcGISServer) {
            url = url + '/tile/${z}/${y}/${x}';
        } else {
            x = 'C' + OpenLayers.Number.zeroPad(x, 8, 16);
            y = 'R' + OpenLayers.Number.zeroPad(y, 8, 16);
            z = 'L' + OpenLayers.Number.zeroPad(z, 2, 10);
            url = url + '/${z}/${y}/${x}.' + this.type;
        }
        url = OpenLayers.String.format(url, {'x': x, 'y': y, 'z': z});

        return OpenLayers.Util.urlAppend(
            url, OpenLayers.Util.getParameterString(this.params)
        );
    },


    CLASS_NAME: 'OpenLayers.Layer.AgsTiledLayer' 
}); 