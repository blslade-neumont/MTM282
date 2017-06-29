

(function() {
    var body = null;
    var canvas = null;
    var context = null;
    var canvasSize = [500, 500];
    
    function init() {
        body = document.getElementsByTagName('body')[0];
        initResize();
        if (!canvas) {
            canvas = document.getElementById('gameCanvas');
        }
        refreshCanvasSize();
        context = canvas.getContext('2d');
        
        generateMaze();
        drawMaze();
    }
    
    function initResize() {
        body.onresize = function (e) {
            refreshCanvasSize();
            drawMaze();
        };
    }
    function refreshCanvasSize() {
        if (canvas) {
            canvasSize = [canvas.scrollWidth, canvas.scrollHeight];
            canvas.width = canvasSize[0], canvas.height = canvasSize[1];
        }
    }
    
    var CELL_SIZE = [16, 16];
    var MAZE_SIZE = [1, 1];
    
    var maze = null;
    
    function generateMaze() {
        MAZE_SIZE = [Math.floor(canvas.width / CELL_SIZE[0]), Math.floor(canvas.height / CELL_SIZE[1])];
        maze = [];
        for (let x = 0; x < MAZE_SIZE[0]; x++) {
            let col = maze[x] = [];
            for (let y = 0; y < MAZE_SIZE[1]; y++) {
                col[y] = -1;
            }
        }
        
        let side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0 || side === 2) {
            x = (side === 0) ? 1 : MAZE_SIZE[0] - 2;
            y = Math.floor(Math.random() * (MAZE_SIZE[1] - 1) / 2) * 2 + 1;
        }
        else {
            x = Math.floor(Math.random() * (MAZE_SIZE[0] - 1) / 2) * 2 + 1;
            y = (side === 1) ? 1 : MAZE_SIZE[1] - 2;
        }
        maze[x][y] = 0;
    }
    function drawMaze() {
        context.fillStyle = 'black';
        context.fillRect(0, 0, CELL_SIZE[0], CELL_SIZE[1]);
        if (!maze) return;
        for (let x = 0; x < MAZE_SIZE[0]; x++) {
            let col = maze[x];
            for (let y = 0; y < MAZE_SIZE[1]; y++) {
                let cell = col[y];
                context.fillStyle = cell == -1 ? 'black' : 'red';
                context.fillRect(x * CELL_SIZE[0], y * CELL_SIZE[1], CELL_SIZE[0], CELL_SIZE[1]);
            }
        }
    }
    
    init();
})();
