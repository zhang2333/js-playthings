/**
 * Created by Louis Zhang (github.com/zhang2333)
 */

'use strict';

function ConwayLife (canvasId) {
    var canvas = document.getElementById(canvasId);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 5;

    var cxt = canvas.getContext('2d');
    cxt.fillStyle = '#aaa';

    var cw = 12, ch = 12;
    this.config = {
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
        interval: 500
    };

    this.firstTime = true;
    this.isPaused = false;
    this.lastGen = Date.now();

    this.canvas = canvas;
    this.cxt = cxt;
}

ConwayLife.prototype.setCell = function (x, y, state) {
    state = state > 0 ? 1 : 0;
    this.board[y * this.config.colSize + x] = 1;
}

ConwayLife.prototype.resetBoard = function () {
    this.board = [];

    for(var i = 0; i < this.config.rowSize * this.config.colSize; i++) {
        this.board.push(0);
    }
}

ConwayLife.prototype.init = function () {
    this.resetBoard();
    for(var i = 0; i < parseInt(this.config.rowSize * this.config.colSize / 5); i++) {
        this.setCell(random(this.config.colSize), random(this.config.rowSize), 1);
    }
}

ConwayLife.prototype.next = function (board) {
    var grid = [], liveArr = [], deadArr = [];

    // transform board to 2d grid
    for (var i = 0; i < this.config.rowSize; i++) {
        grid.push(board.slice(i * this.config.colSize, (i + 1) * this.config.colSize));
    }

    // check status
    for (var i = 0; i < this.config.rowSize; i++) {
        for (var j = 0; j < this.config.colSize; j++) {
            // count the live
            var liveNum = 0;
            for (var y = i - 1; y <= i + 1; y++) {
                for(var x = j - 1; x <= j + 1; x++) {
                    if (x < 0 || y < 0 || y >= this.config.rowSize || (x == j && y == i)) {
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

ConwayLife.prototype.draw = function () {
    var x, y;
    for (var i = 0; i < this.board.length; i++) {
        y = parseInt(i / this.config.colSize);
        x = i % this.config.colSize;
        if (this.board[i]) {
            this.cxt.beginPath();
            this.cxt.rect(x * (this.config.cw + 1) + this.config.ox, y * (this.config.ch + 1) + this.config.oy, this.config.cw, this.config.ch);
            this.cxt.fill();
        }
    }
}

ConwayLife.prototype.animate = function () {
    this.cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw();
    if (!this.isPaused && (Date.now() - this.lastGen > this.config.interval || this.firstTime)) {
        this.board = this.next(this.board);
        this.lastGen = Date.now();
        this.firstTime = false;
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

function random(a, b) {
    if (b == undefined) {
        b = a;
        a = 0;
    }
    return parseInt(Math.random() * b + a);
}

try {
    module.exports = ConwayLife;
} catch (e) {}
