// wheel.js

export class SpinWheel {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.players = options.players || [];
        this.onFinish = options.onFinish || (() => { });

        this.angle = 0;
        this.isSpinning = false;
        this.speed = 0;
        this.friction = 0.992;
        this.minSpeed = 0.002;

        this.colors = [
            "#3b82f6", "#06b6d4", "#22c55e", "#f59e0b",
            "#ef4444", "#a855f7", "#ec4899", "#6366f1"
        ];

        this.resize();
        window.addEventListener("resize", () => this.resize());
        this.draw();
    }

    resize() {
        const size = this.canvas.parentElement.clientWidth;
        this.canvas.width = size * window.devicePixelRatio;
        this.canvas.height = size * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.size = size;
    }

    setPlayers(players) {
        this.players = players;
        this.draw();
    }

    spin() {
        if (this.isSpinning || this.players.length < 2) return;
        this.isSpinning = true;
        this.speed = 0.3 + Math.random() * 0.2;
        this.animate();
    }

    animate() {
        if (!this.isSpinning) return;

        this.angle += this.speed;
        this.speed *= this.friction;

        if (this.speed < this.minSpeed) {
            this.isSpinning = false;
            this.speed = 0;
            this.determineWinner();
        }

        this.draw();
        if (this.isSpinning) {
            requestAnimationFrame(() => this.animate());
        }
    }

    draw() {
        const { ctx, size, players, colors, angle } = this;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 10;

        ctx.clearRect(0, 0, size, size);

        if (players.length === 0) {
            // Draw empty wheel
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
            ctx.fill();
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#94a3b8";
            ctx.font = "bold 16px Outfit";
            ctx.textAlign = "center";
            ctx.fillText("Add players to start", centerX, centerY);
            return;
        }

        const sliceAngle = (Math.PI * 2) / players.length;

        players.forEach((player, i) => {
            const startA = angle + i * sliceAngle;
            const endA = startA + sliceAngle;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startA, endA);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // Draw border
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startA + sliceAngle / 2);
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Outfit";
            ctx.textAlign = "right";
            ctx.fillText(player, radius - 20, 5);
            ctx.restore();
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    determineWinner() {
        const sliceAngle = (Math.PI * 2) / this.players.length;
        // Normalized angle between 0 and 2PI
        // Pointer is at -PI/2 (top)
        const normalizedAngle = (1.5 * Math.PI - this.angle) % (Math.PI * 2);
        const positiveAngle = normalizedAngle < 0 ? normalizedAngle + Math.PI * 2 : normalizedAngle;

        const index = Math.floor(positiveAngle / sliceAngle);
        this.onFinish(this.players[index]);
    }
}
