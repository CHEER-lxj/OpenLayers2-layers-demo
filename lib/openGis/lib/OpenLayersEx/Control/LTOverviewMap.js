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
});