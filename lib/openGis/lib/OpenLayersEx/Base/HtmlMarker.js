OpenLayers.HtmlMarker = OpenLayers.Class(OpenLayers.Marker,{

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
});