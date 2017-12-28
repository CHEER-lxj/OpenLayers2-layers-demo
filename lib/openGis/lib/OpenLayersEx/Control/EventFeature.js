/**
 * @requires OpenLayers.Control.SelectFeature
 */

/**
 *OpenLayers.Control.EventFeature
 */
OpenLayers.Control.EventFeature = OpenLayers.Class(OpenLayers.Control, {
	initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Feature(
            this, layer, {
            	click: this.clickFeature,
            	clickout: this.clickoutFeature,
            	over: this.overFeature,
            	out: this.outFeature,
            	dblclick: this.dblclickFeature
            },{
            	stopDown: false
            }
        );
    },
    
    clickFeature: function(feature) {},
    clickoutFeature: function(feature) {},
    overFeature: function(feature) {},
    outFeature: function(feature) {},
    dblclickFeature: function(feature) {},
    
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
	
    CLASS_NAME: "OpenLayers.Control.EventFeature"
});
