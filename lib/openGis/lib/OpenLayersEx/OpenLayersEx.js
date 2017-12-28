/*OpenLayersEx JS Mergre*/ 
OpenLayers.HtmlIcon = OpenLayers.Class(OpenLayers.Icon, {
	
	html : null,
	
	div : null,

	initialize : function(html, size, offset, calculateOffset) {
		this.html = html;
		this.size = size;
		this.offset = offset || {
			x : 0,
			y : 0
		};
		
		this.calculateOffset = calculateOffset;
		var id = OpenLayers.Util.createUniqueID("HIK_Icon_");
		this.div = document.createElement('div');
		this.div.id = id;
	},

	destroy : function() {
		this.erase();
		// OpenLayers.Event.stopObservingElement(this.div.firstChild);
		this.div.innerHTML = "";
		this.div = null;
	},

	clone : function() {
		return new OpenLayers.HtmlIcon(this.html, this.size, this.offset,
				this.calculateOffset);
	},

	setHtml : function(html) {
		if (html != null) {
			this.html = html;
		}
		this.draw();
	},

	draw : function(px) {
		if (this.size && this.size.w) {
			this.div.style.width = this.size.w+"px";
		}
		if (this.size && this.size.h) {
			this.div.style.height = this.size.h+"px";
		}
		this.div.style.position = "absolute";
		this.div.innerHTML = this.html;
		this.moveTo(px);
		return this.div;
	},

	erase : function() {
		if (this.div != null && this.div.parentNode != null) {
			OpenLayers.Element.remove(this.div);
		}
	},

	setOpacity : function(opacity) {
		var element = this.div;
		if (parseFloat(opacity) >= 0.0 && parseFloat(opacity) < 1.0) {
			element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
			element.style.opacity = opacity;
		} else if (parseFloat(opacity) == 1.0) {
			element.style.filter = '';
			element.style.opacity = '';
		}
	},

	moveTo : function(px) {
		if (px != null) {
			this.px = px;
		}

		if (this.div != null) {
			if (this.px == null) {
				this.display(false);
			} else {
				if (this.calculateOffset) {
					this.offset = this.calculateOffset(this.size);
				}
				OpenLayers.Util.modifyDOMElement(this.div, null, {
							x : this.px.x + this.offset.x,
							y : this.px.y + this.offset.y
						});
			}
		}
	},

	display : function(display) {
		this.div.style.display = (display) ? "" : "none";
	},

	isDrawn : function() {
		var isDrawn = (this.div && this.div.parentNode && (this.div.parentNode.nodeType != 11));

		return isDrawn;
	},
	CLASS_NAME : "OpenLayers.HtmlIcon"
});OpenLayers.HtmlMarker = OpenLayers.Class(OpenLayers.Marker,{

	initialize : function(lonlat, icon) {
		this.lonlat = lonlat;

		var newIcon = (icon) ? icon : OpenLayers.Marker.defaultIcon();
		if (this.icon == null) {
			this.icon = newIcon;
		} else {
			this.icon.html = newIcon.html;
			this.icon.size = newIcon.size;
			this.icon.offset = newIcon.offset;
			this.icon.calculateOffset = newIcon.calculateOffset;
		}
		this.events = new OpenLayers.Events(this, this.icon.div ? this.icon.div
				: this.icon.imageDiv);
	},
	
	CLASS_NAME : "OpenLayers.HtmlMarker"
});OpenLayers.Layer.BaiduLayer = OpenLayers.Class(OpenLayers.Layer.XYZ, {

	url : null,

	tileOrigin : new OpenLayers.LonLat(-20037508.34, 20037508.34),

	tileSize : new OpenLayers.Size(256, 256),

	type : 'png',

	useScales : false,

	overrideDPI : false,

	initialize : function(options) {
		this.resolutions = [];
		for ( var i = 0; i < 19; i++) {
			this.resolutions[i] = Math.pow(2, 18 - i);
		}

		OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);

		if (this.resolutions) {
			this.serverResolutions = this.resolutions;
			this.maxExtent = this
					.getMaxExtentForResolution(this.resolutions[0]);
		}

		// this block steps through translating the values from the server layer JSON 
		// capabilities object into values that we can use. This is also a helpful
		// reference when configuring this layer directly.
		if (this.layerInfo) {
			// alias the object
			var info = this.layerInfo;

			// build our extents
			var startingTileExtent = new OpenLayers.Bounds(
					info.fullExtent.xmin, info.fullExtent.ymin,
					info.fullExtent.xmax, info.fullExtent.ymax);

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
				this.tileSize = new OpenLayers.Size(info.tileInfo.width
						|| info.tileInfo.cols, info.tileInfo.height
						|| info.tileInfo.rows);

				// this must be set when manually configuring this layer
				this.tileOrigin = new OpenLayers.LonLat(info.tileInfo.origin.x,
						info.tileInfo.origin.y);

				var upperLeft = new OpenLayers.Geometry.Point(
						startingTileExtent.left, startingTileExtent.top);

				var bottomRight = new OpenLayers.Geometry.Point(
						startingTileExtent.right, startingTileExtent.bottom);

				if (this.useScales) {
					this.scales = [];
				} else {
					this.resolutions = [];
				}

				this.lods = [];
				for ( var key in info.tileInfo.lods) {
					if (info.tileInfo.lods.hasOwnProperty(key)) {
						var lod = info.tileInfo.lods[key];
						if (this.useScales) {
							this.scales.push(lod.scale);
						} else {
							this.resolutions.push(lod.resolution);
						}

						var start = this.getContainingTileCoords(upperLeft,
								lod.resolution);
						lod.startTileCol = start.x;
						lod.startTileRow = start.y;

						var end = this.getContainingTileCoords(bottomRight,
								lod.resolution);
						lod.endTileCol = end.x;
						lod.endTileRow = end.y;
						this.lods.push(lod);
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

	getContainingTileCoords : function(point, res) {
		// return new OpenLayers.Pixel(
		// Math.max(Math.floor((point.x - this.tileOrigin.lon) / (this.tileSize.w * res)), 0),
		// Math.max(Math.floor((this.tileOrigin.lat - point.y) / (this.tileSize.h * res)), 0)
		// );

		return new OpenLayers.Pixel(Math.floor((point.x - this.tileOrigin.lon)
				/ (this.tileSize.w * res)), Math
				.floor((point.y - this.tileOrigin.lat)
						/ (this.tileSize.h * res)));
	},

	calculateMaxExtentWithLOD : function(lod) {
		// the max extent we're provided with just overlaps some tiles
		// our real extent is the bounds of all the tiles we touch

		var numTileCols = (lod.endTileCol - lod.startTileCol) + 1;
		var numTileRows = (lod.endTileRow - lod.startTileRow) + 1;

		var minX = this.tileOrigin.lon
				+ (lod.startTileCol * this.tileSize.w * lod.resolution);
		var maxX = minX + (numTileCols * this.tileSize.w * lod.resolution);

		var maxY = this.tileOrigin.lat
				- (lod.startTileRow * this.tileSize.h * lod.resolution);
		var minY = maxY - (numTileRows * this.tileSize.h * lod.resolution);
		return new OpenLayers.Bounds(minX, minY, maxX, maxY);
	},

	calculateMaxExtentWithExtent : function(extent, res) {
		var upperLeft = new OpenLayers.Geometry.Point(extent.left, extent.top);
		var bottomRight = new OpenLayers.Geometry.Point(extent.right,
				extent.bottom);
		var start = this.getContainingTileCoords(upperLeft, res);
		var end = this.getContainingTileCoords(bottomRight, res);
		var lod = {
			resolution : res,
			startTileCol : start.x,
			startTileRow : start.y,
			endTileCol : end.x,
			endTileRow : end.y
		};
		return this.calculateMaxExtentWithLOD(lod);
	},

	getUpperLeftTileCoord : function(res) {
		var upperLeft = new OpenLayers.Geometry.Point(this.maxExtent.left,
				this.maxExtent.top);
		return this.getContainingTileCoords(upperLeft, res);
	},

	getLowerRightTileCoord : function(res) {
		var bottomRight = new OpenLayers.Geometry.Point(this.maxExtent.right,
				this.maxExtent.bottom);
		return this.getContainingTileCoords(bottomRight, res);
	},

	getMaxExtentForResolution : function(res) {
		var start = this.getUpperLeftTileCoord(res);
		var end = this.getLowerRightTileCoord(res);

		var numTileCols = (end.x - start.x) + 1;

		//var numTileRows = (end.y - start.y) + 1;

		var numTileRows = (start.y - end.y) + 1;

		var minX = this.tileOrigin.lon + (start.x * this.tileSize.w * res);
		var maxX = minX + (numTileCols * this.tileSize.w * res);

		//var maxY = this.tileOrigin.lat - (start.y * this.tileSize.h * res);
		var maxY = this.tileOrigin.lat + (start.y * this.tileSize.h * res);
		var minY = maxY - (numTileRows * this.tileSize.h * res);
		return new OpenLayers.Bounds(minX, minY, maxX, maxY);
	},

	clone : function(obj) {
		if (obj == null) {
			obj = new OpenLayers.Layer.ArcGISCache(this.name, this.url,
					this.options);
		}
		return OpenLayers.Layer.XYZ.prototype.clone.apply(this, [ obj ]);
	},

	getMaxExtent : function() {
		var resolution = this.map.getResolution();
		return this.maxExtent = this.getMaxExtentForResolution(resolution);
	},

	getTileOrigin : function() {
		//debugger;
	var extent = this.getMaxExtent();
	return new OpenLayers.LonLat(extent.left, extent.bottom);
},

getURL : function(bounds) {
	//debugger;

	var z = this.map.getZoom();

	var res = this.getResolution();


	// tile center
	var originTileX = (this.tileOrigin.lon + (res * this.tileSize.w / 2));
	// var originTileY = (this.tileOrigin.lat - (res * this.tileSize.h / 2));

	var originTileY = (this.tileOrigin.lat + (res * this.tileSize.h / 2));

	originTileX = 0;
	originTileY = 0;

	var center = bounds.getCenterLonLat();
	//center.lat = 4825923.77;
	//center.lon = 12958175;
	var point = {
		x : center.lon,
		y : center.lat
	};

	// var x = (Math.round(Math.abs((center.lon - originTileX) / (res * this.tileSize.w))));
	// //var y = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h))));
	// var y = (Math.round(Math.abs((center.lat - originTileY) / (res * this.tileSize.h))));

	var x = (Math.round((center.lon - originTileX) / (res * this.tileSize.w)));
	//var y = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h))));
	var y = (Math.round((center.lat - originTileY) / (res * this.tileSize.h)));

	// x = Math.round(center.lon * 1 / this.tileSize.w);
	// y = Math.round(center.lat * 1 / this.tileSize.h);

	//var x = Math.floor(Math.abs((center.lon) * res / this.tileSize.w));
	//var y = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h))));
	//var y = Math.floor(Math.abs((center.lat ) * res / this.tileSize.h));

	//x = Math.round(Math.abs(x) / 256 );
	// y = Math.round(Math.abs(y) / 256 );

	// this prevents us from getting pink tiles (non-existant tiles)
	if (this.lods) {
		var lod = this.lods[this.map.getZoom()];
		if ((x < lod.startTileCol || x > lod.endTileCol)
				|| (y < lod.startTileRow || y > lod.endTileRow)) {
			return null;
		}
	} else {
		var start = this.getUpperLeftTileCoord(res);
		var end = this.getLowerRightTileCoord(res);
		// if ((x < start.x || x >= end.x)
		// || (y < start.y || y >= end.y)) {
		// return null;
		// }

		if ((x < start.x || x >= end.x) || (y >= start.y || y < end.y)) {
			//return null;
		}
	}

	// Construct the url string
	var url = this.url;
	var s = '' + x + y + z;

	if (OpenLayers.Util.isArray(url)) {
		url = this.selectUrl(s, url);
	}

	// Accessing tiles through ArcGIS Server uses a different path
	// structure than direct access via the folder structure.
	if (this.useArcGISServer) {
		// AGS MapServers have pretty url access to tiles
		url = url + '/tile/${z}/${y}/${x}';
	} else {
		// The tile images are stored using hex values on disk.
		//x = 'C' + this.zeroPad(x, 8, 16);
		// y = 'R' + this.zeroPad(y, 8, 16);
		// z = 'L' + this.zeroPad(z, 2, 16);
		// url = url + '/${z}/${y}/${x}.' + this.type;

		var x_str = '${x}';
		var y_str = '${y}';
		if (x < 0)
			x_str = 'M${x}';
		if (y < 0)
			y_str = 'M${y}';
		url = url + '/u=x=' + x_str + ';y=' + y_str
				+ ';z=${z};v=009;type=sate&fm=46&udt=20130506';
		//http://online1.map.bdimg.com/tile/?qt=tile&x=813&y=213&z=12&styles=pl&udt=20150124&scaler=1
	}
//http://shangetu1.map.bdimg.com/it/u=x=52235;y=13736;z=18;v=009;type=sate&fm=46&udt=20130506
	// Write the values into our formatted url
	url = OpenLayers.String.format(url, {
		'x' : Math.abs(x),
		'y' : Math.abs(y),
		'z' : z
	});

	return url;
},

zeroPad : function(num, len, radix) {
	var str = num.toString(radix || 10);
	while (str.length < len) {
		str = "0" + str;
	}
	return str;
},

CLASS_NAME : 'OpenLayers.Layer.BaiduLayer'

});
/*
 * heatmap.js OpenLayers Heatmap Class
 *
 * Copyright (c) 2011, Patrick Wied (http://www.patrick-wied.at)
 * Dual-licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and the Beerware (http://en.wikipedia.org/wiki/Beerware) license.
 *
 * Modified on Jun,06 2011 by Antonio Santiago (http://www.acuriousanimal.com)
 * - Heatmaps as independent map layer.
 * - Points based on OpenLayers.LonLat.
 * - Data initialization in constructor.
 * - Improved 'addDataPoint' to add new lonlat based points.
 */
OpenLayers.Layer.Heatmap = OpenLayers.Class(OpenLayers.Layer, {
    // the heatmap isn't a basic layer by default - you usually want to display the heatmap over another map ;)
    isBaseLayer: false,
    heatmap: null,
    mapLayer: null,
    // we store the lon lat data, because we have to redraw with new positions on zoomend|moveend
    tmpData: {},
    handler: null,

    initialize: function(name, map, mLayer, hmoptions, options){
        var heatdiv = document.createElement("div"),
            handler;

        OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);
        hmoptions.width = map.size.w;
        hmoptions.height = map.size.h;
        heatdiv.style.cssText = "position:absolute;width:"+hmoptions.width+"px;height:"+hmoptions.height+"px;";
        // this will be the heatmaps container
        this.div.appendChild(heatdiv);
        // add to our heatmap.js config
        hmoptions.container = heatdiv;

        this.mapLayer = mLayer;
        this.map = map;
        // create the heatmap with passed heatmap-options
        this.heatmap = h337.create(hmoptions);

        this.handler = function(){
            if(this.tmpData.max){
                this.updateLayer();
            }
        };
        // on zoomend and moveend we have to move the canvas container and redraw the datapoints with new positions
        map.events.register("zoomend", this, this.handler);
        map.events.register("moveend", this, this.handler);
    },
    updateLayer: function(){
        var pixelOffset = this.getPixelOffset(),
            el = this.heatmap._config.container;
        // if the pixeloffset e.g. for x was positive move the canvas container to the left by setting left:-offset.y px
        // otherwise move it the right by setting it a positive value. same for top
        el.style.top = ((pixelOffset.y > 0)?('-'+pixelOffset.y):(Math.abs(pixelOffset.y)))+'px';
        el.style.left = ((pixelOffset.x > 0)?('-'+pixelOffset.x):(Math.abs(pixelOffset.x)))+'px';

        this.setDataSet(this.tmpData);
    },
    getPixelOffset: function () {
        var o = this.mapLayer.map.layerContainerOrigin,
            o_lonlat = new OpenLayers.LonLat(o.lon, o.lat),
            o_pixel = this.mapLayer.getViewPortPxFromLonLat(o_lonlat),
            c = this.mapLayer.map.center,
            c_lonlat = new OpenLayers.LonLat(c.lon, c.lat),
            c_pixel = this.mapLayer.getViewPortPxFromLonLat(c_lonlat);

        return {
            x: o_pixel.x - c_pixel.x,
            y: o_pixel.y - c_pixel.y
        };

    },
    setDataSet: function(obj){
        var set = {},
            dataset = obj.data,
            dlen = dataset.length,
            entry, lonlat, pixel;

        set.max = obj.max;
        set.data = [];
        // get the pixels for all the lonlat entries
        while(dlen--){
            entry = dataset[dlen],
                lonlat = entry.lonlat.clone().transform(this.projection, this.map.getProjectionObject()),
                pixel = this.roundPixels(this.getViewPortPxFromLonLat(lonlat));

            if(pixel){
                set.data.push({x: pixel.x, y: pixel.y, value: entry.value});
            }
        }
        this.tmpData = obj;
        this.heatmap.setData(set);
    },
    // we don't want to have decimal numbers such as xxx.9813212 since they slow canvas performance down + don't look nice
    roundPixels: function(p){
        if(p.x < 0 || p.y < 0){
            return false;
        }

        p.x = (p.x >> 0);
        p.y = (p.y >> 0);

        return p;
    },
    // same procedure as setDataSet
    addDataPoint: function(lonlat){
        var pixel = this.roundPixels(this.mapLayer.getViewPortPxFromLonLat(lonlat)),
            entry = {lonlat: lonlat},
            args;

        if(arguments.length == 2){
            entry.count = arguments[1];
        }

        this.tmpData.data.push(entry);

        if(pixel){
            args = [pixel.x, pixel.y];

            if(arguments.length == 2){
                args.push(arguments[1]);
            }
            this.heatmap.addData.apply(this.heatmap.store, args);
        }

    },
    // toggle: function(){
    //     this.heatmap.toggleDisplay();
    // },
    destroy: function() {
        // for now, nothing special to do here.
        this.mapLayer = null;
        this.tmpData = null;
        this.heatmap = null;
        map.events.unregister("zoomend", this, this.handler);
        map.events.unregister("moveend", this, this.handler);
        this.handler=null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
    CLASS_NAME: "OpenLayers.Layer.Heatmap"
});
/**
 * PGIS对接图层
 */
OpenLayers.Layer.EzServiceTileLayer = OpenLayers.Class(OpenLayers.Layer.TMS, {

	/**
	 * 瓦片排序字段
	 */
	levelSequence : 0,
	/**
	 * 最大层级
	 */
	levelMax : 22,
	ezZoomOffset : 0,
	/**
	 * 构造函数
	 * 
	 * @constructor
	 * @param {}
	 *            url 服务地址
	 * @param {}
	 *            options 图层参数
	 */
	initialize : function(name, url, options) {
		OpenLayers.Layer.TMS.prototype.initialize.apply(this, arguments);
		this.tileOrigin = new OpenLayers.LonLat(0,0);    
	},
	/**
	 * 获取访问路径
	 * @param {} bounds
	 * @return {},
	 */
	getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var res = this.getServerResolution();
        var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
        var y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h));
        var z = this.serverResolutions != null ?
            OpenLayers.Util.indexOf(this.serverResolutions, res) :
            this.getServerZoom() + this.zoomOffset;
        if (this.levelSequence === 0) {
			z = this.levelMax - z;
		}
        var zoomoffset = "";
		if (this.ezZoomOffset) {//this.ezZoomOffset > 0
			zoomoffset = "&ZoomOffset=" + this.ezZoomOffset;
			z = z + this.ezZoomOffset;
		}
		var path = "?Service=getImage&Type=RGB&Col=" + x + "&Row=" + y
				+ "&Zoom=" + z + "&V=0.3" + zoomoffset; 
        var url = this.url;
        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(path, url);
        }
        return url + path;
    },
    
    clone : function(obj) {
		if (obj == null) {
			obj = new OpenLayers.Layer.EzServiceTileLayer(this.name, this.url, this
							.getOptions());
		}
		obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
		return obj;
	},
	CLASS_NAME : 'OpenLayers.Layer.EzServiceTileLayer'
});/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers.Layer.Vector.RootContainer
 */

/**
 * Class: OpenLayers.Layer.Vector.RootContainerEx
 * 继承OpenLayers.Layer.Vector.RootContainer
 * 修改其中的collectRoots方法，使之移动元素从map的Layers的顺序变更为从this.layers
 * 主要解决当面图层后添加后会覆盖点图层的选择，修改后可通过控制this.layers的图层顺序来控制图层之间的zindex关系
 */
OpenLayers.Layer.Vector.RootContainerEx = OpenLayers.Class(OpenLayers.Layer.Vector.RootContainer, {
    
  
    /**
     * Method: collectRoots
     * Collects the root nodes of all layers this control is configured with
     * and moveswien the nodes to this control's layer
     */
    collectRoots: function() {
         for(var i=0; i<this.layers.length; ++i) {
        	var layer = this.layers[i];
            if(OpenLayers.Util.indexOf(this.map.layers, layer) != -1) {
                layer.renderer.moveRoot(this.renderer);
            }
        }
    },
    CLASS_NAME: "OpenLayers.Layer.Vector.RootContainerEx"
});
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
/**
 * Class: OpenLayers.Popup.DarkPopup
 *
 * Inherits from:
 *  - <OpenLayers.Popup>
 */
OpenLayers.Popup.DarkPopup =
    OpenLayers.Class(OpenLayers.Popup, {
        //内容样式
        contentDisplayClass: "darkPopupContent",
        //保持地图可视范围内
        panMapIfOutOfView: true,
        //自适应大小
        autoSize: true,
        /**
         * Parameter: anchor
         * {Object} Object to which we'll anchor the popup. Must expose a
         *     'size' (<OpenLayers.Size>) and 'offset' (<OpenLayers.Pixel>).
         */
        anchor: null,

        /**
         * Constructor: OpenLayers.Popup.DarkPopup
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
            this.anchor = (anchor != null) ? anchor : { size: new OpenLayers.Size(0,0), offset: new OpenLayers.Pixel(60,-150)};
            this.setBackgroundColor("transparent");
        },

        setSize:function(contentSize) {
            this.size = contentSize.clone();
            // if our contentDiv has a css 'padding' set on it by a stylesheet, we
            //  must add that to the desired "size".
            var contentDivPadding = this.getContentDivPadding();
            var wPadding = contentDivPadding.left + contentDivPadding.right;
            var hPadding = contentDivPadding.top + contentDivPadding.bottom;

            // take into account the popup's 'padding' property
            this.fixPadding();
            wPadding += this.padding.left + this.padding.right;
            hPadding += this.padding.top + this.padding.bottom;

            // make extra space for the close div
            if (this.closeDiv) {
                var closeDivHeight = parseInt(this.closeDiv.style.height);
                hPadding += closeDivHeight + contentDivPadding.top;
                this.groupDiv.style.paddingTop=closeDivHeight+"px";
            }

            //increase size of the main popup div to take into account the
            // users's desired padding and close div.
            this.size.w += wPadding;
            this.size.h += hPadding;

            //now if our browser is IE, we need to actually make the contents
            // div itself bigger to take its own padding into effect. this makes
            // me want to shoot someone, but so it goes.
            if (OpenLayers.BROWSER_NAME == "msie") {
                this.contentSize.w +=
                    contentDivPadding.left + contentDivPadding.right;
                this.contentSize.h +=
                    contentDivPadding.bottom + contentDivPadding.top;
            }

            if (this.div != null) {
                this.div.style.width = this.size.w + "px";
                this.div.style.height = this.size.h + "px";
            }
            if (this.contentDiv != null){
                this.contentDiv.style.width = contentSize.w + "px";
                this.contentDiv.style.height = contentSize.h + "px";
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
            this.closeDiv = OpenLayers.Util.createDiv(
                this.id + "_close", null, {w: 50, h: 21}
            );
            this.closeDiv.className = "darkPopupCloseBox";

            // use the content div's css padding to determine if we should
            //  padd the close div
            var contentDivPadding = this.getContentDivPadding();

            this.closeDiv.style.right = contentDivPadding.right + "px";
            this.closeDiv.style.top = contentDivPadding.top + "px";
            this.groupDiv.insertBefore(this.closeDiv,this.contentDiv);
            var closePopup = callback || function(e) {
                this.hide();
                OpenLayers.Event.stop(e);
            };
            OpenLayers.Event.observe(this.closeDiv, "touchend",
                OpenLayers.Function.bindAsEventListener(closePopup, this));
            OpenLayers.Event.observe(this.closeDiv, "click",
                OpenLayers.Function.bindAsEventListener(closePopup, this));
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

        CLASS_NAME: "OpenLayers.Popup.DarkPopup"
    });/**
 * Class: OpenLayers.Popup.ShadowPopup
 * 
 * Inherits from:
 *  - <OpenLayers.Popup>
 */
OpenLayers.Popup.ShadowPopup = 
  OpenLayers.Class(OpenLayers.Popup,OpenLayers.Popup.HikPopup, {

    positionBlocks: {
    	"tr": {
    		'offset': new OpenLayers.Pixel(-80, 0),
    		'padding': new OpenLayers.Bounds(25, 23, 25, 3),
    		'closeBox': {
    			position: new OpenLayers.Pixel(30, 8)
    		},
	        'blocks': [
	            { // top-left
	                size: new OpenLayers.Size('auto', 'auto'),
	                anchor: new OpenLayers.Bounds(0, 33, 32, 0),
	                position: new OpenLayers.Pixel(0, 0)
	            },
	            { //top-right
	                size: new OpenLayers.Size(32, 'auto'),
	                anchor: new OpenLayers.Bounds(null, 33, 0, 0),
	                position: new OpenLayers.Pixel(-1128, 0)
	            },
	            { //bottom-left
	                size: new OpenLayers.Size('auto',33),
	                anchor: new OpenLayers.Bounds(0, 0, 32, null),
	                position: new OpenLayers.Pixel(0, -710)
	            },
	            { //bottom-right
	                size: new OpenLayers.Size(32, 33),
	                anchor: new OpenLayers.Bounds(null, 0, 0, null),
	                position: new OpenLayers.Pixel(-1128, -710)
	            },
	            { // left-shadow
	                size: new OpenLayers.Size(23, 135),
	                anchor: new OpenLayers.Bounds(0, 23, null, null),
	                position: new OpenLayers.Pixel(-1160, 0)
	            },
	            { //right-shadow
	                size: new OpenLayers.Size(23, 135),
	                anchor: new OpenLayers.Bounds(null, 23, 0, null),
	                position: new OpenLayers.Pixel(-1160, -200)
	            }
	        ]
	   	}
    },
    
    CLASS_NAME: "OpenLayers.Popup.ShadowPopup"
});
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
/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers.Control.SelectFeature
 */

/**
 *扩展OpenLayers.Control.SelectFeature
 */
OpenLayers.Control.SelectFeatureEx = OpenLayers.Class(OpenLayers.Control.SelectFeature, {
    
	
	
    /**
     * Constructor: OpenLayers.Control.SelectFeature
     * Create a new control for selecting features.
     *
     * Parameters:
     * layers - {<OpenLayers.Layer.Vector>}, or an array of vector layers. The
     *     layer(s) this control will select features from.
     * options - {Object} 
     */
	initialize: function(layers, options) {
        OpenLayers.Control.SelectFeature.prototype.initialize.apply(this,[layers, options]);
        //使点击元素仍可拖动地图
        this.handlers.feature.stopDown= false;
	},
	
	 /**
     * Method: initLayer
     * Assign the layer property. If layers is an array, we need to use
     *     a RootContainer.
     *
     * Parameters:
     * layers - {<OpenLayers.Layer.Vector>}, or an array of vector layers.
     */
    initLayer: function(layers) {
        if(OpenLayers.Util.isArray(layers)) {
            this.layers = layers;
            this.layer = new OpenLayers.Layer.Vector.RootContainerEx(
                this.id + "_container", {
                    layers: layers
                }
            );
        } else {
            this.layer = layers;
        }
    },
	
	
	/**
     * APIMethod: addLayer
     * 添加一个选中图层
     * Parameters:
     * layer - a single {<OpenLayers.Layer.Vector>}
     * index - 图层插入位置
     */
	addLayer: function(layer,index) {
        var isActive = this.active;
        this.unselectAll();
        this.deactivate();
        var newLayers=this.layers;
        if(this.layers) {
	        if(index != undefined){
	        	//如果非数字
	        	if(isNaN(index)){
	        		//前置图层
	        		index=0;
	        	}else{
	        		//处理位置
	        		if(index < 0){
	        			index=0;
	        		}else if(index >= this.layers.length){
	        			index= this.layers.length-1;
	        		}
	        	}
	        	//指定位置添加图层
	        	newLayers.splice(index,0,layer);
	        }else{
	        	//后置图层	        	
	        	newLayers.push(layer);
	        }
            this.layer.destroy();
            this.layers = null;
        }
        this.initLayer(newLayers);
        this.handlers.feature.layer = this.layer;
        if (isActive) {
            this.activate();
        }
    },
     /**
     * APIMethod: removeLayer
     * 删除一个选中图层
     * Parameters:
     * layer - a single {<OpenLayers.Layer.Vector>}
     */
    removeLayer: function(layer) {
        var isActive = this.active;
        this.unselectAll();
        this.deactivate();
        var newLayers=new Array();
        if(this.layers) {
        	for(var i=0;i<this.layers.length;i++){
        		if(this.layers[i].id!=layer.id){
        			newLayers.push(this.layers[i]);
        		}
        	}
            this.layer.destroy();
            this.layers = null;
        }
        this.initLayer(newLayers);
        this.handlers.feature.layer = this.layer;
        if (isActive) {
            this.activate();
        }
    },
	
    CLASS_NAME: "OpenLayers.Control.SelectFeatureEx"
});
/**
 * @requires OpenLayers.Control.SelectFeature
 */

/**
 *OpenLayers.Control.EventFeature
 */
OpenLayers.Control.EventFeature = OpenLayers.Class(OpenLayers.Control, {
	initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Feature(
            this, layer, {
            	click: this.clickFeature,
            	clickout: this.clickoutFeature,
            	over: this.overFeature,
            	out: this.outFeature,
            	dblclick: this.dblclickFeature
            },{
            	stopDown: false
            }
        );
    },
    
    clickFeature: function(feature) {},
    clickoutFeature: function(feature) {},
    overFeature: function(feature) {},
    outFeature: function(feature) {},
    dblclickFeature: function(feature) {},
    
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
	
    CLASS_NAME: "OpenLayers.Control.EventFeature"
});
OpenLayers.Control.LTOverviewMap = OpenLayers.Class(OpenLayers.Control.OverviewMap, {
	//初始化
	initialize : function(options) {
		this.minRatio = 10;
		this.maxRatio = 10;
		this.minRectSize = 10;
		this.maximized = true;
		OpenLayers.Control.OverviewMap.prototype.initialize.apply(this,
				[options]);

	},
	/**
	 * 将鹰眼中心点设置和Map相同
	 */
	setOvMapCenter : function() {
		this.ovmap.setCenter(this.map.getExtent().getCenterLonLat());
	},
	/*
	 * 更新地图范围到鹰眼图的图框
	 */
	updateMapToRect : function() {
		OpenLayers.Control.OverviewMap.prototype.updateMapToRect.apply(
				this, arguments);
		this.ovmap.setCenter(this.map.getExtent().getCenterLonLat());
	},
	/*
	 * 创建Map对象
	 */
	createMap : function() {
		OpenLayers.Control.OverviewMap.prototype.createMap.apply(this,
				arguments);
		this.ovmap.events.register('moveend', this,
				this.updateRectToMap);
		this.ovmap.events.register('zoomend', this,
				this.updateRectToMap);
	},
	/*
	 * 绘制鹰眼图组件
	 */
	draw : function() {
		OpenLayers.Control.prototype.draw.apply(this, arguments);
		if (!(this.layers.length > 0)) {
			if (this.map.baseLayer) {
				var layer = this.map.baseLayer.clone();
				this.layers = [layer];
			} else {
				this.map.events.register("changebaselayer", this,
						this.baseLayerDraw);
				return this.div;
			}
		}

		this.element = document.createElement('div');
		this.element.className = this.displayClass + 'Element';
		this.element.style.display = 'none';

		this.mapDiv = document.createElement('div');
		this.mapDiv.style.width = this.size.w + 'px';
		this.mapDiv.style.height = this.size.h + 'px';
		this.mapDiv.style.position = 'relative';
		this.mapDiv.style.overflow = 'hidden';
		this.mapDiv.id = OpenLayers.Util.createUniqueID('overviewMap');

		this.extentRectangle = document.createElement('div');
		this.extentRectangle.style.position = 'absolute';
		this.extentRectangle.style.zIndex = 1000; // HACK
		this.extentRectangle.className = this.displayClass
				+ 'ExtentRectangle';
		this.mapDiv.appendChild(this.extentRectangle);

		this.element.appendChild(this.mapDiv);

		this.div.appendChild(this.element);
		
		if (!this.outsideViewport) {
			this.div.className += " " + this.displayClass + 'Container';
			var imgLocation = OpenLayers.Util.getImagesLocation();
			var img = imgLocation + 'overexpand.png';
			this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
					this.displayClass + 'MaximizeButton', null,
					new OpenLayers.Size(16, 16), img, 'absolute');
			this.maximizeDiv.style.display = 'none';
			this.maximizeDiv.className = this.displayClass
					+ 'MaximizeButton';
			OpenLayers.Event.observe(this.maximizeDiv, 'click',
					OpenLayers.Function.bindAsEventListener(
							this.maximizeControl, this));
			this.div.appendChild(this.maximizeDiv);
			var img = imgLocation + 'overcontract.png';
			this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
					'OpenLayers_Control_minimizeDiv', null,
					new OpenLayers.Size(16, 16), img, 'absolute');
			this.minimizeDiv.style.display = 'none';
			this.minimizeDiv.className = this.displayClass
					+ 'MinimizeButton';
			OpenLayers.Event.observe(this.minimizeDiv, 'click',
					OpenLayers.Function.bindAsEventListener(
							this.minimizeControl, this));
			this.div.appendChild(this.minimizeDiv);

			var eventsToStop = ['dblclick', 'mousedown'];

			for (var i = 0, len = eventsToStop.length; i < len; i++) {

				OpenLayers.Event.observe(this.maximizeDiv,
						eventsToStop[i], OpenLayers.Event.stop);

				OpenLayers.Event.observe(this.minimizeDiv,
						eventsToStop[i], OpenLayers.Event.stop);
			}

			this.minimizeControl();
		} else {
			this.element.style.display = '';
		}
		if (this.map.getExtent()) {
			this.update();
		}

		this.map.events.register('moveend', this, this.update);
		this.map.events.register('zoomend', this, this.update);
		this.map.events.register('dragend', this, this.update);

		this.map.events.register('moveend', this, this.setOvMapCenter);
		this.map.events.register('zoomend', this, this.setOvMapCenter);
		this.map.events.register('dragend', this, this.setOvMapCenter);
		if (this.maximized) {
			this.maximizeControl();
		}
		return this.div;
	},
	
	 /**
     * Method: maximizeControl
     * Unhide the control.  Called when the control is in the map viewport.
     *
     * Parameters:
     * e - {<OpenLayers.Event>}
     */
    maximizeControl: function(e) {
		this.element.style.display = '';
		this.showToggle(false);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
        //丁万里添加
        try{
        	$(".olControlMousePosition").css("right",this.size.w+15);
        }catch(e){}
    },

    /**
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size, 
     * add the maximize icon
     * 
     * Parameters:
     * e - {<OpenLayers.Event>}
     */
    minimizeControl: function(e) {
        this.element.style.display = 'none';
        this.showToggle(true);
        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
        //丁万里添加
        try{
        	$(".olControlMousePosition").css("right",25);
        }catch(e){}
    },
	CLASS_NAME : "OpenLayers.Control.LTOverviewMap"
});OpenLayers.Control.HikMeasure = OpenLayers.Class({
	// 基本操作的地图对象
	map : null,
	// 测量工具
	measureControls : null,
	//测量标签显示测量结果绘制图层
	markerLayer : null,
	//测量中的线面绘制图层
	drawLayer : null,
	sketchSymbolizers : null,
	//是否使用大地坐标参数
	geodesic: false,
	//鼠标提示信息
	tipdiv: null,
	
	//绘制记录变量
	_measureRecord : null,
	_tipMarkers : null,
	_tipFeatures : null,
	_measureCount : null,

	/*
	 * 构造函数
	 */
	initialize : function(map,options) {
		// 设施操作的地图对象
		this.map = map;
		if(options){
			this.geodesic = options.geodesic ? true : false;
		}
		this.drawLayer = map.graphicsLayer;
		// 样式，测量是绘制的线和面的样式
		this.sketchSymbolizers = {
			"Point" : {
				pointRadius : 2,
				graphicName : "circle",
				fillColor : "#ffffff",
				fillOpacity : 0.3,
				strokeWidth : 2,
				strokeOpacity : 1,
				strokeColor : "#39abff"
			},
			"PointDraw" : {
				pointRadius : 3,
				graphicName : "circle",
				fillColor : "#ffffff",
				fillOpacity : 0.8,
				strokeWidth : 2,
				strokeOpacity : 1,
				strokeColor : "#39abff",
				graphicZIndex : 10
			},
			"Line" : {
				strokeWidth : 2,
				strokeOpacity : 1,
				strokeColor : "#39abff",
				graphicZIndex : 5
			},
			"Polygon" : {
				strokeWidth : 2,
				strokeOpacity : 1,
				strokeColor : "#39abff",
				fillColor : "#39abff",
				fillOpacity : 0.3
			}
		};
		var style = new OpenLayers.Style();
		style.addRules([new OpenLayers.Rule({
			symbolizer : this.sketchSymbolizers
		})]);
		var styleMap = new OpenLayers.StyleMap({
			"default" : style
		});
		var options = {
			handlerOptions : {
				style : "default",
				layerOptions : {
					styleMap : styleMap
				},
				persist : true
			},
			geodesic : this.geodesic
//			partialDelay :100
		};
		// 测量工具
		this.measureControls = {
			line : new OpenLayers.Control.Measure(OpenLayers.Handler.Path, options),
			polygon : new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, options)
		};

		var control;
		// 测试回调函数
		var measureHandler = OpenLayers.Function.bindAsEventListener(this.handleMeasurements, this);
		var measurepartialHandler = OpenLayers.Function.bindAsEventListener(this.handleMeasurepartial, this);
		for (var key in this.measureControls) {
			control = this.measureControls[key];
			control.events.on({
				"measure" : measureHandler,
				"measurepartial" : measurepartialHandler
			});
			this.map.addControl(control);
		};

		//初始化绘制记录变量
		this._measureRecord = {};
		this._tipMarkers = [];
		this._tipFeatures = [];
		this._measureCount = 0;
	},
	
	/**
	 * 停止测量操作
	 */
	deactivate : function(notClearTip) {
		if (this.measureControls != null) {
			for (var key in this.measureControls) {
				var control = this.measureControls[key];
				control.deactivate();
			};
			if(!notClearTip){ //默认情况下会删除，在绘制完成调用时设置不删除
				//清除未完成测距的临时元素
				for(var i=0;i< this._tipFeatures.length; i++){
					this._tipFeatures[i].destroy();
					this.markerLayer.removeMarker(this._tipMarkers[i]);
					this._tipMarkers[i].destroy();
				}
				this._tipFeatures=[];
				this._tipMarkers=[];
			}
		}
	},
	
	/**
	 * 绘制工具激活控制
	 */
	toggleControl : function(element) {
		if(!this.drawLayer){
			this.drawLayer=new OpenLayers.Layer.Vector("hik_measure_vector",{renderers: ['SVG', 'VML', 'Canvas'],displayInLayerSwitcher : false});
			this.map.addLayer(this.drawLayer);
		}
		if(!this.markerLayer){
			this.markerLayer = new OpenLayers.Layer.Markers("hik_measure_markers",{displayInLayerSwitcher : false});
			this.markerLayer.id="hik_measure_markers";
			this.map.addLayer(this.markerLayer);
		}
		if (this.measureControls != null) {
			for (key in this.measureControls ) {
				var control = this.measureControls [key];
				if (element == key) {
					control.activate();
				} else {
					control.deactivate();
				}
			}
		}	
	},
	
	/**
	 * 测量距离
	 */
	measureDistance : function() {
		this.toggleControl('line');
		this.showTip("单击以开始绘制，双击完成操作");
	},
	/**
	 * 测量面积
	 */
	measureArea : function() {
		this.toggleControl('polygon');
		this.showTip("单击以开始绘制，双击完成操作");
	},


	
	/**
	 * 判断多边形是否相交
	 * @param {} polygon
	 */
	isSelfIntersect:function(polygon){
		var points=polygon.components[0].components;
		var length=points.length;
		var ring=[];
		for(var i=0;i<length;i++){
			var point=points[i];
			ring.push([point.x,point.y]);
		}
		return GisUtil.intersectPolygon(ring);
	},
	
	
	/**
	 * 测量结束回调函数
	 * @param {Object} event
	 * @memberOf {TypeName} 
	 * @return {TypeName} 
	 */
	handleMeasurements : function(event) {
		this.hideTip();
		this.deactivate(true);
		var geometry = event.geometry;
		var units = event.units;
		var order = event.order;
		var measure = event.measure;
		if (measure > 0) {
			var out = "";
			if (order == 1) { // 测距
				out = measure.toFixed(2) + (units == "m" ? "米" : "公里");
	
			} else {
				out = measure.toFixed(2) + (units == "m" ? "平方米" : "平方公里");
			}
			if(measure < 0.01 && units == "m"){
				return;
			}
			out = out;
			var geometryArray = geometry.getVertices();
			if (geometryArray.length > 1) {
				var pointX = geometryArray[geometryArray.length - 1].x;
				var pointY = geometryArray[geometryArray.length - 1].y;
				var point = new OpenLayers.Geometry.Point(pointX, pointY);

				var geometryFetrue;
				if (order == 1) {//测距
					geometryFetrue = new OpenLayers.Feature.Vector(geometry, null, this.sketchSymbolizers['Line']);
					//结束顶点
					var vector = new OpenLayers.Feature.Vector(geometryArray[geometryArray.length - 1], {}, this.sketchSymbolizers.PointDraw);
					this.drawLayer.addFeatures([vector]);
					this._tipFeatures.push(vector);
					//结束顶点标签
					var html = "";
					html += "<DIV class='measure_end'>" + "<SPAN style=''>总长：</SPAN><SPAN>" + out + '</SPAN></DIV>';
					var closeDiv = document.createElement("div");
					closeDiv.title = "清除";
					closeDiv.className = "measure_close";
					
					var markerIcon = new OpenLayers.HtmlIcon(html, {}, {x : 10,y : -5});
					var marker = new OpenLayers.Marker(new OpenLayers.LonLat(pointX, pointY), markerIcon);
					this.markerLayer.addMarker(marker);
					markerIcon.div.appendChild(closeDiv);
					this._tipMarkers.push(marker);
					//记录对象
					this._measureRecord[this._measureCount]={
						feature : geometryFetrue,
						tipFeatures : this._tipFeatures,
						tipMarkers : this._tipMarkers
					};
					this._tipFeatures=[];
					this._tipMarkers=[];
					//定义删除操作
					var thisObj = this;
					closeDiv.mCount = this._measureCount;
					closeDiv.onclick = function(event) {
						var count=this.mCount;
						var thisMeasure=thisObj._measureRecord[count];
						//清除vector
						thisObj.drawLayer.removeFeatures(thisMeasure.feature);
						for(var i=0; i<thisMeasure.tipFeatures.length; i++){
							thisMeasure.tipFeatures[i].destroy();
						}
						//清除marker
						for(var i=0; i<thisMeasure.tipMarkers.length; i++){
							var thisMarker = thisMeasure.tipMarkers[i];
							thisObj.markerLayer.removeMarker(thisMarker);
							thisMarker.destroy();
						}
						//销毁记录对象属性
						delete thisObj._measureRecord[count];
					};
				} else {
					//面元素
					if(this.isSelfIntersect(geometry)){
						out="无法计算自交多边形面积，请重新绘制！";
					}
					geometryFetrue = new OpenLayers.Feature.Vector(geometry, {}, this.sketchSymbolizers['Polygon']);
					var html = "";
					html += "<DIV class='measure_end'>"
							+ "<SPAN style=''>面积：</SPAN><SPAN>"
							+  out + '</SPAN></DIV>';
					var closeDiv = document.createElement("img");
					closeDiv.title = "清除";
					closeDiv.className = "measure_close";
					closeDiv.src= OpenLayers._getScriptLocation() + 'theme/extend/img/w_close_red.png';
					//面积标签marker
					var lonlat = geometry.getBounds().getCenterLonLat();
					var markerIcon = new OpenLayers.HtmlIcon(html,{},{x:10,y:-5});
					var marker = new OpenLayers.Marker(lonlat, markerIcon);
					this.markerLayer.addMarker(marker);
					markerIcon.div.appendChild(closeDiv);
					//记录对象
					this._measureRecord[this._measureCount]={
						feature : geometryFetrue,
						marker : marker
					};
					//定义删除操作
					var thisObj = this;
					closeDiv.mCount = this._measureCount;
					closeDiv.onclick = function(event) {
						var count=this.mCount;
						var thisMeasure=thisObj._measureRecord[count];
						//清除vector
						var feature=thisMeasure.feature;
						thisObj.drawLayer.removeFeatures([feature]);
						feature.destroy();
						thisMeasure.feature = null;
						//清除marker
						var marker=thisMeasure.marker;
						thisObj.markerLayer.removeMarker(marker);
						marker.destroy();
						thisMeasure.marker = null;
						//销毁记录对象属性
						delete thisObj._measureRecord[count];
					};
				}
				//绘制测量线或测量面
				this.drawLayer.addFeatures([geometryFetrue]);
				this._measureCount++;
			}else {
				return;
			}	
		}	
	},
	

	/**
	 * 测量过程中回调函数
	 * @param {Object} event
	 * @memberOf {TypeName} 
	 */
	handleMeasurepartial : function(event) {
		var order = event.order;
		if (order == 1) {
			var geometry = event.geometry;
			var units = event.units;
			var unitsStr= units == "m" ? "米" : "公里";
			var measure = event.measure;
			var geometryArray = geometry.getVertices();
			//线上顶点
			var vector = new OpenLayers.Feature.Vector(geometryArray[geometryArray.length - 1], {},this.sketchSymbolizers.PointDraw);
			this.drawLayer.addFeatures([vector]);
			this._tipFeatures.push(vector);
			//线上顶点提示
			var html = '<LABEL class="measurelength_lable"><DIV class="measurelength_divleft"><DIV class="measurelength_divright">';
			var pointX = geometryArray[geometryArray.length - 1].x;
			var pointY = geometryArray[geometryArray.length - 1].y;
			if (geometryArray.length < 3) {
				html += "起点" + '</DIV>' + '</DIV></LABEL>';
			} else {
				html += "<DIV id='mesurelength' value='" + measure.toFixed(2) + "'>" + measure.toFixed(2) + unitsStr
				        + '</DIV></DIV>' 
				        + '</DIV></LABEL>';
			}
			var markerIcon = new OpenLayers.HtmlIcon(html,null,{x:10,y:-2});
			var marker = new OpenLayers.Marker(new OpenLayers.LonLat(pointX, pointY), markerIcon);
			this.markerLayer.addMarker(marker);
			this._tipMarkers.push(marker);
		}
	},
	
	/**
	 * 测量结束后清理，销毁绘制临时图层
	 * @memberOf {TypeName} 
	 */
	clear : function() {
		this.deactivate();
		if(this.drawLayer){
			this.drawLayer.destroy();
			this.drawLayer=null;
		}
		if(this.markerLayer){
			this.markerLayer.destroy();
			this.markerLayer=null;
		}
		//初始化绘制记录变量
		this._measureRecord = {};
		this._tipMarkers = [];
		this._tipFeatures = [];
		this._measureCount = 0;
	},
	
	//显示tip
	showTip : function(content) {
		if (!this.tipdiv) {
			var mapContainer = document.getElementById(this.map.div.id);
			this.tipdiv = document.createElement("div");
			this.tipdiv.id = OpenLayers.Util.createUniqueID(this.map.div.id+ "_maptip_");
			this.tipdiv.style['max-width'] = '500px';
			this.tipdiv.style['min-width'] = '40px';
			this.tipdiv.style['line-height'] = '16px';
			this.tipdiv.style.border = '1px solid #999999';
			this.tipdiv.style.position = 'absolute';
			this.tipdiv.style.backgroundColor = "#ddd";
			this.tipdiv.style.padding = '2px';
			this.tipdiv.style.display = 'none';
			this.tipdiv.style.zIndex = 2000;
			mapContainer.appendChild(this.tipdiv);
		}
		
		var me = this;
		//显示tip事件
		this.showTipEvent =function(event){
			if (me.tipdiv.shown) {
				if (me.tipdiv.style.display === 'none') {
					me.tipdiv.style.display = 'block';
				}
				event = event || window.event;
				var left = event.clientX, top = event.clientY;
				var parentObj = document.getElementById(me.map.div.id);
				while (parentObj) {
					left -= parentObj.offsetLeft;
					top -= parentObj.offsetTop;
					parentObj = parentObj.offsetParent;
				}
				me.tipdiv.style.left = (left + document.body.scrollLeft + 20) + 'px';
				me.tipdiv.style.top = (top + document.body.scrollTop) + 'px';
			}
		};
		//隐藏tip事件
		this.hideTipEvent =function(event){
			me.tipdiv.style.display = 'none';
		};
		
		this.map.events.register("mousemove", map, this.showTipEvent );
		this.map.events.register("mouseout", map, this.hideTipEvent );
		
		this.tipdiv.innerHTML = content;
		this.tipdiv.shown = true;
	},

	//隐藏tip
	hideTip : function() {
		if (this.tipdiv) {
			this.tipdiv.shown = false;
			this.tipdiv.style.display = 'none';
			this.map.events.unregister("mousemove", map, this.tipMoveEvent );
			this.map.events.unregister("mouseout", map, this.hideTipEvent);
		}
	},
	// 类名
	CLASS_NAME : "OpenLayers.Control.HikMeasure"
});/**
 * 地图移动缩放条
 */
OpenLayers.Control.HikPanZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoomBar, {
	
	//移动缩放条是否默认显示
	visible: false,
	
	//地图中心点
	center: null,
	//地图初始化等级
	initZoom: null,
	
	//背景图标div
	backgrounds: null,
	
	//Control
	controls: null,
    
	
    /**
     * Constructor: OpenLayers.Control.HikPanZoomBar
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
    	//移动缩放条偏移位置
        this.position = new OpenLayers.Pixel(0,0);
        this.slideRatio=0.25;
        this.center=options.center;
        this.initZoom=options.initZoom;
        this.zoomStopHeight=11;
        //背景div数组
        this.backgrounds=[];
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    	
        
    },
	
	draw : function(px) {
		// initialize our internal div
		OpenLayers.Control.prototype.draw.apply(this, arguments);
		px = this.position.clone();
		// place the controls
		this.buttons = [];
		this.backgrounds=[];
		
		if(this.controls == null){
			this.controls={
				"navigationHistory" : new OpenLayers.Control.NavigationHistory(),
				"zoomBox":new OpenLayers.Control.ZoomBox({id:"zoomBoxControl" , alwaysZoom:true})
			};
			//添加control
			for(var key in this.controls) {
		       this.map.addControl(this.controls[key]);
		    }
		}	
		//创建上下左右移动区域
		this._addPan();
		//创建缩放条
		this._addZoomBar();
		//创建控制按钮条
		this._addControlBar();
		//初始化显示隐藏
		this._initVisible();
		
		return this.div;
	},
	
	//控制隐藏和显示工具条(必须放最后添加，确保能隐藏所有兄弟节点)
	_initVisible :function(){
		if(!this.centervisible){
			var toggleBarBtn= this._addButton("togglebar", "pan-zoom-close pan-zoom-open");
			this._toggleSibling(toggleBarBtn, this.visible);
		}else{
			this._addButton("togglebar", "pan-zoom-close");
		}
	},
	
	/**
	 * 创建div
	 * @param className
	 * @param px
	 * @returns {___div0}
	 */
	_createDiv : function(className, px){
		var div = document.createElement("div");
		div.className=className;
		div.style.position="absolute";
		if (px) {
			div.style.left = px.x + "px";
			div.style.top = px.y + "px";
        }
		this.div.appendChild(div);
		return div;
	},
	
	/**
	 * 添加背景类型的div
	 * @param calssName
	 * @returns
	 */
	_addBackground : function(className, px){
		var div = this._createDiv(className, px);
		this.backgrounds.push(div);
		return div;
	},
	
	/**
	 * 创建按钮
	 * @param id
	 * @param className
	 * @returns
	 */
    _addButton:function(id, className, title, px) {
    	var btn = this._createDiv(className +" olButton", px);
        btn.style.cursor = "pointer";
        btn.action = id;
        if(title){
        	btn.title = title;
        }
        this.buttons.push(btn);
        return btn;
    },
	
	_addPan : function() {
		//创建背景DIV
		this._addBackground("pan-container-bg");
		//创建按钮
		this._addButton("panup", "pan-up","地图上移");
		this._addButton("panleft", "pan-left","地图左移");
		this._addButton("panright", "pan-right","地图右移");
		this._addButton("pandown", "pan-down", "地图下移");
		this._addButton("zoomhome", "pan-home", "地图重置");
	},

	_addZoomBar : function(centered) {
		//ZoomBar绝对定位位置（左上角）
		var px=new OpenLayers.Pixel(31, 80);
		//zoombar尺寸
		var minZoom = this.map.getMinZoom();
		var sz = {
			w : this.zoomStopWidth,
			h : this.zoomStopHeight * (this.map.getNumZoomLevels() - minZoom)
		};
		//创建放大按钮
		var zoomIn=this._addButton("zoomin", "zoom-in", "地图放大", px);
		//创建slider
		var id = this.id + "_" + this.map.id;
		var zoomsToEnd = this.map.getNumZoomLevels() - this.initZoom +1;
		var slider =this._createDiv("slider", px.add(2,zoomsToEnd * this.zoomStopHeight));
		slider.id=id;

		this.slider = slider;
		this.sliderEvents = new OpenLayers.Events(this, slider, null, true,
											{includeXY: true});
		this.sliderEvents.on({
			"touchstart" : this.zoomBarDown,
			"touchmove" : this.zoomBarDrag,
			"touchend" : this.zoomBarUp,
			"mousedown" : this.zoomBarDown,
			"mousemove" : this.zoomBarDrag,
			"mouseup" : this.zoomBarUp
		});
		
		//创建滑条背景DIV
//		var zoombarBg=this._addBackground("zoom-bar",px.add(7,20));
//		zoombarBg.style.height=sz.h+"px";
		
		var zoombar=this._createDiv("zoom-bar olButton",px.add(7,20));
		zoombar.id=id;
		zoombar.style.height=sz.h+"px";
		zoombar.style.cursor = "pointer";
		this.zoombarDiv=zoombar;
		this.startTop = parseInt(zoombar.style.top);
		
		//创建缩小按钮
		this._addButton("zoomout", "zoom-out", "地图缩小", px.add(0,(18 + sz.h) ));
		
		this.map.events.register("zoomend", this, this.moveZoomBar);

	},
	
	
	/**
	 * 创建控制按钮条
	 */
	_addControlBar : function(){
		//控制按钮条绝对定位位置（左上角）
		var px=new OpenLayers.Pixel(82, 27);
		//按钮间隔
		var deltaW=23;
		//创建背景DIV
		var middleWidth=128;
		this._addBackground("control-btn-container-left",px);
		var middle= this._addBackground("control-btn-container-middle",px.add(4,0));
		middle.style.width=middleWidth+"px";
		this._addBackground("control-btn-container-right",px.add(4+middleWidth,0));
		//创建功能按钮
		px=px.add(8,5);
		this._addButton("panpre", "pan-pre btn", "上一步", px);
		px=px.add(deltaW,0);
		this._addButton("pannext", "pan-next btn", "下一步", px);
		px=px.add(deltaW-2,0);
		this._addBackground("btn-interval", px);
		px=px.add(8,0);
		this._addButton("rectzoomin", "rect-zoom-in btn", "拉框缩小", px);
		px=px.add(deltaW,0);
		this._addButton("rectzoomout", "rect-zoom-out btn", "拉框放大", px);
		px=px.add(deltaW-2,0);
		this._addBackground("btn-interval", px);
		px=px.add(8,0);
		this._addButton("pannavigate", "pan-navigate btn", "地图漫游", px);
	},
	
	/**
     * Method: onButtonClick
     *
     * Parameters:
     * evt - {Event}
     */
    onButtonClick: function(evt) {
        var btn = evt.buttonElement;
        switch (btn.action) {
            case "panup": 
                this.map.pan(0, -this.getSlideFactor("h"));
                break;
            case "pandown": 
                this.map.pan(0, this.getSlideFactor("h"));
                break;
            case "panleft": 
                this.map.pan(-this.getSlideFactor("w"), 0);
                break;
            case "panright": 
                this.map.pan(this.getSlideFactor("w"), 0);
                break;
            case "zoomin": 
                this.map.zoomIn(); 
                break;
            case "zoomout": 
                this.map.zoomOut(); 
                break;
            case "zoomhome": 
                this.map.setCenter(this.center, this.initZoom);
                break;
            case "togglebar": 
            	this.togglePanZoomBar(btn);
                break; 
            case "panpre": 
            	this.controls["navigationHistory"].previousTrigger();
                break; 
            case "pannext": 
            	this.controls["navigationHistory"].nextTrigger();
                break; 
            case "rectzoomin": 
            	if(btn.className.indexOf("active")> -1){
        			this.controls["zoomBox"].deactivate();
        			btn.className=btn.className.replace(" active","");
            	}else{
            		this.controls["zoomBox"].out = false;
        			this.controls["zoomBox"].activate();
        			this._removeActiveSibling(btn);
        			btn.className += btn.className+" active";
            	}
                break; 
            case "rectzoomout": 
            	if(btn.className.indexOf("active")> -1){
        			this.controls["zoomBox"].deactivate();
        			btn.className=btn.className.replace(" active","");
            	}else{
            		this.controls["zoomBox"].out = true;
        			this.controls["zoomBox"].activate();
        			this._removeActiveSibling(btn);
        			btn.className += btn.className+" active";
            	}
                break; 
            case "pannavigate": 
            	this.controls["zoomBox"].deactivate();
            	this._removeActiveSibling(btn);
                break; 
                
        }
    },
    
    togglePanZoomBar: function(btn){
    	var visible=null;
    	if(btn.className.indexOf("pan-zoom-open")> -1){
    		visible=true;
    		btn.className=btn.className.replace("pan-zoom-open","");
    	}else{
    		visible=false;
    		btn.className+=" pan-zoom-open";
    	}
    	this._toggleSibling(btn, visible);
    },
    
    _toggleSibling: function(btn, visible){
    	var p = btn.parentNode.children;
    	for(var i =0,pl= p.length;i<pl;i++) {
    		if(p[i] !== btn){
    			p[i].style.display= visible ? "block" : "none";
    		}
    	}
    },
    
    _removeActiveSibling: function(btn, calssName){
    	var p = btn.parentNode.children;
    	for(var i =0,pl= p.length;i<pl;i++) {
    		if(p[i] !== btn){
    			p[i].className=p[i].className.replace(" active","");
    		}
    	}
    },
    
    /**
     * Method: _removeButton
     * 
     * Parameters:
     * btn - {Object}
     */
    _removeBackground: function(div) {
        this.div.removeChild(div);
        OpenLayers.Util.removeItem(this.backgrounds, div);
    },
    
    /**
     * Method: removeButtons
     */
    removeBackgrounds: function() {
        for(var i=this.backgrounds.length-1; i>=0; --i) {
            this._removeBackground(this.backgrounds[i]);
        }
    },
    
    /** 
     * Method: redraw
     * clear the div and start over.
     */
    redraw: function() {
//        if (this.div != null) {
//            this.removeBackgrounds();
//        }  
//    	OpenLayers.Control.PanZoomBar.prototype.redraw.apply(this, arguments);
//    	//初始化显示隐藏
//		this._initVisible();
    },
    
    /**
     * APIMethod: destroy
     */
    destroy: function() {
    	this.center = null;
    	this.initZoom = null;
    	this.removeBackgrounds();
    	for(var key in this.controls) {
	       this.map.removeControl(this.controls[key]);
	    }
        OpenLayers.Control.PanZoomBar.prototype.destroy.apply(this, arguments);

    },
 
	/****
	以下两个函数用户修正BUG，控制slider_bar不超过刻度尺,令其不滑动进入无效缩放级(control中为地图左上角的级别缩放条)
	****/
	zoomBarDrag:function(evt) {
		if (this.mouseDragStart != null) {
			var deltaY = this.mouseDragStart.y - evt.xy.y;
			var offsets = OpenLayers.Util.pagePosition(this.zoombarDiv);
			if ((evt.clientY - offsets[1]) > 0 && 
				(evt.clientY - offsets[1]) < parseInt(this.zoombarDiv.style.height) - 2) {
				var newTop = parseInt(this.slider.style.top) - deltaY; 
				if(newTop < parseInt(this.zoombarDiv.style.top) + 1){
					newTop = parseInt(this.zoombarDiv.style.top) + 1;
				} 
				//console.info(parseInt(this.zoombarDiv.style.top) + 1);		
				this.slider.style.top = newTop+"px";
				this.mouseDragStart = evt.xy.clone();
			}
			// set cumulative displacement
			this.deltaY = this.zoomStart.y - evt.xy.y;
			OpenLayers.Event.stop(evt);
		}
	},
	zoomBarUp:function(evt) {
		if (!OpenLayers.Event.isLeftClick(evt) && evt.type !== "touchend") {
			return;
		}
		if (this.mouseDragStart) {
			this.div.style.cursor="";
			this.map.events.un({
				"touchmove": this.passEventToSlider,
				"mouseup": this.passEventToSlider,
				"mousemove": this.passEventToSlider,
				scope: this
			});
			var zoomLevel = this.map.zoom;
			if (!this.forceFixedZoomLevel && this.map.fractionalZoom) {
				zoomLevel += this.deltaY/this.zoomStopHeight;
				zoomLevel = Math.min(Math.max(zoomLevel, 0), 
                         this.map.getNumZoomLevels() - 1);
			} else {
				zoomLevel += this.deltaY/this.zoomStopHeight;
				zoomLevel = Math.max(Math.round(zoomLevel), 0);
				zoomLevel=Math.min(zoomLevel,this.map.getNumZoomLevels()-1);
			}
			this.map.zoomTo(zoomLevel);
			this.mouseDragStart = null;
			this.zoomStart = null;
			this.deltaY = 0;
			OpenLayers.Event.stop(evt);
		}
	},
  
	
	CLASS_NAME : "OpenLayers.Control.HikPanZoomBar"
});OpenLayers.Control.ZoomAnimation = OpenLayers.Class(OpenLayers.Control.Navigation,{
	size:null,
	offset:null,
	uricon:null,
	ulicon:null,
	bricon:null,
	blicon:null,
    // 拖动的滑动效果必须使enableKinetic为true
	dragPanOptions: {enableKinetic: true},
	isCenterMouseWheel:true,
	isCartoonPlay:false,
	initialize: function(options) {
        OpenLayers.Control.Navigation.prototype.initialize.apply(this, arguments);
        this.size = new OpenLayers.Size(7,7);//10,6
	    this.offset = new OpenLayers.Pixel(-(this.size.w/2), -(this.size.h/2));
		var imgPath=OpenLayers._getScriptLocation() + 'theme/extend/img/zoomArrow/';
		this.uricon = new OpenLayers.Icon(imgPath+"ur.png",this.size,this.offset);
	    this.ulicon = new OpenLayers.Icon(imgPath+"ul.png",this.size,this.offset);
		this.bricon = new OpenLayers.Icon(imgPath+"br.png",this.size,this.offset);
		this.blicon = new OpenLayers.Icon(imgPath+"bl.png",this.size,this.offset);
    },
    
    wheelUp: function(evt) {
        var newZoom = this.map.getZoom();
        if (newZoom<this.map.getNumZoomLevels()-1 && !this.isCartoonPlay) {  
        	 this.isCartoonPlay = true;
	        var markers=new OpenLayers.Layer.Markers("Zoomin",{displayInLayerSwitcher: false});
	        var x=evt.xy.x;
	        var y=evt.xy.y;
		    var marker1=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x+30,y+23)),this.bricon.clone());
		    var marker2=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x-30,y+23)),this.blicon.clone());
		    var marker3=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x+30,y-23)),this.uricon.clone());
		    var marker4=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x-30,y-23)),this.ulicon.clone()); 
		    marker1.map=this.map;
		    marker2.map=this.map;
		    marker3.map=this.map;
		    marker4.map=this.map;
		    markers.addMarker(marker1);
		    markers.addMarker(marker2);
		    markers.addMarker(marker3);
		    markers.addMarker(marker4);
		    map.addLayer(markers);
		    var j=0;
		    var t;
		   
		    var _self = this;
		    var movemarker=function(){
			       j++;
		           marker1.moveTo(new OpenLayers.Pixel(x+30+6*j,y+23+4*j));
		           marker2.moveTo(new OpenLayers.Pixel(x-30-6*j,y+23+4*j));
		           marker3.moveTo(new OpenLayers.Pixel(x+30+6*j,y-23-4*j));
		           marker4.moveTo(new OpenLayers.Pixel(x-30-6*j,y-23-4*j));
		            if(j==5){	   
		            	_self.isCartoonPlay = false;
				        map.removeLayer(markers);
				        markers.clearMarkers();
				        markers.destroy();
				        window.clearInterval(t);
			        }
		    };
		    t=window.setInterval(function(){movemarker();}, 100);
        }
        this.wheelChange(evt, 1);  
    },

  
    wheelDown: function(evt) {
        var newZoom = this.map.getZoom();
        if (newZoom>0 && !this.isCartoonPlay) {                   
        	this.isCartoonPlay = true;
	        var markers=new OpenLayers.Layer.Markers("Zoomout",{displayInLayerSwitcher: false});
	        var x=evt.xy.x;
	        var y=evt.xy.y;
		    var marker1=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x+60,y+45)),this.ulicon.clone());
		    var marker2=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x-60,y+45)),this.uricon.clone());
		    var marker3=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x+60,y-45)),this.blicon.clone());
		    var marker4=new OpenLayers.Marker(map.getLonLatFromPixel(new OpenLayers.Pixel(x-60,y-45)),this.bricon.clone()); 
		    marker1.map=this.map;
		    marker2.map=this.map;
		    marker3.map=this.map;
		    marker4.map=this.map;
		    markers.addMarker(marker1);
		    markers.addMarker(marker2);
		    markers.addMarker(marker3);
		    markers.addMarker(marker4);
		    map.addLayer(markers);
		    var j=0;
		    var t;
		    var _self = this;		       		   
		    var movemarker=function(){
			       j++;
		           marker1.moveTo(new OpenLayers.Pixel(x+60-6*j,y+45-4*j));
		           marker2.moveTo(new OpenLayers.Pixel(x-60+6*j,y+45-4*j));
		           marker3.moveTo(new OpenLayers.Pixel(x+60-6*j,y-45+4*j));
		           marker4.moveTo(new OpenLayers.Pixel(x-60+6*j,y-45+4*j));
		           if(j==5){	       
		        	   _self.isCartoonPlay = false;
				        map.removeLayer(markers);
				        markers.clearMarkers();
				        markers.destroy();
				        window.clearInterval(t);
			        }
		    };
		    t=window.setInterval(function(){movemarker();}, 100);
	    } 
	    this.wheelChange(evt, -1); 
    },
    wheelChange: function(evt, deltaZ) {
        var currentZoom = this.map.getZoom();
        var newZoom = this.map.getZoom() + Math.round(deltaZ);
        newZoom = Math.max(newZoom, 0);
        newZoom = Math.min(newZoom, this.map.getNumZoomLevels());
        if (newZoom === currentZoom) {
            return;
        }
        var size    = this.map.getSize();
        var deltaX  = size.w/2 - evt.xy.x;
        var deltaY  = evt.xy.y - size.h/2;
        var newRes  = this.map.baseLayer.getResolutionForZoom(newZoom);
        var zoomPoint = this.map.getLonLatFromPixel(evt.xy);
        var newCenter = new OpenLayers.LonLat(
                            zoomPoint.lon + deltaX * newRes,
                            zoomPoint.lat + deltaY * newRes );
        if(this.isCenterMouseWheel)
            this.map.setCenter( newCenter, newZoom );
        else
            this.map.setCenter(this.map.getCenter(),  this.map.getZoom() + Math.round(deltaZ));
        
    },

	CLASS_NAME: "OpenLayers.Control.ZoomAnimation"
});
/**
 * 地图相关工具类
 */
var GisUtil ={};

var RESOLUTIONS= [
        1.40625, 
        0.703125, 
        0.3515625, 
        0.17578125, 
        0.087890625, 
        0.0439453125,
        0.02197265625, 
        0.010986328125, 
        0.0054931640625, 
        0.00274658203125,
        0.001373291015625, 
        0.0006866455078125, 
        0.00034332275390625,
        0.000171661376953125, 
        0.0000858306884765625, 
        0.00004291534423828125,
        0.00002145767211914062, 
        0.00001072883605957031,
        0.00000536441802978515, 
        0.00000268220901489257,
        0.0000013411045074462891,
        0.00000067055225372314453
    ];
var M_RESOLUTIONS= [
        156543.03390625, 78271.516953125, 39135.7584765625,
        19567.87923828125, 9783.939619140625, 4891.9698095703125,
        2445.9849047851562, 1222.9924523925781, 611.4962261962891,
        305.74811309814453, 152.87405654907226, 76.43702827453613,
        38.218514137268066, 19.109257068634033, 9.554628534317017,
        4.777314267158508, 2.388657133579254, 1.194328566789627,
        0.5971642833948135, 0.29858214169740677, 0.14929107084870338,
        0.07464553542435169
    ];

var  PGIS_RESOLUTIONS =[
    //度/px  					单图经度 跨度 × 256  512递推
	 2							//0		787996801.3191216377952755905508
	 ,1							//1		393998400.6595608188976377952754
	 ,0.5						//2		196999200.32978040944881889763772
	 ,0.25						//3		98499600.164890204724409448818868
	 ,0.125						//4		49249800.082445102362204724409434
	 ,0.0625					//5		24624900.041222551181102362204717	2000000.0-4000000.0
	 ,0.03125					//6		12312450.020611275590551181102364	1000000.0-2000000.0
	 ,0.015625					//7		6156225.0103056377952755905511819	500000.0-1000000.0
	 ,0.0078125					//8		3078112.5051528188976377952755909	200000.0-500000.0
	 ,0.00390625				//9		1539056.2525763881889763779527561	100000.0-200000.0
	 ,0.001953125				//10	769528.12628819409448818897637805	500000.0-1000000.0
	 ,0.0009765625				//11	384764.06314411299212598425196855	200000.0-500000.0	
	 ,0.00048828125				//12	192382.03157203789370078740157483	100000.0-200000.0
	 ,0.000244140625			//13	96191.015786038877952755905511823	50000.0-100000.0
	 ,0.0001220703125			//14	48095.507893019438976377952755911	30000.0-50000.0
	 ,0.00006103515625			//15	24047.753946509719488188976377965	10000.0-30000.0
	 ,0.000030517578125			//16	12023.876973235260826771653543309	10000.0-30000.0
	 ,0.0000152587890625		//17	6011.9384866176304133858267716543	5000.0-10000.0
	 ,0.00000762939453125		//18	3005.9692433283726008858267716559	2000.0-4000
	 ,0.000003814697265625		//19	1502.9846216446081446850393700795
	 ,0.0000019073486328125		//20	751.49038700791207861712598425209
	 ,9.5367431640625e-7		//21	375.74519350395603930856299212605	
	 ,4.76837158203125e-7		//22	187.87259675197801965428149606303
 ];


/*********************************
 * 计算两个经纬度点之间距离
 * @author dingwanli
 *********************************/
function distanceByLnglat( _Longitude1, _Latidute1, _Longitude2, _Latidute2){
   var radLat1 = _Latidute1 * Math.PI / 180;
   var radLat2 = _Latidute2 * Math.PI / 180;
   var a = radLat1 - radLat2;
   var b = _Longitude1 * Math.PI / 180 - _Longitude2 * Math.PI / 180;
   var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
   s = s * 6378137.0;// 取WGS84标准参考椭球中的地球长半径(单位:m)
   //System.out.println(s);
   s = Math.round(s * 10000) / 10000;
   return s;
}


/**
 * 根据角度计算弧度
 * @param {Object} angel_d
 * @return {TypeName} 
 */
function rad(angel_d){
	return angel_d*Math.PI / 180.0 ;
}

/**
 * 根据弧度计算角度
 * @param {Object} x
 * @return {TypeName} 
 */
function deg(x) {
	return x*180/Math.PI;
}

/**
 * 大地主题解算(正算)代码：根据经纬度和方向角以及距离计算另外一点坐标
 * double startLon:起始点经度
 * double startLat:起始点纬度
 * double angel1:方位角,正北方向0度,顺时针为正方向,单位 度
 * double distance:距离,单位m
 * */
function computation( startLon, startLat, angel1, distance){
    /*
	'a      长轴半径
	'b      短轴
	'c      极曲率半径
	'alpha  扁率
	'e      第一偏心率
	'e2     第二偏心率
	'W      第一基本纬度函数
	'V      第二基本纬度函数
	'B1  点1的纬度
	'L1  点1的经度
	'B2  点2的纬度
	'L2  点2的经度
	** S 大地线长度
	'A1  点1到点2的方位角
	'A2  点2到点1的方位角
	*/
    var B1 = startLat ;
    var L1 = startLon ;
    var A1 = angel1 ;
    var S = distance ;
    var a = 6378245.0 ;
    var b = 6356752.3142 ;
    var c = Math.pow(a,2) / b ;
    
    var alpha = (a - b) / a ;
    var e = Math.sqrt( Math.pow(a,2)- Math.pow(b,2) ) / a ; 
    var e2 = Math.sqrt( Math.pow(a,2)- Math.pow(b,2) ) / b ; 
    
    B1 = rad(B1) ;
    L1 = rad(L1) ;
    A1 = rad(A1) ;
    
    var W = Math.sqrt( 1 - Math.pow(e,2)*Math.pow(Math.sin(B1),2) ) ;
    	
    var V = W * (a / b) ;
    var E1 = e ;//第一偏心率
    // 计算起点的归化纬度
    var W1 = W ; //''Sqr(1 - e1 * e1 * Sin(B1 ) * Sin(B1 ))
    var sinu1 = Math.sin(B1) * Math.sqrt(1 - E1 * E1) / W1 ;
    var cosu1 = Math.cos(B1) / W1 ;
    // 计算辅助函数值
    var sinA0 = cosu1 * Math.sin(A1) ; 
    var cotq1 = cosu1 * Math.cos(A1) ;
    var sin2q1 = 2 * cotq1 / ( Math.pow(cotq1,2) + 1 ) ;
    var cos2q1 = ( Math.pow(cotq1,2)-1) / ( Math.pow(cotq1,2) + 1) ;
    // 计算系数AA,BB,CC及AAlpha, BBeta的值
    var cos2A0 = 1 - Math.pow(sinA0,2) ;
    e2 = Math.sqrt( Math.pow(a,2) - Math.pow(b,2) ) / b ;
    var k2 = e2 * e2 * cos2A0 ;
    
    var aa = b * (1 + k2 / 4 - 3 * k2 * k2 / 64 + 5 * k2 * k2 * k2 / 256) ;
    var BB = b * (k2 / 8 - k2 * k2 / 32 + 15 * k2 * k2 * k2 / 1024) ;
    var CC = b * (k2 * k2 / 128 - 3 * k2 * k2 * k2 / 512) ;
    e2 = E1 * E1 ;
    var AAlpha = (e2 / 2 + e2 * e2 / 8 + e2 * e2 * e2 / 16) - (e2 * e2 / 16 + e2 * e2 * e2 / 16) * cos2A0 + (3 * e2 * e2 * e2 / 128) * cos2A0 * cos2A0 ;
    var BBeta = (e2 * e2 / 32 + e2 * e2 * e2 / 32) * cos2A0 - (e2 * e2 * e2 / 64) * cos2A0 * cos2A0 ;
    
    // 计算球面长度
    var q0 = (S - (BB + CC * cos2q1) * sin2q1) / aa ;
    var sin2q1q0 = sin2q1 * Math.cos(2 * q0) + cos2q1 * Math.sin(2 * q0) ;
    var cos2q1q0 = cos2q1 * Math.cos(2 * q0) - sin2q1 * Math.sin(2 * q0) ;
    var q = q0 + (BB + 5 * CC * cos2q1q0) * sin2q1q0 / aa ;
    // 计算经度差改正数
    var theta = (AAlpha * q + BBeta * (sin2q1q0 - sin2q1)) * sinA0 ;
    // 计算终点大地坐标及大地方位角
    var sinu2 = sinu1 * Math.cos(q) + cosu1 * Math.cos(A1) * Math.sin(q) ;
    var B2 = Math.atan( sinu2 / ( Math.sqrt(1 - E1 * E1) * Math.sqrt(1 - sinu2 * sinu2)) ) * 180 / Math.PI ;
    var lamuda = Math.atan( Math.sin(A1) * Math.sin(q) / (cosu1 * Math.cos(q) - sinu1 * Math.sin(q) * Math.cos(A1))) * 180 / Math.PI ;
                 
    if ( Math.sin(A1) > 0 ) {
        if ( Math.sin(A1) * Math.sin(q) / (cosu1 * Math.cos(q) - sinu1 * Math.sin(q) * Math.cos(A1)) > 0) 
        	lamuda = Math.abs(lamuda) ;
        else
        	lamuda = 180 - Math.abs(lamuda) ;
        }
    else{
    	if ( Math.sin(A1) * Math.sin(q) / (cosu1 * Math.cos(q) - sinu1 * Math.sin(q) * Math.cos(A1)) > 0) 
        	lamuda = Math.abs(lamuda) - 180 ;
        else
        	lamuda = -Math.abs(lamuda) ;
    }
            
    var L2 = L1 * 180 / Math.PI + lamuda - theta * 180 / Math.PI ;
 
	var A2 = Math.atan(cosu1 * Math.sin(A1) / (cosu1 * Math.cos(q) * Math.cos(A1) - sinu1 * Math.sin(q))) * 180 / Math.PI ;
    if ( Math.sin(A1) > 0) {
    	if (cosu1 * Math.sin(A1) / (cosu1 * Math.cos(q) * Math.cos(A1) - sinu1 * Math.sin(q)) > 0) 
        	A2 = 180 + Math.abs(A2) ;
        else
        	A2 = 360 - Math.abs(A2) ;
                
	}
    else{
    	if (cosu1 * Math.sin(A1) / (cosu1 * Math.cos(q) * Math.cos(A1) - sinu1 * Math.sin(q)) > 0) 
        	A2 = Math.abs(A2) ;
    	else
        	A2 = 180 - Math.abs(A2) ;
	}
                
    var result  = {x: L2,y:B2 } ;  
	return result ;
}
/**
 * 根据一组点求外接矩形坐标
 * @param {Object} points
 * @return {TypeName} 
 */
function getRectByPointsStr(pointsStr){
	var list=pointsStr.split(",");
	var points=new Array();
	for(i=0;i+1<list.length;i+=2){
		var point=new Object();
		point.x=parseFloat(list[i]);
		point.y=parseFloat(list[i+1]);
		points.push(point);
	}
	if(points!=null){
		if(points.length==1){
			return {"minx": points[0].x,"miny": points[0].y, "maxx" :points[0].x ,"maxy" :points[0].y};
		}else{
			var xmin=1000,ymin=1000,xmax=0,ymax=0;
			for(i=0;i<points.length;i++){
				if(points[i]!=null && points[i].x !=null && points[i].y!=null ){
					var x=points[i].x;
					var y=points[i].y;
					if(x<xmin){
						xmin=x;
					}
					if(x>xmax){
						xmax=x;
					}
					if(y<ymin){
						ymin=y;
					} 
					if(y>ymax){
						ymax=y;
					}
				}
			}
			return {"minx": xmin,"miny": ymin, "maxx" :xmax ,"maxy" :ymax};
		}
	}else {
		return null;
	}
}

/**
 * JS对象克隆
 * @param {Object} myObj
 * @return {TypeName} 
 */
function clone(myObj){   
	if(typeof(myObj) != 'object') return myObj;   
	if(myObj == null) return myObj;
	var myNewObj = new Object();   
	for(var i in myObj)   
	    myNewObj[i] = clone(myObj[i]);  
	return myNewObj;   
} 

/**
 * 简单JS数组拷贝
 * @param {Object} myArr
 * @return {TypeName} 
 */
function copyArray(myArr){  
	var newArr=new Array();
	if(Object.prototype.toString.call(myArr) === '[object Array]') {
		for(var i=0 ;i<myArr.length; i++){
			if(typeof(myArr[i]) == 'object'){
				newArr.push(clone(myArr[i]));
			}else{
				newArr.push(myArr[i]);
			}
		}
	}
	return newArr;
} 

/**
 * 地图叠加元素旋转
 * @param {Object} degree
 * @param {Object} iOverLay
 */
function rotateIOverLay(degree,iOverLay) {  
   if(window.navigator.userAgent.indexOf('MSIE') > -1){    
		//处理IE浏览器
	   var imageToRotate = iOverLay.div;
	   imageToRotate.style.filter= "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand')";  
	   var deg2radians = Math.PI * 2 / 360; 
	   var degreeToRotate =degree; // 旋转度数;  
	   var rad = degreeToRotate * deg2radians ;         
	   costheta = Math.cos(rad);          
	   sintheta = Math.sin(rad);  
	   imageToRotate.filters.item(0).M11 = costheta;          
	   imageToRotate.filters.item(0).M12 = -sintheta;         
	   imageToRotate.filters.item(0).M21 = sintheta;          
	   imageToRotate.filters.item(0).M22 = costheta;  
  }  
}


/**
 * 根据圆心和半径获取圆的边界点
 * @param {Object} point
 * @param {Object} radius
 * @return {TypeName} 
 */
function createCircleBorder(point,radius){
	var points=new Array();
	for(i=0;i<360;i+=5){
		var temp=computation(point.x,point.y,i,radius);
		var tempPoint=new  OpenLayers.Geometry.Point(temp.x,temp.y);
		points.push(tempPoint);
	}
	return points;
}

/**
 * 字符串数组转换成一个字符串，默认逗号
 * @param {Array} list 字符串数组
 * @return {String}
 */
function arrayToString(list,separator){
	if(list && list.length>0){
		var str=list[0];
		separator=separator?separator:",";
		for(var i=1;i<list.length;i++){
			str+=separator+list[i];
		}
		return str;
	}else{
		return "";
	}	
}

/**
 * 检测数组中是否已含有某个元素
 * @param {Object} list
 * @param {Object} item
 * @return {TypeName} 
 */
function isContainItem(list,item){
	for(var i=0;i<list.length;i++){
		if(item === list[i]){
			return true;
		}
	}
	return false;
}



/**
 * 坐标点字符串转换为点数组
 * @param {Object} pointsStr
 * @return {TypeName} 
 */
function pointsStrToPointArray(pointsStr){
	if(pointsStr!=null && pointsStr!=""){
		var  list = pointsStr.split(",");
		var pointList =new Array();
		for(var i=0;i+1<list.length;i+=2){
			var point=new OpenLayers.Geometry.Point(list[i], list[i+1]);
			pointList.push(point);
		}
		return pointList;
	}	
}

/**
 * 点数组转换为坐标点字符串
 * @param {Object} pointList
 * @param {Object} isPolygon 是否为多变型，若为多边形需首位坐标要一致
 * @return {TypeName} 
 */
function pointArrayToPointsStr(pointList,isPolygon){
	if(pointList!=null && pointList.length>0){
		var str=pointList[0].x+","+pointList[0].y;
		for(var i=1;i<pointList.length;i++){
			str+=","+pointList[i].x+","+pointList[i].y;
		}
		//若为多变型，首位相连
		if(isPolygon){
			str+=","+pointList[0].x+","+pointList[0].y;
		}
		return str;
	}	
}

/**
 * 创建线段等分点
 * @param {OpenLayers.Geometry.Point} p1 线段起点
 * @param {OpenLayers.Geometry.Point} p2 线段终点
 * @param {Number} n 等分数量
 * @return {Array<OpenLayers.Geometry.Point>}  list 返回等分点数组
 */
function createEquants(p1,p2,n){
	var list=new Array();
	//if(p1.x != p2.x && p1.y != p2.y ){
	var point, r1, r2, x, y;
	for(var i=1;i<n;i++){
		r1=i;
		r2=n-i;
		x=(r2*p1.x+r1*p2.x)/n;
		y=(r2*p1.y+r1*p2.y)/n;
		point=new OpenLayers.Geometry.Point(x,y);
		list.push(point);
	}
	//}
	return list;
}



/****************************************
     * 根据三角型的顶点坐标求顶点B的余弦
     * @param 丁万里
     * @return
     *******************************************/
	
function  getCosB(a,b,c){
	var cosb=0;
	var ab=Math.sqrt(Math.pow(a.x-b.x, 2)+Math.pow(a.y-b.y, 2));
	var bc=Math.sqrt(Math.pow(b.x-c.x, 2)+Math.pow(b.y-c.y, 2));
	cosb=((a.x-b.x)*(c.x-b.x)+(a.y-b.y)*(c.y-b.y))/(ab*bc);		
	return cosb;
}


/**
 * 根据两点坐标计算与正北方向的偏移角度
 * @param {Object} p1
 * @param {Object} p2
 * @return {TypeName} 
 */
GisUtil.computeAngle= function(p1,p2){
	
	var yy = p2.y - p1.y;                         
	var xx = p2.x - p1.x;
	//过滤特殊数值
	if(xx == 0 && yy >=0 ){
		return 0;	
	}else if(xx == 0 && yy <0 ){
		return 180;	
	}if(yy == 0 && xx >0 ){
		return 90;	
	}else if(yy == 0 && xx <0 ){
		return 270;	
	}
	
	var aa = Math.atan(xx / yy) ;
	aa=deg(aa);
	//如是二三象限+180度
	if( yy < 0){
		aa = aa + 180;
	}
	//如是四象限+360度
	if( xx < 0 && yy > 0 ){
		aa = aa + 2 *180;
	} 
	return aa;
};


//var mapEpsg=4326;  //此为全局变量，需要在地图初始化时进行赋值
GisUtil.transform = function(source){
	//投影坐标转换成经纬度坐标
	if(source && mapEpsg !=4326 ){
		return source.transform(map.displayProjection, map.getProjectionObject());
	}
	return source;
};

GisUtil.atransform = function(source){
	//经纬度坐转换成标投影坐标
	if(mapEpsg !=4326){
		return source.transform(map.getProjectionObject(), map.displayProjection);
	}
	return source;
};

//经纬度转墨卡托
GisUtil.lonLat2Mercator =function(lonLat){
	var x = lonLat.x *20037508.34/180;
    var y = Math.log(Math.tan((90+lonLat.y)*Math.PI/360))/(Math.PI/180);
    y = y *20037508.34/180;
	return new OpenLayers.Geometry.Point(x,y);
};


//墨卡托转经纬度
GisUtil.mercator2LonLat= function (mercator){
    var x = mercator.x/20037508.34*180;
    var y = mercator.y/20037508.34*180;
    y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
    return new OpenLayers.Geometry.Point(x,y);
};

//墨卡托转经纬度
GisUtil.mercator2LonLat= function (mercator){
    var x = mercator.x/20037508.34*180;
    var y = mercator.y/20037508.34*180;
    y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
    return new OpenLayers.Geometry.Point(x,y);
};

/**
 * 得到两点距离
 * 
 * @param {}
 *            point1 点1
 * @param {}
 *            point2 点2
 */
GisUtil.getTwoPointDistance = function(point1, point2) {
	var x = point1[0] - point2[0];
	var y = point1[1] - point2[1];
	return Math.sqrt(x * x + y * y);
}

/**
 * 求点到一条线段的距离
 * @param {}
 *            point 点
 * @param {}
 *            linePoint1 线的坐标1
 * @param {}
 *            linePoint2 线的坐标2
 */
GisUtil.getPointToOneLineDistance = function(point, linePoint1, linePoint2) {
	var a = linePoint2[1] - linePoint1[1];
	var b = linePoint1[0] - linePoint2[0];
	var c = -(a * linePoint2[0] + b * linePoint2[1]);
	var distance = Math.abs(a * point[0] + b * point[1] + c) / Math.sqrt(a * a + b * b);
	distance = Math.min(distance, GisUtil.getTwoPointDistance(point, linePoint1));
	distance = Math.min(distance, GisUtil.getTwoPointDistance(point, linePoint2));
	return distance;
}

/**
 * 曲线抽稀坐标 第一点开始依次筛选，去除冗余点。即以第一点为起点，计算第二点至第一点和第三点连线的垂直距离，若此距离大于某阈值，则保留第二点，
 * 并将其作为新起点，计算第三点至第二点和第四点连线的距离；否则，去除第二点，计算第三点至第一点和第四点连线距离，依次类推，
 * 直至曲线上最后一点。其阈值一般取相应地物最大允许误差或更小。
 * 
 * @param paths
 *            点几何
 * @param distance
 *            抽稀因子 与当前视野有关 一般用屏幕的3到10个像素乘以地图当前分辨率得到
 * @return
 */
GisUtil.vacuate = function(paths, distance) {
	var _paths = [];
	var length = paths.length;
	for ( var i = 0; i < length; i++) {
		var path = paths[i];
		var _path = [];
		var size = path.length;
		var firstPointIndex = 0;// 第一个点索引
		var secondPointIndex = 1;// 第二个点索引
		var threePointIndex = 2; // 第三个点索引
		_path.push(path[firstPointIndex]);
		for (; threePointIndex < size; threePointIndex++) {
			var _distance = 0;
			secondPointIndex = threePointIndex - 1;
			var fpoint = path[firstPointIndex];// 第一个点
			var spoint = path[secondPointIndex];// 第二个点
			var tpoint = path[threePointIndex];// 第三那个点
			_distance = GisUtil.getTwoPointDistance(spoint, fpoint);
			if (_distance > distance) {
				firstPointIndex = secondPointIndex;
				_path.push(spoint);
			} else {
				// 第二个和第三个点相同直接跳过
				if (spoint[0] == tpoint[0] && spoint[1] == tpoint[1]) {
					continue;
					// 第一个点和第三个点相同时
				} else if (fpoint[0] != tpoint[0] || fpoint[1] != tpoint[1]) {
					_distance = GisUtil.getPointToOneLineDistance(spoint, fpoint, tpoint);
				}
				// 距离大于抽稀抽稀因子保留点，并把第一个点的索引设置为当前第二个点索引
				if (_distance > distance) {
					firstPointIndex = secondPointIndex;
					_path.push(spoint);
				}
			}

		}
		_path.push(path[size - 1]);
		_paths.push(_path);
	}
	return _paths;
};

/**
 * 得到直线方程地 相关参数 ax+by+c=0;
 * @param {}
 *            x1
 * @param {}
 *            y1
 * @param {}
 *            x2
 * @param {}
 *            y2
 * @return {}返回a\b\c值
 */
GisUtil.getLineParam = function(x1, y1, x2, y2) {
	// 垂直线
	if (x1 == x2) {
		return {a : 1,b : 0,	c : -x1}
		// 平行线
	} else if (y1 == y2) {
		return {a : 0,b : 1,c : -y2	}
		// 一般线
	} else {
		// 直线方程ax-y+c=0;
		var a = (y2 - y1) / (x2 - x1);
		var c = y1 - a * x1;
		return {a : a,b : -1,c : c
		}
	}
};

/**
 * 得到点与一条直线的位置关系。
 * @param {}
 *            abc
 * @param {}
 *            x
 * @param {}
 *            y
 * @return 点在右边返回true 点在坐标返回false;
 */
GisUtil.getPointPosition = function(abc, x, y) {
	return (abc.a * x + abc.b * y + abc.c) >= 0 ? true : false;
};

/**
 * 判断一个环是否是自相交的
 * @param {}
 *            ring [[1,2],[3,4],[5,6],[1,2]]
 * @return boolean 自相交返回true 否则返回false
 */
GisUtil.intersectPolygon = function(ring) {
	var size = ring.length;
	// 小于等四个点肯定不相交
	if (size < 4) {
		return false;
	}
	for ( var i = 0; i < size - 1; i++) {
		// 第一边
		var abc = GisUtil.getLineParam(ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
		var temp;
		for ( var n = i + 2; n < size; n++) {
			var _temp = GisUtil.getPointPosition(abc, ring[n][0], ring[n][1]);
			;
			if (n == i + 2) {
				temp = _temp;
			} else {
				// 位置关系发生改变时
				if (temp != _temp) {
					var _abc = GisUtil.getLineParam(ring[n - 1][0], ring[n - 1][1], ring[n][0], ring[n][1]);
					// 肯定相交
					if (GisUtil.getPointPosition(_abc, ring[i][0], ring[i][1]) != GisUtil.getPointPosition(_abc, ring[i + 1][0], ring[i + 1][1])) {
						return true;
					} else {
						temp = _temp;
					}
				}
			}
		}

	}
	return false;
};

/*******************************************************************************
 * return: 0： 没有相交点 1： 有一个相交点 >1: 有多个相交点，会形成自交
 * 
 */
GisUtil.intersectLine = function(path) {
	var size = path.length;
	var intersectnum = 0;
	// 小于等四个点肯定不相交
	if (size < 4) {
		return 0;
	}
	for ( var i = 0; i < size - 2; i++) {
		// 第一边
		var abc = GisUtil.getLineParam(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
		var temp;
		for ( var n = i + 2; n < size; n++) {
			var _temp = GisUtil.getPointPosition(abc, path[n][0], path[n][1]);
			;
			if (n == i + 2) {
				temp = _temp;
			} else {
				// 位置关系发生改变时
				if (temp != _temp) {
					var _abc = GisUtil.getLineParam(path[n - 1][0], path[n - 1][1], path[n][0], path[n][1]);
					// 肯定相交
					if (GisUtil.getPointPosition(_abc, path[i][0], path[i][1]) != GisUtil.getPointPosition(_abc, path[i + 1][0], path[i + 1][1])) {
						intersectnum++;
					} else {
						temp = _temp;
					}
				}
			}
		}
	}
	return intersectnum;
};
