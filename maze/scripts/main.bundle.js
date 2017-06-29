

(function() {
    let body = null;
    let canvas = null;
    let context = null;
    let canvasSize = [500, 500];
    
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
    
    let CELL_SIZE = [16, 16];
    let MAZE_SIZE = [1, 1];
    
    let directions = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ];
    function shuffle(arr) {
        let currentIdx = arr.length;
        while (currentIdx > 1) {
            let rndIdx = Math.floor(Math.random() * currentIdx--);
            [arr[currentIdx], arr[rndIdx]] = [arr[rndIdx], arr[currentIdx]];
        }
        return arr;
    }
    let pseudoRng = (function() {
        const RND_COUNT = 200;
        let vals = [];
        for (let q = 0; q < RND_COUNT; q++) {
            vals.push(shuffle([0, 1, 2, 3]));
            // console.log(vals[vals.length - 1]);
        }
        return vals;
    })();
    
    let maze = null;
    function isInMaze(x, y) {
        return x >= 0 && y >= 0 && x < MAZE_SIZE[0] && y < MAZE_SIZE[1];
    }
    
    function generateMaze() {
        MAZE_SIZE = [Math.floor(canvas.width / CELL_SIZE[0] / 2) * 2 + 1, Math.floor(canvas.height / CELL_SIZE[1] / 2) * 2 + 1];
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
        
        let rndIdx = 0;
        while (true) {
            let lastVal = maze[x][y];
            let moved = false;
            let rndVals = pseudoRng[rndIdx++ % pseudoRng.length];
            for (let q = 0; q < 4; q++) {
                let dir = directions[rndVals[q]];
                if (isInMaze(x + dir[0] * 2, y + dir[1] * 2) && maze[x + dir[0] * 2][y + dir[1] * 2] === -1) {
                    moved = true;
                    maze[x + dir[0] * 2][y + dir[1] * 2] = lastVal + 1;
                    maze[x + dir[0] * 1][y + dir[1] * 1] = 0;
                    [x, y] = [x + dir[0] * 2, y + dir[1] * 2];
                    break;
                }
            }
            if (!moved) {
                if (lastVal === 0) break;
                let found = false;
                for (let q = 0; q < 4; q++) {
                    let dir = directions[rndVals[q]];
                    if (isInMaze(x + dir[0] * 2, y + dir[1] * 2) && maze[x + dir[0] * 2][y + dir[1] * 2] === lastVal - 1) {
                        found = true;
                        [x, y] = [x + dir[0] * 2, y + dir[1] * 2];
                        break;
                    }
                }
                if (!found) throw new Error('Failed to backtrack maze during maze generation');
            }
        }
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
