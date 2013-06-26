/*
 * Mashdraggin Colorpicker Widget for jQuery UI
 * Copyright 2013 by Nathan Cartwright
 * MIT License
 *
 *   options:
 *          color: starting color
 *          format: color format to use ('hex', 'rgb', 'rgba', 'hsl', default is hex)
 *                  note that alpha slider will only display in rgba mode
 *          change: event callback that is fired when color changes
 *
 * credits:
 * - base colorpicker originally adapted from bootstrap-colorpicker by Stefan Petre
 * - HSBtoRGB from RaphaelJS
 * - stringParsers from John Resig's color plugin
 * - bits and pieces of code for gradient stops based on https://github.com/greggman.gradient-editor
 */
 (function($, undefined) {
    /* colorpicker widget
     
     */
    $.widget('dragn.colorpicker', $.ui.mouse, {
        widgetEventPrefix: 'colorpicker',
        options: {
            value: '#fff', // aliased to 'value'
            format: 'hex',
            alpha: false,
            gradient: false,
            gradientStart: 'left',
            colorStops: [],
            defaultColorStops: [{
                    position: 0.0,
                    color: '#fff'
                }, {
                    position: 1.0,
                    color: '#000'
                }
            ],
            // caution: the options below can break the widget if set in-
            // correctly, and if changed, require coordinated changes within
            // the stylesheet for this widget.
            colorStopOuterWidth: 8,
            colorStopInnerWidth: 6,
            classes: {
                container: 'md-cp-container',
                colorpicker: 'md-cp',
                preview: 'md-cp-preview',
                saturation: 'md-cp-saturation',
                hue: 'md-cp-hue',
                alpha: 'md-cp-alpha',
                stopsContainer: 'md-cp-gradient-stops-container',
                stopConstraint: 'md-cp-stops-constraint',
                stopContainer: 'md-cp-gradient-stop-container',
                colorStop: 'md-cp-gradient-stop'
            },
            template: [
                    '<div class="ui-helper-reset md-cp">',
                    '<div class="ui-helper-reset md-cp-inner">',
                    '<div class="ui-helper-reset md-cp-saturation">',
                    '<i class="ui-helper-reset"><b class="ui-helper-reset"></b></i>',
                    '</div>',
                    '<div class="ui-helper-reset md-cp-hue">',
                    '<i class="ui-helper-reset">',
                    '<span class="ui-helper-reset slider-indicator">',
                    '<span class="ui-helper-reset slider-indicator-inset"></span>',
                    '</span>',
                    '</i>',
                    '</div>',
                    '<div class="ui-helper-reset md-cp-alpha">',
                    '<i class="ui-helper-reset">',
                    '<span class="ui-helper-reset slider-indicator">',
                    '<span class="ui-helper-reset slider-indicator-inset"></span>',
                    '</span>',
                    '</i>',
                    '</div>',
                    '</div>',
                    '<div class="ui-helper-reset md-cp-preview-bg">',
                    '<div class="ui-helper-reset md-cp-preview"></div>',
                    '</div>',
                    '</div>'
            ].join('')
        },
        _setOptions: function() {
            this._superApply(arguments);
                        this._refresh();
        },
        _setOption: function(key, value) {
            if (key === 'value') key = 'color';
            if (key === 'color')
                this.setColor(value);
            this._super(key, value);
        },
        _create: function() {
            this.defaultFormat = 'hex';
            this._mouseInit();
            var o = this.options,
                color = this.color = o.value || o.color,
                element = this.element.addClass(o.classes.container).addClass('ui-widget'),
                format = o.format;
            this.picker = $(o.template).prependTo(element);
            this.preview = o.preview || element.find('.' + o.classes.preview);
            this.inner = element.find('.md-cp-inner');
            this.base = this.picker.find('div:first')[0].style;
            if (!$.isArray(o.colorStops)) o.colorStops = [];
        },
        _refresh: function () {
            var o = this.options,
                format = o.format || 'hex';
            o.color = this.element.data('value') || o.value || '#ffffff';
            if ((!o.alpha && format === 'rgba' || format === 'hsla') || o.alpha) {
                this.picker.addClass('alpha');
                this.alphaSlider = this.picker.find('.' + o.classes.alpha).show();
                this.alpha = this.alphaSlider[0].style;
            }
            else {
                this.picker.removeClass('alpha');
                this.picker.find('.' + o.classes.alpha).hide();
                delete this.alpha;
            }
            this.element.width(this.picker.width() + 10);
            this.setColor();
            if (o.gradient) this._initGradient();
            else this.element.find('.' + o.classes.stopsContainer).remove();
        },
        _init: function() {
            this._refresh();
        },
        _initGradient: function() {
            var o = this.options;
            if (o.colorStops.length < 2) o.colorStops = [].concat(o.defaultColorStops);
            this.lastColor = o.value;
            this.copyable = false;
            this.stopSlider = this.element.find('.' + o.classes.stopsContainer);
            if (!this.stopSlider || this.stopSlider.length < 1) {
                this.stopSlider = $('<div class="ui-helper-reset ' + o.classes.stopsContainer + '"></div>').insertAfter(this.picker);
            } else {
                this.stopSlider.find('.' + o.classes.stopContainer).draggable('destroy').remove();
            }
            this.stopSlider.width(this.preview.width() + o.colorStopInnerWidth);
            this.stopConstraint = $('<div class="ui-helper-reset ' + o.classes.stopConstraint + '"></div>')
                .css({
                    width: this.preview.width() + o.colorStopInnerWidth + 'px',
                    // marginLeft: o.colorStopInnerWidth / 2 + 'px',
                    height: '12px'
                })
                .appendTo(this.stopSlider);
            var that = this;
            this.stopSlider.dblclick(function(event) {
                var stopContainer = $(this).find('.' + o.classes.stopContainer),
                    stopWidth = stopContainer.width(),
                    halfWidth = stopWidth / 2,
                    parentOffset = $(event.target).parent().offset(),
                    x = event.pageX - parentOffset.left - halfWidth - 2,
                    position = Math.max(0, Math.min(1, x / that.preview.width()));
                that.addStop({
                    position: position,
                    color: that.toColorString()
                }, event);
            });
            this.purgeAddStops();
        },

        toColorString: function() {
            var o = this.options;
            return typeof this[o.format] === 'function' ? this[o.format]() : this[defaultFormat]();
        },
        setColor: function(newColor) {
            var o = this.options;
            newColor = newColor || o.color;
            var color = new Color(newColor);
            // in case color is passed as word like 'blue', we get computed value
            if (color._initValueInvalid) {
                delete color._initValueInvalid;
                this.preview.css('backgroundColor', newColor);
                color = new Color(this.preview.getStyle('backgroundColor'));
            }
            this.color = color;
            var data = this.getData();

            this.value = data.value;
            this._trigger('change', {
                data: data
            }, data);
            this.picker.find('i')
                .eq(0).css({
                left: this.color.value.s * 100,
                top: 100 - this.color.value.b * 100
            }).end()
                .eq(1).css('top', 100 * (1 - this.color.value.h)).end()
                .eq(2).css('top', 100 * (1 - this.color.value.a));
            this.previewColor();
        },
        previewColor: function(event, data) {
            var o = this.options;
            if (o.gradient) {
                this.preview.css('background', this.getGradientCss());
            } else {
                this.preview.css('background', this.color.toHex());
                var rgb = this.color.toRGB();
                if (rgb.a < 1) {
                    try {
                        this.preview.css('background', this.rgba(rgb));
                    } catch (ex) {}
                }
            }

            //set the color for brightness/saturation slider
            this.base.backgroundColor = this.color.toHex(this.color.value.h, 1, 1, 1);
            //set color for alpha slider
            if (this.alpha) {
                this.alpha.backgroundColor = this.color.toHex();
            }
            if (event && data) {
                if (this._boundStop) {
                    this._boundStop.setColor(this.toColorString());
                }
                this._trigger('change', event, data);

                this.lastColor = this.toColorString();
            }
        },
        purgeAddStops: function() {
            console.log('purgeAdd');
            var i, l, stop,
                o = this.options,
                stops = o.colorStops,
                posi = {},
                pstops = [];
            l = stops.length;
            for (i = 0; i < l; i++) {
                stop = stops[i];
                var pos = posi[stop.position];
                if (!pos || pos.color !== stop.color) {
                    pstops.push(stop);
                }
            }
            stops = this.options.colorStops = pstops;
            l = stops.length;
            for (i = 0; i < l; i++) {
                this.addStop(stops[i]);
            }
            posi = null;
            pstops = null;
        },
        // add gradient color-stop
        addStop: function(stop, event) {
            var o = this.options,
                body = $('body'),
                classes = o.classes,
                lastColor = this.lastColor,
                stops = o.colorStops,
                stopWidth = this.stopSlider.width(),
                stopIndex = stops.indexOf(stop);
            if (stop.inside === undefined) stop.inside = true;
            if (stopIndex === -1) {
                o.colorStops.push(stop);
                stopIndex = o.colorStops.length - 1;
            }
            var stopObj = $(
                '<div class="ui-helper-reset ' + classes.stopContainer + '">' +
                '<div class="ui-helper-reset ' + classes.colorStop + '"></div>' +
                '</div>');

            var colorObj = $('.' + classes.colorStop, stopObj);

            colorObj.css({
                backgroundColor: stop.color
            });

            stop.setColor = function(color) {
                stop.color = color;
                colorObj.css('backgroundColor', color);
            };

            var that = this;
            var previewWidth = this.preview.width();

            function setStopColorHandler(e) {
                that.setColor(stop.color);
                that._boundStop = stop;
                e.stopPropagation();
            }

            function unsetStopColorHandler() {
                that._boundStop = null;
                $(document).off('click', unsetStopColorHandler);
            }
            stopObj.on('click', setStopColorHandler);
            if (event) this._boundStop = stop;
            $(document).not(this.element).on('click', unsetStopColorHandler);
            var cx1 = o.colorStopOuterWidth;
            var cx2 = 150 + o.colorStopOuterWidth;
            var containment = [
            ];
            stopObj.draggable({
                axis: 'x',
                containment: this.stopConstraint,
                // containment: [o.colorStopOuterWidth, 0, 150 + o.colorStopOuterWidth, 0],
                cursor: 'pointer',
                drag: function(event, ui) {
                    var update = false;
                    var parentOffset = $(event.target).parent().offset();
                    var y = event.pageY - parentOffset.top;
                    var newPosition = Math.min(
                        1,
                        Math.max(0, ui.position.left / previewWidth));
                    if (!event.altKey) {
                        that.copyable = true;
                    }
                    if (y < 20) {
                        if (!stop.inside) {
                            stop.inside = true;
                            stops.push(stop);
                            colorObj.show();
                            update = true;
                        } else {
                            if (event.altKey && that.copyable) {
                                that.copyable = false;
                                addStop({
                                    position: newPosition,
                                    color: lastColor
                                });
                            }
                        }
                    } else if (y >= 20) {
                        if (stop.inside) {
                            stops.splice(stops.indexOf(stop), 1);
                            stop.inside = false;
                            colorObj.hide();
                            update = true;
                        }
                    }
                    if (newPosition != stop.position) {
                        stop.position = newPosition;
                        update = true;
                    }
                    if (update) {
                        that.previewColor(event);
                    }
                },
                start: function(event, ui) {
                    that.copyable = true;
                },
                stop: function(event, ui) {
                    if (!stop.inside) {

                        stopObj.draggable('destroy');
                        stopObj.remove();
                        stopObj = null;


                        if (o.colorStops.length < 2) {
                            that._setOption('gradient', false);
                        }

                        that._init();

                    }
                }
            });
            stopObj.mousedown(function(event) {
                this.lastColor = stop.color;
            });
            this.stopSlider.append(stopObj);
            var p = Math.floor(stop.position * (stopWidth - o.colorStopInnerWidth));
            stopObj.position({
                my: 'left',
                at: 'left+' + p,
                of: this.stopSlider
            });
            this.previewColor(event);
        },
        getGradientCss: function(preview) {
            var o = this.options;
            var stops = o.colorStops;
            var sorted = stops.sort(function(stop1, stop2) {
                return stop2.position < stop1.position ? 1 : -1;
            });
            var from = preview ? 'left' : o.gradientStart;
            var bgi = '-webkit-linear-gradient(' + from + ',';
            for (var stop, i = 0, l = sorted.length; i < l; i++) {
                stop = sorted[i];
                bgi += ' ' + stop.color + ' ' + stop.position * 100 + '%';
                if (i < l - 1) bgi += ', ';
            }
            bgi += ')';
            return bgi;
        },
        getData: function() {
            var o = this.options,
                data = {
                    colorpicker: this,
                    format: typeof o.format === 'string' ? o.format : 'hex'
                };
            if (o.gradient) {
                data.stops = this.stops;
                data.value = this.getGradientCss();
            } else {
                data.color = this.color;
                data.value = this.toColorString();
            }
            return data;
        },
        _mouseUp: function(e) {
            this._off($(document), 'mousemove mouseup');
        },
        _mouseDown: function(e) {
            //e.stopPropagation();
            //e.preventDefault();
            var target = $(e.target);
            //detect the slider and set the limits and callbacks
            var zone = target.closest('div');
            if (!zone.is('.md-cp')) {
                if (zone.is('.md-cp-saturation')) {
                    this.slider = $.extend({}, this.sliders.saturation);
                } else if (zone.is('.md-cp-hue')) {
                    this.slider = $.extend({}, this.sliders.hue);
                } else if (zone.is('.md-cp-alpha')) {
                    this.slider = $.extend({}, this.sliders.alpha);
                } else {
                    return false;
                }
                var offset = zone.offset();
                this.slider.knob = zone.find('i')[0].style;
                this.slider.left = e.pageX - offset.left;
                this.slider.top = e.pageY - offset.top;
                this.pointer = {
                    left: e.pageX,
                    top: e.pageY
                };
                var doc = $(this.document);
                this._on(doc, {
                    mousemove: $.proxy(this._mouseMove, this),
                    mouseup: $.proxy(this._mouseUp, this)
                });
                doc.trigger('mousemove');
            }
            return false;
        },
        _mouseMove: function(event) {
            var left = Math.max(
                0,
                Math.min(
                this.slider.maxLeft,
                this.slider.left + ((event.pageX || this.pointer.left) - this.pointer.left)));
            var top = Math.max(
                0,
                Math.min(
                this.slider.maxTop,
                this.slider.top + ((event.pageY || this.pointer.top) - this.pointer.top)));
            this.slider.knob.left = left + 'px';
            this.slider.knob.top = top + 'px';
            if (this.slider.callLeft) {
                this.color[this.slider.callLeft].call(this.color, left / 100);
            }
            if (this.slider.callTop) {
                this.color[this.slider.callTop].call(this.color, top / 100);
            }
            var data = this.getData();
            event = event || {};
            event.data = $.extend(event.data || {}, data);
            this._trigger('change', event, data);
            this.previewColor(event, data);
        },
        _destroy: function() {
            this._mouseDestroy();
            return this;
        },
        rgb: function(rgb) {
            rgb = rgb || this.color.toRGB();
            return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
        },
        rgba: function(rgb) {
            rgb = rgb || this.color.toRGB();
            return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + Math.round(rgb.a * 100) / 100 + ')';
        },
        hsl: function() {
            var hsl = this.color.toHSL();
            return 'hsl(' + Math.round(hsl.h * 360) + ',' + Math.round(hsl.s * 100) + '%,' + Math.round(hsl.l * 100) + '%)';
        },
        hsla: function() {
            var hsl = this.color.toHSL();
            return 'hsla(' + Math.round(hsl.h * 360) + ',' + Math.round(hsl.s * 100) + '%,' + Math.round(hsl.l * 100) + '%,' + hsl.a + ')';
        },
        hex: function(rgb) {
            if (rgb) return rgb.r.toString(16) + rgb.g.toString(16) + rgb.b.toString(16);
            return this.color.toHex();
        },
        sliders: {
            saturation: {
                maxLeft: 100,
                maxTop: 100,
                callLeft: 'setSaturation',
                callTop: 'setLightness'
            },
            hue: {
                maxLeft: 0,
                maxTop: 100,
                callLeft: false,
                callTop: 'setHue'
            },
            alpha: {
                maxLeft: 0,
                maxTop: 100,
                callLeft: false,
                callTop: 'setAlpha'
            }
        }
    });

    // get computed style plugin
    $.fn.getStyle = function(cssprop) {
        var el = this[0];
        if (el.currentStyle) //IE
            return el.currentStyle[cssprop];
        else if (document.defaultView && document.defaultView.getComputedStyle) //Firefox
            return document.defaultView.getComputedStyle(el, "")[cssprop];
        else return el.style[cssprop] || this.css(cssprop);
    };

    // Color object
    var Color = function(val) {
        this.value = {
            h: 1,
            s: 1,
            b: 1,
            a: 1
        };
        this.setColor(val);
    };

    Color.prototype = {
        constructor: Color,
        //parse a string to HSB
        setColor: function(val) {
            val = val.toLowerCase();
            var setValueFlag,
                that = this;
            $.each(that.stringParsers, function(i, parser) {
                var match = parser.re.exec(val),
                    values = match && parser.parse(match),
                    space = parser.space || 'rgba';
                if (values) {
                    if (space === 'hsla') {
                        that.value = that.apply(null, that.HSLtoRGB.apply(null, values));
                    } else {
                        that.value = that.RGBtoHSB.apply(null, values);
                    }
                    setValueFlag = true;
                    return false;
                }
            });
            if (!setValueFlag) {
                this._initValueInvalid = true;
            }
        },
        setHue: function(h) {
            this.value.h = 1 - h;
        },
        setSaturation: function(s) {
            this.value.s = s;
        },
        setLightness: function(b) {
            this.value.b = 1 - b;
        },
        setAlpha: function(a) {
            this.value.a = parseInt((1 - a) * 100, 10) / 100;
        },
        toRGB: function(h, s, b, a) {
            if (!h) {
                h = this.value.h;
                s = this.value.s;
                b = this.value.b;
            }
            h *= 360;
            var R, G, B, X, C;
            h = (h % 360) / 60;
            C = b * s;
            X = C * (1 - Math.abs(h % 2 - 1));
            R = G = B = b - C;

            h = ~~h;
            R += [C, X, 0, 0, X, C][h];
            G += [X, C, C, X, 0, 0][h];
            B += [0, 0, X, C, C, X][h];
            return {
                r: Math.round(R * 255),
                g: Math.round(G * 255),
                b: Math.round(B * 255),
                a: a || this.value.a
            };
        },

        toHex: function(h, s, b, a) {
            var rgb = this.toRGB(h, s, b, a);
            return '#' + ((1 << 24) |
                (parseInt(rgb.r, 10) << 16) |
                (parseInt(rgb.g, 10) << 8) |
                parseInt(rgb.b, 10)).toString(16).substr(1);
        },

        toHSL: function(h, s, b, a) {
            if (!h) {
                h = this.value.h;
                s = this.value.s;
                b = this.value.b;
            }
            var H = h,
                L = (2 - s) * b,
                S = s * b;
            if (L > 0 && L <= 1) {
                S /= L;
            } else {
                S /= 2 - L;
            }
            L /= 2;
            if (S > 1) {
                S = 1;
            }
            return {
                h: H,
                s: S,
                l: L,
                a: a || this.value.a
            };
        },
        stringParsers: [{
                re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                parse: function(execResult) {
                    return [
                        execResult[1],
                        execResult[2],
                        execResult[3],
                        execResult[4]];
                }
            }, {
                re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                parse: function(execResult) {
                    return [
                        2.55 * execResult[1],
                        2.55 * execResult[2],
                        2.55 * execResult[3],
                        execResult[4]];
                }
            }, {
                re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
                parse: function(execResult) {
                    return [
                        parseInt(execResult[1], 16),
                        parseInt(execResult[2], 16),
                        parseInt(execResult[3], 16)];
                }
            }, {
                re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
                parse: function(execResult) {
                    return [
                        parseInt(execResult[1] + execResult[1], 16),
                        parseInt(execResult[2] + execResult[2], 16),
                        parseInt(execResult[3] + execResult[3], 16)];
                }
            }, {
                re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
                space: 'hsla',
                parse: function(execResult) {
                    return [
                        execResult[1] / 360,
                        execResult[2] / 100,
                        execResult[3] / 100,
                        execResult[4]];
                }
            }
        ],
        RGBtoHSB: RGBtoHSB,
        HueToRGB: HueToRGB,
        HSLtoRGB: HSLtoRGB
    };


    function RGBtoHSB(r, g, b, a) {
        r /= 255;
        g /= 255;
        b /= 255;
        var H, S, V, C;
        V = Math.max(r, g, b);
        C = V - Math.min(r, g, b);
        H = (C === 0 ? null :
            V == r ? (g - b) / C :
            V == g ? (b - r) / C + 2 :
            (r - g) / C + 4);
        H = ((H + 360) % 6) * 60 / 360;
        S = C === 0 ? 0 : C / V;
        return {
            h: H || 1,
            s: S,
            b: V,
            a: a || 1
        };
    }

    function HSLtoRGB(h, s, l, a) {
        if (s < 0) {
            s = 0;
        }
        var q;
        if (l <= 0.5) {
            q = l * (1 + s);
        } else {
            q = l + s - (l * s);
        }

        var p = 2 * l - q;

        var tr = h + (1 / 3);
        var tg = h;
        var tb = h - (1 / 3);

        var r = Math.round(HueToRGB(p, q, tr) * 255);
        var g = Math.round(HueToRGB(p, q, tg) * 255);
        var b = Math.round(HueToRGB(p, q, tb) * 255);
        return [r, g, b, a || 1];
    }

    function HueToRGB(p, q, h) {
        if (h < 0)
            h += 1;
        else if (h > 1)
            h -= 1;

        if ((h * 6) < 1)
            return p + (q - p) * h * 6;
        else if ((h * 2) < 1)
            return q;
        else if ((h * 3) < 2)
            return p + (q - p) * ((2 / 3) - h) * 6;
        else
            return p;
    }


})(jQuery);