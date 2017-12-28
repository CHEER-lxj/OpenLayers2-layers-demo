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
