/*
 * Mashdraggin Colorpicker Widget for jQuery UI
 * Copyright 2013 by Mashdraggin
 * MIT License
 *
 *   options:
 *          color: starting color
 *          format: color format to use ('hex', 'rgb', 'rgba', 'hsl', default is hex)
 *                  note that alpha slider will only display in rgba mode
 *          change: event callback that is fired when color changes
 *
 * credits:
 * - originally adapted from bootstrap-colorpicker by Stefan Petre
 * - HSBtoRGB from RaphaelJS
 * - stringParsers from John Resig's color plugin
 */ (function($, undefined) {
    /* colorpicker widget
     
     */
    $.widget('mash.colorpicker', $.ui.mouse, {
        widgetEventPrefix: 'colorpicker',
        options: {
            value: '#fff', // aliased to 'value'
            format: 'hex',
            classes: {
                container: 'colorpicker-container',
                colorpicker: 'colorpicker',
                preview: 'colorpicker-preview',
                saturation: 'colorpicker-saturation',
                hue: 'colorpicker-hue',
                alpha: 'colorpicker-alpha'
            }
        },
        _setOption: function(key, value) {
            if (key === 'value') key = 'color';
            if (key === 'color')
                this.setColor(value);
        },
        _create: function() {
            this._mouseInit();
            var o = this.options,
                color = this.color = o.value || o.color,
                element = this.element.addClass(o.classes.container).addClass('ui-widget'),
                format = o.format;
            this.picker = $(this.template).prependTo(element);
            this.preview = o.preview || element.find('.' + o.classes.preview);
            this.base = this.picker.find('div:first')[0].style;
        },
        _init: function() {
            var o = this.options,
                format = o.format || 'hex',
                color = this.element.data('value') || o.value || '#ffffff';
            if (format === 'rgba' || format === 'hsla') {
                this.picker.addClass('alpha');
                this.alphaSlider = this.picker.find('.' + o.classes.alpha).show();
                this.alpha = this.alphaSlider[0].style;
            }
            this.setColor(color);
        },
        _destroy: function() {
            this._mouseDestroy();
            return this;
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
            if (!zone.is('.colorpicker')) {
                if (zone.is('.colorpicker-saturation')) {
                    this.slider = $.extend({}, this.sliders.saturation);
                } else if (zone.is('.colorpicker-hue')) {
                    this.slider = $.extend({}, this.sliders.hue);
                } else if (zone.is('.colorpicker-alpha')) {
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
        _mouseMove: function(e) {
            var left = Math.max(
                0,
                Math.min(
                this.slider.maxLeft,
                this.slider.left + ((e.pageX || this.pointer.left) - this.pointer.left)));
            var top = Math.max(
                0,
                Math.min(
                this.slider.maxTop,
                this.slider.top + ((e.pageY || this.pointer.top) - this.pointer.top)));
            this.slider.knob.left = left + 'px';
            this.slider.knob.top = top + 'px';
            if (this.slider.callLeft) {
                this.color[this.slider.callLeft].call(this.color, left / 100);
            }
            if (this.slider.callTop) {
                this.color[this.slider.callTop].call(this.color, top / 100);
            }
            var data = this.getData();
            e = e || {};
            e.data = $.extend(e.data || {}, data);
            this._trigger('change', e, data);
            this.previewColor();
        },
        getData: function() {
            var o = this.options,
                data = {
                    colorpicker: this,
                    color: this.color,
                    format: typeof o.format === 'string' ? o.format : 'hex'
                };
            data.value = typeof this[data.format] === 'function' ? this[data.format]() : this.hex();
            return data;
        },

        setColor: function(newColor) {
            var color = new Color(newColor);
            // in case color is passed as word like 'blue', we get computed value
            if (color._initValueInvalid) {
                delete color._initValueInvalid;
                this.preview.css('backgroundColor', newColor);
                color = new Color(this.preview.getStyle('backgroundColor'));
            }
            this.color = color;
            var o = this.options,
                data = this.getData();

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
        previewColor: function() {
            this.preview.css('backgroundColor', this.color.toHex());
            var rgb = this.color.toRGB();
            if (rgb.a < 1) {
                try {
                    this.preview.css('backgroundColor', this.rgba(rgb));
                } catch (ex) {}
            }
            //set the color for brightness/saturation slider
            this.base.backgroundColor = this.color.toHex(this.color.value.h, 1, 1, 1);
            //set te color for alpha slider
            if (this.alpha) {
                this.alpha.backgroundColor = this.color.toHex();
            }
        },

        // translate a format from Color object to a css string
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

        hex: function() {
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
        },
        template: [
                '<div class="colorpicker">',
                '<div class="colorpicker-inner">',
                '<div class="colorpicker-saturation">',
                '<i><b></b></i>',
                '</div>',
                '<div class="colorpicker-hue">',
                '<i>',
                '<span class="slider-indicator">',
                '<span class="slider-indicator-inset"></span>',
                '</span>',
                '</i>',
                '</div>',
                '<div class="colorpicker-alpha">',
                '<i>',
                '<span class="slider-indicator">',
                '<span class="slider-indicator-inset"></span>',
                '</span>',
                '</i>',
                '</div>',
                '</div>',
                '<div class="colorpicker-preview-bg">',
                '<div class="colorpicker-preview"></div>',
                '</div>',
                '</div>'

        ].join('')
    });

    // get computed style plugin
    $.fn.getStyle = function (cssprop) {
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