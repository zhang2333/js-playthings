'use strict';
// handle events
(function () {
    var highlightColor = '#ccc';
    var cfConfig = {
        color: '#999'
    }

    var cf = new ConwayLife('canvas', cfConfig).start();
    cf.reBoard = cf.resetBoard();

    cf.on('beforeUpdate', function () {
        this.cxt.fillStyle = highlightColor;
        this.draw(this.reBoard);
        this.cxt.fillStyle = this.config.color;
    });

    cf.on('beforeDraw', function () {
        for (var i = 0; i < this.reBoard.length; i++) {
            if (this.reBoard[i]) {
                this.board[i] = this.reBoard[i];
            }
        }
        this.reBoard = this.resetBoard();
    });

    var dragging = false;
    function handleEvent(e) {
        var x = Math.round(e.clientX * cf.config.colSize / cf.canvas.width);
        var y = Math.round(e.clientY * cf.config.rowSize / cf.canvas.height);
        cf.setCell(cf.reBoard, x, y, 1);
    }

    cf.canvas.onmousedown = function (e) {
        dragging = true;
        handleEvent(e);
    }

    cf.canvas.onmouseup = function (e) {
        dragging = false;
        handleEvent(e);
    }

    cf.canvas.onmousemove = function (e) {
        if (!dragging) return;
        handleEvent(e);
    }

    cf.canvas.onclick = handleEvent;

    document.onkeydown = function (e) {
        if (e.keyCode === 32) {
            cf.isPaused = !cf.isPaused;
        }

        if (e.keyCode === 13) {
            cf.isPaused = true;
            cf.board = cf.resetBoard();
            cf.reBoard = cf.resetBoard();
            cf.clear();
        }
    }
})();
