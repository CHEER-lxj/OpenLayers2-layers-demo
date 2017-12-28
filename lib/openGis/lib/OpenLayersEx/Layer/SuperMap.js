OpenLayers.Layer.SuperMap = OpenLayers.Class(OpenLayers.Layer.XYZ, {

	initialize : function() {
		OpenLayers.DOTS_PER_INCH = 76.38105323828588;
		OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);
	},
	getURL : function(bounds) {
		var res = this.getResolution();
		var scale = parseInt(OpenLayers.Util.getScaleFromResolution(res));

		// tile center
		var originTileX = (this.tileOrigin.lon + (res * this.tileSize.w / 2));
		var originTileY = (this.tileOrigin.lat - (res * this.tileSize.h / 2));

		var center = bounds.getCenterLonLat();
		var point = {
			x : center.lon,
			y : center.lat
		};
		var x = (Math.round(Math.abs((center.lon - originTileX)
				/ (res * this.tileSize.w))));
		var y = (Math.round(Math.abs((originTileY - center.lat)
				/ (res * this.tileSize.h))));
		var z = this.map.getZoom() + this.zoomOffset;

		var url = this.url;
		var s = '' + x + y + z;

		if (OpenLayers.Util.isArray(url)) {
			url = this.selectUrl(s, url);
		}
		url = url + '/${z}/${y}/${x}.' + this.type;

		url = OpenLayers.String.format(url, {
			'x' : y,
			'y' : x,
			'z' : z
		});

		return url;
	},
	CLASS_NAME : 'OpenLayers.Layer.SuperMap'

});