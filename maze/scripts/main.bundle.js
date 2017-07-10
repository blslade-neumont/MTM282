

(function() {
    let body = null;
    let canvas = null;
    let context = null;
    let canvasSize = [500, 500];
    
    let CELL_SIZE = [80, 80];
    
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
        this.realPlayer = { enabled: true, victory: false, defeat: false };
        this.aiPlayer = { enabled: false };
        this.seconds = 10;
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
        
        if (this.realPlayer.enabled) {
            this.realPlayer.x = this.startPos[0];
            this.realPlayer.y = this.startPos[1];
            this.realPlayer.hspeed = 0;
            this.realPlayer.vspeed = 0;
        }
        if (this.aiPlayer.enabled) {
            this.aiPlayer.x = this.startPos[0];
            this.aiPlayer.y = this.startPos[1];
            this.aiPlayer.hspeed = 0;
            this.aiPlayer.vspeed = 0;
            this.aiPlayer.frontx = 0;
            this.aiPlayer.fronty = 0;
        }
        
        this.seconds = (Math.floor(this.width / 2) * Math.floor(this.height / 2));
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
                if (cell === 0) {
                    context.fillStyle = 'rgb(220, 220, 220)';
                    context.fillRect(x + .2, y + .2, .6, .6);
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
        
        context.fillStyle = 'white';
        context.font = '16px Cambria';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        let seconds = this.seconds;
        context.fillText(`Time left: ${Math.floor(seconds)}.${Math.floor((seconds - Math.floor(seconds)) * 10)} seconds`, canvas.width / 2, CELL_SIZE[1] / 2);
        
        if (this.realPlayer.enabled && (this.realPlayer.victory || this.realPlayer.defeat)) {
            context.fillStyle = 'rgba(0, 0, 0, .9)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            if (this.realPlayer.victory) {
                context.font = '42px Cambria';
                context.fillText(`You Win!`, canvas.width / 2, (canvas.height / 2) - 40);
                
                context.font = '16px Cambria';
                let seconds = this.seconds;
                context.fillText(`You reached the exit before time ran out.`, canvas.width / 2, (canvas.height / 2) + 20);
                context.fillText(`Time Remaining: ${Math.floor(seconds)}.${Math.floor((seconds - Math.floor(seconds)) * 10)} seconds`, canvas.width / 2, (canvas.height / 2) + 40);
                context.fillText(`Press F5 to restart.`, canvas.width / 2, (canvas.height / 2) + 60);
                
                if (!this.fireworks) this.fireworks = [];
                for (let q = 0; q < this.fireworks.length; q++) {
                    let firework = this.fireworks[q];
                    firework.render(context);
                }
            }
            else {
                context.font = '42px Cambria';
                context.fillText(`You Lose!`, canvas.width / 2, (canvas.height / 2) - 40);
                
                context.font = '16px Cambria';
                let seconds = this.seconds;
                context.fillText(`Time ran out before you could complete the maze.`, canvas.width / 2, (canvas.height / 2) + 20);
                context.fillText(`If the maze is too large, reduce the size of your browser tab and press F5 to try again.`, canvas.width / 2, (canvas.height / 2) + 40);
            }
        }
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
            if (!this.realPlayer.victory && !this.realPlayer.defeat) {
                this.realPlayer.x += this.realPlayer.hspeed;
                this.realPlayer.y += this.realPlayer.vspeed;
                let roundX = Math.round(this.realPlayer.x);
                let roundY = Math.round(this.realPlayer.y);
                if (Math.abs(this.realPlayer.x - roundX) < .01 && Math.abs(this.realPlayer.y - roundY) < .01) {
                    this.realPlayer.x = roundX;
                    this.realPlayer.y = roundY;
                    this.realPlayer.hspeed = 0;
                    this.realPlayer.vspeed = 0;
                    if (roundX === this.endPos[0] && roundY === this.endPos[1]) {
                        this.realPlayer.victory = true;
                    }
                    else {
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
            }
            
            if (this.seconds <= 0 && !this.realPlayer.victory) this.realPlayer.defeat = true;
            
            if (this.realPlayer.defeat) {
                
            }
            if (this.realPlayer.victory) {
                //TODO: something cool
                if (!this.fireworks) this.fireworks = [];
                if (!this.fireworksTimer || this.fireworksTimer <= 0) {
                    this.fireworksTimer = .25;
                    this.fireworks.push(this.createFirework());
                }
                else this.fireworksTimer -= 1 / 30;
                for (let q = 0; q < this.fireworks.length; q++) {
                    let firework = this.fireworks[q];
                    if (!firework.tick()) {
                        this.fireworks.splice(q, 1);
                        q--;
                        continue;
                    }
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
            if (!this.realPlayer.victory && !this.realPlayer.defeat) this.seconds -= 1 / 30;
            this.tick();
            this.render(context);
        }, 1000 / 30);
    };
    
    Maze.prototype.createFirework = function() {
        let obj = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: ['green', 'red', 'yellow', 'blue', 'purple'][Math.floor(Math.random() * 5)],
            parts: []
        };
        for (let q = 0; q < 100; q++) {
            let dir = Math.random() * 2 * Math.PI;
            let spd = Math.random() * 5;
            obj.parts[q] = {
                x: 0,
                y: 0,
                hspeed: Math.cos(dir) * spd,
                vspeed: Math.sin(dir) * spd,
                ttl: 1 + Math.random()
            }
        }
        
        obj.tick = (function() {
            isAlive = false;
            for (let q = 0; q < this.parts.length; q++) {
                let part = this.parts[q];
                if (part.ttl > 0) isAlive = true;
                part.ttl -= 1 / 30;
                part.x += part.hspeed;
                part.y += part.vspeed;
            }
            return isAlive;
        }).bind(obj);
        
        obj.render = (function(context) {
            context.save();
            context.translate(this.x, this.y);
            context.fillStyle = this.color;
            
            for (let q = 0; q < this.parts.length; q++) {
                let part = this.parts[q];
                if (part.ttl > 0) {
                    context.globalAlpha = Math.min(1, part.ttl);
                    context.fillRect(part.x - 3, part.y - 3, 6, 6);
                }
            }
            
            context.restore();
        }).bind(obj);
        
        return obj;
    };
    
    init();
})();
