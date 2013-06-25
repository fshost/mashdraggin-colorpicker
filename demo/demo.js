$(function() {


    var colorpicker = $('.colorpicker').colorpicker({
        // specify a starting color (default is #fff)
        color: '#4fd6ce',
        // specify a format type (hex, rgb, rgba, or hsl, hex is default)
        // note that if rgba is specified, an alpha channel slider will be displayed
        format: 'hex',
        // specify a change event callback
        change: function(event, data) {
            $('#hex').val(data.colorpicker.hex());
            $('#rgb').val(data.colorpicker.rgb());
            $('#rgba').val(data.colorpicker.rgba());
            $('#hsl').val(data.colorpicker.hsl());
            console.log('event.target.id:', event.target.id);
            console.log('preview bg color:', $(event.target).find('.mashdraggin-colorpicker-preview').css('backgroundColor'));
        }
    });

    $('input').change(function (event, data) {
        colorpicker.colorpicker('option', 'color', $(event.target).val());
    });

});