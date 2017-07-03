

(function() {
    let body = null;
    let canvas = null;
    let context = null;
    let canvasSize = [500, 500];
    
    let CELL_SIZE = [48, 48];
    
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
        maze.events();
        maze.loop();
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
        const RND_COUNT = 9001;
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
        this.realPlayer = { enabled: false };
        this.aiPlayer = { enabled: false };
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
        let endPos = [x, y];
        let endValue = 0;
        while (true) {
            let lastVal = this.maze[x][y];
            let moved = false;
            let rndVals = pseudoRng[rndIdx++ % pseudoRng.length];
            for (let q = 0; q < 4; q++) {
                let dir = directions[rndVals[q]];
                if (this.isInMaze(x + dir[0] * 2, y + dir[1] * 2) && this.maze[x + dir[0] * 2][y + dir[1] * 2] === -1) {
                    moved = true;
                    this.maze[x + dir[0] * 2][y + dir[1] * 2] = lastVal + 1;
                    this.maze[x + dir[0] * 1][y + dir[1] * 1] = 1;
                    [x, y] = [x + dir[0] * 2, y + dir[1] * 2];
                    if (/*(x === 1 || y === 1 || x === this.width - 2 || y === this.height - 2) &&*/ lastVal + 1 > endValue) {
                        endPos = [x, y];
                        endValue = lastVal + 1;
                    }
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
        
        [x, y] = endPos;
        this.endPos = endPos;
        while (true) {
            let currVal = this.maze[x][y];
            this.maze[x][y] = 0;
            if (currVal === 0) break;
            for (let q = 0; q < 4; q++) {
                let dir = directions[q];
                if (this.isInMaze(x + dir[0] * 2, y + dir[1] * 2) && this.maze[x + dir[0] * 2][y + dir[1] * 2] === currVal - 1 && this.maze[x + dir[0] * 1][y + dir[1] * 1] === 1) {
                    this.maze[x + dir[0] * 1][y + dir[1] * 1] = 0;
                    [x, y] = [x + dir[0] * 2, y + dir[1] * 2];
                }
            }
        }
        this.startPos = [x, y];
    };
    Maze.prototype.isInMaze = function(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    };
    Maze.prototype.render = function(context, cellWidth = CELL_SIZE[0], cellHeight = CELL_SIZE[1]) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.scale(cellWidth, cellHeight);
        if (!this.maze) return;
        for (let x = 0; x < this.width; x++) {
            let col = this.maze[x];
            for (let y = 0; y < this.height; y++) {
                let cell = col[y];
                if (cell !== -1) {
                    context.fillStyle = 'white';
                    context.fillRect(x - .1, y - .1, 1.2, 1.2);
                }
            }
        }
        
        context.fillStyle = 'green';
        for (let q = 0; q < 4; q++) {
            for (let w = 0; w < 4; w++) {
                if (w - q % 2 === 1) continue;
                context.fillRect(this.endPos[0] + (q / 4), this.endPos[1] + (w / 4), .25, .25);
            }
        }
        
        context.strokeStyle = 'green';
        context.lineWidth = 4 / CELL_SIZE[0];
        context.strokeRect(this.startPos[0], this.startPos[1], 1, 1);
        
        if (this.realPlayer.enabled) {
            context.fillStyle = 'orange';
            context.fillRect(this.realPlayer.x, this.realPlayer.y, 1, 1);
        }
        
        if (this.aiPlayer.enabled) {
            context.fillStyle = 'blue';
            context.fillRect(this.aiPlayer.x, this.aiPlayer.y, 1, 1);
        }
        
        context.restore();
        
        context.fillStyle = 'white';
        context.font = '16px Cambria';
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText('Press P to play, press A to watch the AI play', CELL_SIZE[0], CELL_SIZE[1] / 2);
    };
    Maze.prototype.events = function() {
        this.keys = new Map();
        document.addEventListener('keydown', (e) => {
            this.keys.set(e.code, true);
            if (e.code === 'KeyP') {
                if (this.realPlayer.enabled) {
                    this.realPlayer.enabled = false;
                }
                else {
                    this.realPlayer.enabled = true;
                    this.realPlayer.x = this.startPos[0];
                    this.realPlayer.y = this.startPos[1];
                    this.realPlayer.hspeed = 0;
                    this.realPlayer.vspeed = 0;
                }
            }
            else if (e.code === 'KeyA') {
                if (this.aiPlayer.enabled) {
                    this.aiPlayer.enabled = false;
                }
                else {
                    this.aiPlayer.enabled = true;
                    this.aiPlayer.x = this.startPos[0];
                    this.aiPlayer.y = this.startPos[1];
                    this.aiPlayer.hspeed = 0;
                    this.aiPlayer.vspeed = 0;
                    this.aiPlayer.frontx = 1;
                    this.aiPlayer.fronty = 0;
                }
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });
    }
    Maze.prototype.tick = function() {
        if (this.realPlayer.enabled) {
            this.realPlayer.x += this.realPlayer.hspeed;
            this.realPlayer.y += this.realPlayer.vspeed;
            let roundX = Math.round(this.realPlayer.x);
            let roundY = Math.round(this.realPlayer.y);
            if (Math.abs(this.realPlayer.x - roundX) < .01 && Math.abs(this.realPlayer.y - roundY) < .01) {
                this.realPlayer.x = roundX;
                this.realPlayer.y = roundY;
                this.realPlayer.hspeed = 0;
                this.realPlayer.vspeed = 0;
                let mvx = 0 + ((this.keys.has('ArrowRight') && this.keys.get('ArrowRight')) ? 1 : 0) - ((this.keys.has('ArrowLeft') && this.keys.get('ArrowLeft')) ? 1 : 0);
                let mvy = 0 + ((this.keys.has('ArrowDown') && this.keys.get('ArrowDown')) ? 1 : 0) - ((this.keys.has('ArrowUp') && this.keys.get('ArrowUp')) ? 1 : 0);
                if (mvx !== 0 && this.isInMaze(this.realPlayer.x + mvx, this.realPlayer.y) && this.maze[this.realPlayer.x + mvx][this.realPlayer.y] !== -1) {
                    this.realPlayer.hspeed = mvx / 8;
                }
                else if (mvy !== 0 && this.isInMaze(this.realPlayer.x, this.realPlayer.y + mvy) && this.maze[this.realPlayer.x][this.realPlayer.y + mvy] !== -1) {
                    this.realPlayer.vspeed = mvy / 8;
                }
            }
        }
        
        if (this.aiPlayer.enabled) {
            this.aiPlayer.x += this.aiPlayer.hspeed;
            this.aiPlayer.y += this.aiPlayer.vspeed;
            let roundX = Math.round(this.aiPlayer.x);
            let roundY = Math.round(this.aiPlayer.y);
            if (Math.abs(this.aiPlayer.x - roundX) < .01 && Math.abs(this.aiPlayer.y - roundY) < .01) {
                this.aiPlayer.x = roundX;
                this.aiPlayer.y = roundY;
                this.aiPlayer.hspeed = 0;
                this.aiPlayer.vspeed = 0;
                if (this.isInMaze(this.aiPlayer.x + this.aiPlayer.fronty, this.aiPlayer.y - this.aiPlayer.frontx) && this.maze[this.aiPlayer.x + this.aiPlayer.fronty][this.aiPlayer.y - this.aiPlayer.frontx] !== -1) {
                    [this.aiPlayer.frontx, this.aiPlayer.fronty] = [this.aiPlayer.fronty, -this.aiPlayer.frontx];
                }
                else if (this.isInMaze(this.aiPlayer.x + this.aiPlayer.frontx, this.aiPlayer.y + this.aiPlayer.fronty) && this.maze[this.aiPlayer.x + this.aiPlayer.frontx][this.aiPlayer.y + this.aiPlayer.fronty] !== -1) {
                    //Nop
                }
                else if (this.isInMaze(this.aiPlayer.x - this.aiPlayer.fronty, this.aiPlayer.y + this.aiPlayer.frontx) && this.maze[this.aiPlayer.x - this.aiPlayer.fronty][this.aiPlayer.y + this.aiPlayer.frontx] !== -1) {
                    [this.aiPlayer.frontx, this.aiPlayer.fronty] = [-this.aiPlayer.fronty, this.aiPlayer.frontx];
                }
                else {
                    [this.aiPlayer.frontx, this.aiPlayer.fronty] = [-this.aiPlayer.frontx, -this.aiPlayer.fronty];
                }
                this.aiPlayer.hspeed = this.aiPlayer.frontx / 8;
                this.aiPlayer.vspeed = this.aiPlayer.fronty / 8;
            }
        }
    };
    Maze.prototype.loop = function() {
        setInterval(() => {
            this.tick();
            this.render(context);
        }, 1000 / 30);
    };
    
    init();
})();
