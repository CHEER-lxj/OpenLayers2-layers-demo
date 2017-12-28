/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
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
