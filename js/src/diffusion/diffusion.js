/**
 * Created by Louis Zhang (github.com/zhang2333)
 */

'use strict';

var Diffusion;

(function () {
    // Class ShapesPainter
    function ShapesPainter (canvasId) {
        var canvas = document.getElementById(canvasId);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 5;

        var cxt = canvas.getContext('2d');

        var cw = 12, ch = 12;
        this.config = {
            shapeNum: 50,
            shapeConfig: {
                width: [10, 30],
                height: [6, 40],
                speed: [0.1, 0.125],
                alphaSpeed: 0.001,
                alphaMax: [0.4, 0.5],
                angle: [Math.PI, Math.PI * 2],
                color: '#5FC4F3'
            },
            // others
            interval: 500
        };

        this.firstTime = true;
        this.isPaused = false;
        this.lastGen = Date.now();

        this.canvas = canvas;
        this.cxt = cxt;
    }

    ShapesPainter.prototype.init = function () {
        this.shapes = [];
        for (var i = 0; i < this.config.shapeNum; i++) {
            this.shapes.push(new Shape(this.canvas.width, this.canvas.height, null, null, this.config.shapeConfig));
        }
    }

    ShapesPainter.prototype.draw = function () {
        for (var i = 0; i < this.shapes.length; i++) {
            this.shapes[i].draw(this.cxt);
        }
    }

    ShapesPainter.prototype.animate = function () {
        this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
        this.raf = requestAnimationFrame(this.animate.bind(this));
    }

    ShapesPainter.prototype.start = function () {
        this.init();
        this.animate();
        return this;
    }

    ShapesPainter.prototype.destroy = function () {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }

        return this;
    }

    // Class Shape
    function Shape (w, h, x, y, config) {
        this._config = config;
        this._config.canvasWidth = w;
        this._config.canvasHeight = h;
        this.init(x, y);
    }

    Shape.prototype.init = function (x, y) {
        var config = this._config;

        this.x = x || random(config.canvasWidth);
        this.y = y || random(config.canvasHeight);

        this.w = random(config.width[0], config.width[1]);
        this.v = random(config.speed[0], config.speed[1]);
        this.alpha = 0;
        this.alphaV = random(config.alphaSpeed);
        this.alphaMax = random(config.alphaMax[0], config.alphaMax[1]);
        this.angle = random(config.angle[0], config.angle[1]);
        this.color = hex2RGB(config.color);
    }

    Shape.prototype.update = function () {
        if (this.alpha <= 0.0005 || this.x < -this.w || this.y < -this.w
            || this.x > canvas.width + this.w || this.y > canvas.height + this.w) {
            this.init();
        }
        if (this.alpha >= this.alphaMax) {
            this.alphaV = -this.alphaV;
        }
        this.alpha += this.alphaV;
        this.x += this.v * Math.cos(this.angle);
        this.y += this.v * Math.sin(this.angle);
    }

    Shape.prototype.drawSelf = function (cxt) {
        cxt.fillStyle = getRGBA(this.color, this.alpha);
        cxt.beginPath();
        cxt.arc(this.x, this.y, this.w, 0, Math.PI * 2);
        cxt.fill();
    }

    Shape.prototype.draw = function (cxt) {
        this.update();
        this.drawSelf(cxt);
    }

    function random (a, b) {
        if (b) {
            return Math.random() * (b - a) + a;
        }

        return Math.random() * a;
    }

    function hex2RGB(hex){
        var sColor = hex.toLowerCase();
        var reg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        if(sColor && reg.test(sColor)){
            if(sColor.length === 4){
                var sColorNew = '#';
                for(var i=1; i<4; i+=1){
                    sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));	
                }
                sColor = sColorNew;
            }
            //处理六位的颜色值
            var sColorChange = [];
            for(var i=1; i<7; i+=2){
                sColorChange.push(parseInt('0x'+sColor.slice(i,i+2)));	
            }
            return sColorChange;
        }else{
            return sColor;	
        }
    }

    function getRGBA (color, alpha) {
        var arr = [].concat(color, [alpha]);
        return 'rgba('+ arr.join(', ') + ')';
    }

    Diffusion = ShapesPainter;
    Diffusion.Shape = Shape;
})();

try {
    module.exports = Diffusion;
} catch (e) {}
