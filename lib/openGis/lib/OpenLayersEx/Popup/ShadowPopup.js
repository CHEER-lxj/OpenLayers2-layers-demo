/**
 * Class: OpenLayers.Popup.ShadowPopup
 * 
 * Inherits from:
 *  - <OpenLayers.Popup>
 */
OpenLayers.Popup.ShadowPopup = 
  OpenLayers.Class(OpenLayers.Popup,OpenLayers.Popup.HikPopup, {

    positionBlocks: {
    	"tr": {
    		'offset': new OpenLayers.Pixel(-80, 0),
    		'padding': new OpenLayers.Bounds(25, 23, 25, 3),
    		'closeBox': {
    			position: new OpenLayers.Pixel(30, 8)
    		},
	        'blocks': [
	            { // top-left
	                size: new OpenLayers.Size('auto', 'auto'),
	                anchor: new OpenLayers.Bounds(0, 33, 32, 0),
	                position: new OpenLayers.Pixel(0, 0)
	            },
	            { //top-right
	                size: new OpenLayers.Size(32, 'auto'),
	                anchor: new OpenLayers.Bounds(null, 33, 0, 0),
	                position: new OpenLayers.Pixel(-1128, 0)
	            },
	            { //bottom-left
	                size: new OpenLayers.Size('auto',33),
	                anchor: new OpenLayers.Bounds(0, 0, 32, null),
	                position: new OpenLayers.Pixel(0, -710)
	            },
	            { //bottom-right
	                size: new OpenLayers.Size(32, 33),
	                anchor: new OpenLayers.Bounds(null, 0, 0, null),
	                position: new OpenLayers.Pixel(-1128, -710)
	            },
	            { // left-shadow
	                size: new OpenLayers.Size(23, 135),
	                anchor: new OpenLayers.Bounds(0, 23, null, null),
	                position: new OpenLayers.Pixel(-1160, 0)
	            },
	            { //right-shadow
	                size: new OpenLayers.Size(23, 135),
	                anchor: new OpenLayers.Bounds(null, 23, 0, null),
	                position: new OpenLayers.Pixel(-1160, -200)
	            }
	        ]
	   	}
    },
    
    CLASS_NAME: "OpenLayers.Popup.ShadowPopup"
});
