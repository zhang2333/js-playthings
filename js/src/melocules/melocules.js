/**
 * Created by Louis Zhang (github.com/zhang2333)
 */

'use strict';

var Melocules;

(function () {
    var visible = 0.07;

    // Class Melocules
    Melocules = function Melocules (canvasId) {
        var melo = this;

        Diffusion.prototype.draw = function () {
            var shapes = this.shapes;
            var cxt = this.cxt;

            for (var i = 0; i < shapes.length; i++) {
                var s1 = shapes[i];
                cxt.moveTo(s1.x, s1.y);
                for (var j = i + 1; j < shapes.length; j++) {
                    var s2 = shapes[j];

                    if (s1.alpha < visible || s2.alpha < visible) continue;

                    var linkDistance = melo.config.distance * Math.max(s1.w, s2.w) * 0.1;
                    if (calDistance(s1.x, s2.x, s1.y, s2.y) <= linkDistance) {
                        cxt.lineTo(s2.x, s2.y);
                        cxt.strokeStyle = getRGBA(melo.config.lineColor, Math.min(s1.alpha, s2.alpha));
                        cxt.stroke();
                    }
                }
            }

            for (var i = 0; i < shapes.length; i++) {
                var s = shapes[i];
                if (s.alpha > visible) {
                    cxt.fillStyle = '#fff';
                    cxt.beginPath();
                    cxt.arc(s.x, s.y, s.w, 0, Math.PI * 2);
                    cxt.fill();
                }
                s.draw(cxt);
            }
        }

        var dif = new Diffusion(canvasId);
        dif.cxt.lineWidth = 1;

        var config = {
            width: [5, 8],
            distance: 233,
            color: '#2a6aa0',
            lineColor: [233, 233, 233]
        };

        var _config = dif.config;
        _config.shapeNum = 70;

        var _sconfig  = _config.shapeConfig;
        _sconfig.width = config.width;
        _sconfig.color = config.color;

        this.dif = dif;
        this.config = config;
    }

    Melocules.prototype.start = function () {
        this.dif.start();
    }

    function calDistance (x1, x2, y1, y2) {
        return Math.abs(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
    }

    function getRGBA (color, alpha) {
        var arr = [].concat(color, [alpha * 0.5]);
        return 'rgba('+ arr.join(', ') + ')';
    }
})();

try {
    module.exports = Melocules;
} catch (e) {}
