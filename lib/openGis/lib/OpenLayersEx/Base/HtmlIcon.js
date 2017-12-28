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
});