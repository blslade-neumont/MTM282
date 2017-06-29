

(function() {
    let body = null;
    let canvas = null;
    let context = null;
    let canvasSize = [500, 500];
    
    let CELL_SIZE = [2, 2];
    
    let maze = null;
    
    function init() {
        body = document.getElementsByTagName('body')[0];
        initResize();
        if (!canvas) {
            canvas = document.getElementById('gameCanvas');
        }
        refreshCanvasSize();
        context = canvas.getContext('2d');
        
        let [mazeWidth, mazeHeight] = [Math.floor(((canvas.width / CELL_SIZE[0]) - 1) / 2) * 2 + 1, Math.floor(((canvas.height / CELL_SIZE[1]) - 1) / 2) * 2 + 1];
        maze = new Maze(mazeWidth, mazeHeight);
        maze.generate();
        maze.render(context);
    }
    
    function initResize() {
        body.onresize = function (e) {
            refreshCanvasSize();
            if (maze) maze.render(context);
        };
    }
    function refreshCanvasSize() {
        if (canvas) {
            canvasSize = [canvas.scrollWidth, canvas.scrollHeight];
            canvas.width = canvasSize[0], canvas.height = canvasSize[1];
        }
    }
    
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
        }
        return vals;
    })();
    
    function Maze(width, height) {
        this.width = width;
        this.height = height;
        this.maze = null;
    }
    Maze.prototype.generate = function() {
        this.maze = [];
        for (let x = 0; x < this.width; x++) {
            let col = this.maze[x] = [];
            for (let y = 0; y < this.height; y++) {
                col[y] = -1;
            }
        }
        
        let side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0 || side === 2) {
            x = (side === 0) ? 1 : this.width - 2;
            y = Math.floor(Math.random() * (this.height - 1) / 2) * 2 + 1;
        }
        else {
            x = Math.floor(Math.random() * (this.width - 1) / 2) * 2 + 1;
            y = (side === 1) ? 1 : this.height - 2;
        }
        this.maze[x][y] = 0;
        
        let rndIdx = 0;
        while (true) {
            let lastVal = this.maze[x][y];
            let moved = false;
            let rndVals = pseudoRng[rndIdx++ % pseudoRng.length];
            for (let q = 0; q < 4; q++) {
                let dir = directions[rndVals[q]];
                if (this.isInMaze(x + dir[0] * 2, y + dir[1] * 2) && this.maze[x + dir[0] * 2][y + dir[1] * 2] === -1) {
                    moved = true;
                    this.maze[x + dir[0] * 2][y + dir[1] * 2] = lastVal + 1;
                    this.maze[x + dir[0] * 1][y + dir[1] * 1] = 0;
                    [x, y] = [x + dir[0] * 2, y + dir[1] * 2];
                    break;
                }
            }
            if (!moved) {
                if (lastVal === 0) break;
                let found = false;
                for (let q = 0; q < 4; q++) {
                    let dir = directions[rndVals[q]];
                    if (this.isInMaze(x + dir[0] * 2, y + dir[1] * 2) && this.maze[x + dir[0] * 2][y + dir[1] * 2] === lastVal - 1) {
                        found = true;
                        [x, y] = [x + dir[0] * 2, y + dir[1] * 2];
                        break;
                    }
                }
                if (!found) throw new Error('Failed to backtrack maze during maze generation');
            }
        }
    }
    Maze.prototype.isInMaze = function(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }
    Maze.prototype.render = function(context) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.scale(CELL_SIZE[0], CELL_SIZE[1]);
        console.log(this.maze);
        if (!this.maze) return;
        for (let x = 0; x < this.width; x++) {
            let col = this.maze[x];
            for (let y = 0; y < this.height; y++) {
                let cell = col[y];
                context.fillStyle = cell == -1 ? 'black' : 'red';
                context.fillRect(x, y, 1, 1);
            }
        }
        context.restore();
    }
    
    init();
})();
