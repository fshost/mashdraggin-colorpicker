Mashdraggin ColorPicker
=====

A color-picker widget for jQuery UI that includes the ability to work with gradients.


### example
assuming you have html with an empty div element with id of #someDiv and some javascript firing after page/dom load event, then your code would look like

```javascript
$('#someDiv').colorpicker({
    change: function(event, data) {
        console.log('color changed to: ' + data.colorpicker.hex());
    }
});
```
to work with color-stops (gradients)
```javascript
$('#someDiv').colorpicker({
    format: 'rgba',
    gradient: true
});
```
see demo / tests for more examples

### todo
add eye-dropper

### license
MIT
