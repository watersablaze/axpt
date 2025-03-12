document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Circuitboard script loaded!");
  
    if (typeof window === "undefined") {
      console.warn("⚠️ Script tried running on the server. Skipping...");
      return;
    }
  
    setTimeout(() => {
      const canvas = document.getElementById("c");
  
      if (!canvas) {
        console.error("❌ Canvas not found! Check HTML and script loading.");
        return;
      }
  
      // ✅ Ensure visibility
      canvas.style.opacity = "1";
      canvas.style.zIndex = "9999";
  
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  
      console.log("✅ Canvas initialized. Width:", canvas.width, "Height:", canvas.height);
  
      class Dots {
        constructor(width, height, spacing) {
          this.spacing = spacing;
          this.dots = [];
          this.cols = Math.floor(width / spacing);
          this.rows = Math.floor(height / spacing);
          this.init();
        }
  
        init() {
          this.dots = Array.from({ length: this.cols }, (_, x) =>
            Array.from({ length: this.rows }, (_, y) => ({ x: x * this.spacing, y: y * this.spacing }))
          );
        }
  
        draw(ctx) {
          ctx.fillStyle = "rgba(24, 129, 141, 0.1)";
          this.dots.forEach(col => {
            col.forEach(dot => {
              ctx.fillRect(dot.x, dot.y, 1, 1);
            });
          });
        }
      }
  
      class Circuits {
        constructor(width, height, size) {
          this.size = size;
          this.width = width;
          this.height = height;
          this.cols = Math.floor(width / size);
          this.rows = Math.floor(height / size);
          this.circuits = [];
          this.generateCircuits();
        }
  
        generateCircuits() {
          for (let i = 0; i < 100; i++) {
            let startX = Math.floor(Math.random() * this.cols);
            let startY = Math.floor(Math.random() * this.rows);
            let length = Math.floor(Math.random() * 15) + 5;
  
            let path = [{ x: startX, y: startY }];
            let direction = Math.random() > 0.5 ? "horizontal" : "vertical";
  
            for (let j = 0; j < length; j++) {
              let last = path[path.length - 1];
              let newPoint = { x: last.x, y: last.y };
  
              if (direction === "horizontal") {
                newPoint.x += Math.random() > 0.5 ? 1 : -1;
              } else {
                newPoint.y += Math.random() > 0.5 ? 1 : -1;
              }
  
              if (newPoint.x >= 0 && newPoint.x < this.cols && newPoint.y >= 0 && newPoint.y < this.rows) {
                path.push(newPoint);
              }
            }
  
            this.circuits.push(path);
          }
        }
  
        draw(ctx) {
          ctx.strokeStyle = "rgba(59, 177, 188, 1)";
          ctx.lineWidth = 1.5;
  
          this.circuits.forEach(path => {
            ctx.beginPath();
            ctx.moveTo(path[0].x * this.size, path[0].y * this.size);
            path.forEach(point => ctx.lineTo(point.x * this.size, point.y * this.size));
            ctx.stroke();
          });
        }
      }
  
      const dots = new Dots(canvas.width, canvas.height, 2);
      const circuits = new Circuits(canvas.width, canvas.height, 10);
  
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dots.draw(ctx);
        circuits.draw(ctx);
        requestAnimationFrame(animate);
      }
  
      animate();
    }, 500); // Short delay to ensure Next.js components are rendered
  });