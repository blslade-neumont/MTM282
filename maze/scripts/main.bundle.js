

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
        body.onresize = function (e) { return refreshCanvasSize(); };
    }
    function refreshCanvasSize() {
        if (canvas) {
            canvasSize = [canvas.scrollWidth, canvas.scrollHeight];
            canvas.width = canvasSize[0], canvas.height = canvasSize[1];
        }
    }
    
    var CELL_SIZE = [16, 16];
    var MAZE_SIZE = [1, 1];
    
    var maze = [];
    
    function generateMaze() {
        MAZE_SIZE = [Math.floor(canvas.width / CELL_SIZE[0]), Math.floor(canvas.height / CELL_SIZE[1])];
        maze = [];
        for (let x = 0; x < MAZE_SIZE[0]; x++) {
            let col = maze[x] = [];
            for (let y = 0; y < MAZE_SIZE[1]; y++) {
                col[y] = Math.floor(Math.random() * 2);
            }
        }
    }
    function drawMaze() {
        context.fillStyle = 'black';
        context.fillRect(0, 0, CELL_SIZE[0], CELL_SIZE[1]);
        for (let x = 0; x < MAZE_SIZE[0]; x++) {
            let col = maze[x];
            for (let y = 0; y < MAZE_SIZE[1]; y++) {
                let cell = col[y];
                context.fillStyle = cell == 0 ? 'black' : 'red';
                context.fillRect(x * CELL_SIZE[0], y * CELL_SIZE[1], CELL_SIZE[0], CELL_SIZE[1]);
            }
        }
    }
    
    init();
})();
