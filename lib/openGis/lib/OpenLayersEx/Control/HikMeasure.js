OpenLayers.Control.HikMeasure = OpenLayers.Class({
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
});