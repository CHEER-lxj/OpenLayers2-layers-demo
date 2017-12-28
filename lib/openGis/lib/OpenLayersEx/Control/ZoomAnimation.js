OpenLayers.Control.ZoomAnimation = OpenLayers.Class(OpenLayers.Control.Navigation,{
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
