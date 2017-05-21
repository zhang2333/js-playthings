/**
 * Created by Louis Zhang (github.com/zhang2333)
 */

'use strict';

var ConwayLife = (function () {
    function ConwayLife (canvasId, config) {
        var canvas = document.getElementById(canvasId);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 5;
        var cw = 12, ch = 12;

        var _config = {
            color: '#fff',
            // offset
            ox: 0,
            oy: 0,
            // size of cell
            cw: cw,
            ch: ch,
            // size of the grid
            colSize: parseInt(canvas.width / (cw + 1)),
            rowSize: parseInt(canvas.height / (ch + 1)),
            // others
            interval: 500,
            initEntropy: 0.2
        };

        if (config) {
            this.config = Object.assign({}, _config, config);
        }

        var cxt = canvas.getContext('2d');
        cxt.fillStyle = this.config.color;

        this.firstTime = true;
        this.isPaused = false;
        this.lastGen = Date.now();

        this.canvas = canvas;
        this.cxt = cxt;
    }

    ConwayLife.prototype.setCell = function (board, x, y, state) {
        state = state > 0 ? 1 : 0;
        board[y * this.config.colSize + x] = 1;
    }

    ConwayLife.prototype.resetBoard = function () {
        var board = [];

        for(var i = 0; i < this.config.rowSize * this.config.colSize; i++) {
            board.push(0);
        }

        return board;
    }

    ConwayLife.prototype.init = function () {
        var config = this.config;
        this.board = this.resetBoard();
        for(var i = 0; i < parseInt(config.rowSize * config.colSize * config.initEntropy); i++) {
            this.setCell(this.board, random(config.colSize), random(config.rowSize), 1);
        }
    }

    ConwayLife.prototype.next = function (board) {
        var grid = [], liveArr = [], deadArr = [];
        var config = this.config;

        // transform board to 2d grid
        for (var i = 0; i < config.rowSize; i++) {
            grid.push(board.slice(i * config.colSize, (i + 1) * config.colSize));
        }

        // check status
        for (var i = 0; i < config.rowSize; i++) {
            for (var j = 0; j < config.colSize; j++) {
                // count the live
                var liveNum = 0;
                for (var y = i - 1; y <= i + 1; y++) {
                    for(var x = j - 1; x <= j + 1; x++) {
                        if (x < 0 || y < 0 || y >= config.rowSize || (x == j && y == i)) {
                            continue;
                        }
                        if (grid[y][x] > 0) {
                            liveNum++;
                        }
                    }
                }

                // live or die
                if (grid[i][j] === 0 && liveNum === 3) {
                    liveArr.push([j, i]);
                } else if (liveNum !== 2 && liveNum !== 3) {
                    deadArr.push([j, i]);
                }
            }
        }

        // live
        liveArr.forEach(function (a) {
            grid[a[1]][a[0]] = 1;
        });

        // dead
        deadArr.forEach(function (a) {
            grid[a[1]][a[0]] = 0;
        });

        board = [];
        for (var i = 0; i < grid.length; i++) {
            board = board.concat(grid[i]);
        }

        grid = liveArr = deadArr = null;

        return board;
    }

    ConwayLife.prototype.draw = function (board) {
        var x, y;
        var cxt = this.cxt;
        var config = this.config;
        for (var i = 0; i < board.length; i++) {
            if (!board[i]) continue;
            y = parseInt(i / config.colSize);
            x = i % config.colSize;
            cxt.beginPath();
            cxt.rect(x * (config.cw + 1) + config.ox, y * (config.ch + 1) + config.oy, config.cw, config.ch);
            // if (this.isStartDraw) {
            //     this.cxt.fillStyle = randomColor();
            // }
            cxt.fill();
        }
        this.isStartDraw = false;
    }

    ConwayLife.prototype.animate = function () {
        this.emit('beforeUpdate');

        if (!this.isPaused && (Date.now() - this.lastGen > this.config.interval || this.firstTime)) {
            this.emit('beforeDraw');
            
            this.clear();
            this.board = this.next(this.board);
            this.lastGen = Date.now();
            this.firstTime = false;
            this.isStartDraw = true;

            this.draw(this.board);
        }
        
        this.raf = requestAnimationFrame(this.animate.bind(this));
    }

    ConwayLife.prototype.start = function () {
        this.init();
        this.animate();
        return this;
    }

    ConwayLife.prototype.destroy = function () {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }

        return this;
    }

    ConwayLife.prototype.on = function (listenerName, func) {
        if (!this.listeners) {
            this.listeners = {};
        }
        this.listeners[listenerName] = func;
    }

    ConwayLife.prototype.emit = function (listenerName) {
        var listeners = this.listeners;
        if (listeners && listeners[listenerName]) {
            var args = Array.prototype.slice.call(arguments);
            args.shift();
            listeners[listenerName].apply(this, args);
        }
    }

    ConwayLife.prototype.clear = function () {
        this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    function random(a, b) {
        if (b == undefined) {
            b = a;
            a = 0;
        }
        return Math.floor(Math.random() * b + a);
    }

    function randomColor(alpha) {
        alpha = alpha || 0.3;
        return 'rgba(' + random(255) + ',' + random(255) + ',' + random(255) + ',' + alpha + ')';
    }

    try {
        module.exports = ConwayLife;
    } catch (e) {}
    
    return ConwayLife;
})();
