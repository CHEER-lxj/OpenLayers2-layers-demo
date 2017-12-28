
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
});