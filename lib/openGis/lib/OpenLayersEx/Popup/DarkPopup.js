/**
 * Class: OpenLayers.Popup.DarkPopup
 *
 * Inherits from:
 *  - <OpenLayers.Popup>
 */
OpenLayers.Popup.DarkPopup =
    OpenLayers.Class(OpenLayers.Popup, {
        //内容样式
        contentDisplayClass: "darkPopupContent",
        //保持地图可视范围内
        panMapIfOutOfView: true,
        //自适应大小
        autoSize: true,
        /**
         * Parameter: anchor
         * {Object} Object to which we'll anchor the popup. Must expose a
         *     'size' (<OpenLayers.Size>) and 'offset' (<OpenLayers.Pixel>).
         */
        anchor: null,

        /**
         * Constructor: OpenLayers.Popup.DarkPopup
         *
         * Parameters:
         * id - {String}
         * lonlat - {<OpenLayers.LonLat>}
         * contentSize - {<OpenLayers.Size>}
         * contentHTML - {String}
         * anchor - {Object} Object which must expose a 'size' <OpenLayers.Size>
         *     and 'offset' <OpenLayers.Pixel> (generally an <OpenLayers.Icon>).
         * closeBox - {Boolean}
         * closeBoxCallback - {Function} Function to be called on closeBox click.
         */
        initialize:function(id, lonlat, contentSize, contentHTML, anchor, closeBox,
                            closeBoxCallback) {
            var newArguments = [
                id, lonlat, contentSize, contentHTML, closeBox, closeBoxCallback
            ];
            OpenLayers.Popup.prototype.initialize.apply(this, newArguments);
            this.anchor = (anchor != null) ? anchor : { size: new OpenLayers.Size(0,0), offset: new OpenLayers.Pixel(60,-150)};
            this.setBackgroundColor("transparent");
        },

        setSize:function(contentSize) {
            this.size = contentSize.clone();
            // if our contentDiv has a css 'padding' set on it by a stylesheet, we
            //  must add that to the desired "size".
            var contentDivPadding = this.getContentDivPadding();
            var wPadding = contentDivPadding.left + contentDivPadding.right;
            var hPadding = contentDivPadding.top + contentDivPadding.bottom;

            // take into account the popup's 'padding' property
            this.fixPadding();
            wPadding += this.padding.left + this.padding.right;
            hPadding += this.padding.top + this.padding.bottom;

            // make extra space for the close div
            if (this.closeDiv) {
                var closeDivHeight = parseInt(this.closeDiv.style.height);
                hPadding += closeDivHeight + contentDivPadding.top;
                this.groupDiv.style.paddingTop=closeDivHeight+"px";
            }

            //increase size of the main popup div to take into account the
            // users's desired padding and close div.
            this.size.w += wPadding;
            this.size.h += hPadding;

            //now if our browser is IE, we need to actually make the contents
            // div itself bigger to take its own padding into effect. this makes
            // me want to shoot someone, but so it goes.
            if (OpenLayers.BROWSER_NAME == "msie") {
                this.contentSize.w +=
                    contentDivPadding.left + contentDivPadding.right;
                this.contentSize.h +=
                    contentDivPadding.bottom + contentDivPadding.top;
            }

            if (this.div != null) {
                this.div.style.width = this.size.w + "px";
                this.div.style.height = this.size.h + "px";
            }
            if (this.contentDiv != null){
                this.contentDiv.style.width = contentSize.w + "px";
                this.contentDiv.style.height = contentSize.h + "px";
            }
        },


        /**
         * Method: addCloseBox
         *
         * Parameters:
         * callback - {Function} The callback to be called when the close button
         *     is clicked.
         */
        addCloseBox: function(callback) {
            this.closeDiv = OpenLayers.Util.createDiv(
                this.id + "_close", null, {w: 50, h: 21}
            );
            this.closeDiv.className = "darkPopupCloseBox";

            // use the content div's css padding to determine if we should
            //  padd the close div
            var contentDivPadding = this.getContentDivPadding();

            this.closeDiv.style.right = contentDivPadding.right + "px";
            this.closeDiv.style.top = contentDivPadding.top + "px";
            this.groupDiv.insertBefore(this.closeDiv,this.contentDiv);
            var closePopup = callback || function(e) {
                this.hide();
                OpenLayers.Event.stop(e);
            };
            OpenLayers.Event.observe(this.closeDiv, "touchend",
                OpenLayers.Function.bindAsEventListener(closePopup, this));
            OpenLayers.Event.observe(this.closeDiv, "click",
                OpenLayers.Function.bindAsEventListener(closePopup, this));
        },

        /**
         * APIMethod: destroy
         */
        destroy: function() {
            this.anchor = null;
            OpenLayers.Popup.prototype.destroy.apply(this, arguments);
        },

        /**
         * Method: moveTo
         * Since the popup is moving to a new px, it might need also to be moved
         *     relative to where the marker is. We first calculate the new
         *     relativePosition, and then we calculate the new px where we will
         *     put the popup, based on the new relative position.
         *
         *     If the relativePosition has changed, we must also call
         *     updateRelativePosition() to make any visual changes to the popup
         *     which are associated with putting it in a new relativePosition.
         *
         * Parameters:
         * px - {<OpenLayers.Pixel>}
         */
        moveTo: function(px) {
            var newPx = this.calculateNewPx(px);
            var newArguments = new Array(newPx);
            OpenLayers.Popup.prototype.moveTo.apply(this, newArguments);
        },


        /**
         * Method: calculateNewPx
         *
         * Parameters:
         * px - {<OpenLayers.Pixel>}
         *
         * Returns:
         * {<OpenLayers.Pixel>} The the new px position of the popup on the screen
         *     relative to the passed-in px.
         */
        calculateNewPx:function(px) {
            var newPx = px.offset(this.anchor.offset);
            return newPx;
        },


        /**
         * Method: setZindex
         * Sets the zindex of the popup.
         *
         * Parameters:
         */
        setZIndex: function(zIndex) {
            if (this.div != null) {
                this.div.style.zIndex = zIndex;
            }
        },
        /**
         * Method: getZIndex
         * get the zindex of the popup.
         *
         * Parameters:
         */
        getZIndex: function() {
            if (this.div != null) {
                return  this.div.style.zIndex;
            }else{
                return 750;
            }
        },

        CLASS_NAME: "OpenLayers.Popup.DarkPopup"
    });