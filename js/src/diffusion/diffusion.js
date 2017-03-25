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
            color: '#5FC4F3',
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
            this.shapes.push(new Shape(this.canvas.width, this.canvas.height, null, null, this.config.color));
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
    function Shape (w, h, x, y, color) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.color = hex2RGB(color || '#aaa');
        this.init(x, y, color);
    }

    Shape.prototype.init = function (x, y, color) {
        this.x = x || random(this.canvasWidth);
        this.y = y || random(this.canvasHeight);
        this.w = random(6, 40);
        this.v = random(0.1, 0.125);
        this.alpha = 0;
        this.alphaV = random(0.001);
        this.alphaMax = random(0.4, 0.5);
        this.angle = random(Math.PI, Math.PI * 2);
    }

    Shape.prototype.draw = function (cxt) {
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
        cxt.beginPath();
        // cxt.rect(this.x, this.y, this.w, this.w);
        cxt.arc(this.x, this.y, this.w, 0, Math.PI * 2);
        cxt.fillStyle = getRGBA(this.color, this.alpha);
        cxt.fill();
    }

    function random (a, b) {
        b = b ? b - a : 0;
        return Math.random() * a + b;
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

    function getRGBA (c, a) {
        return 'rgba(' + c[0] + ', '+ c[1] +', ' + c[2] + ', ' + a + ')';
    }

    Diffusion = ShapesPainter;
    Diffusion.Shape = Shape;
})();

try {
    module.exports = Diffusion;
} catch (e) {}
