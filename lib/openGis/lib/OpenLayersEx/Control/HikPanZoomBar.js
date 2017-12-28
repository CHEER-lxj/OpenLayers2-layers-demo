/**
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
});