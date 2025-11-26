function createGameSketch() {
  return function(p) {

    let cellSize = 4;
    let cols, rows;
    let grid;

    let brushCategory = "auto";
    let brushSizeAuto = 4;
    let brushSizePink = 1;
    let brushSizeGrey = 1;
    let brushSizeManifest = 1;
    let brushSizeWood = 1;

    let PINK_VARIANTS;
    let BROWN_VARIANTS;
    let MANIFEST_VARIANTS;
    let WOOD_VARIANTS;
    let LEAF_VARIANTS;
    let ROCK_LIGHT_MIN = 140;
    let ROCK_LIGHT_MAX = 180;

    let lastGreyDropTime = 0;
    let greyCooldown = 1000;
    let lastBrownDropTime = 0;
    let brownCooldown = 1000;
    let lastWoodDropTime = 0;
    let woodCooldown = 1000;

    let brownLifetime = 3000;
    let bg;
    let uiFont;

    // 🔊 SONS
    let soundPink, soundGrey, soundBrown, soundManifest, soundAuto, soundWood;
    let lastSoundTime = 0;
    let soundCooldown = 100;

    // 🎮 GAME OVER
    let gameEnded = false;

    // ⭐ ÉTOILES
    let stars = [];
    let starCount = 300;

    const startButton = document.querySelector('.start-button');

    startButton.addEventListener('click', () => {
        // Débloquer le moteur audio pour tous les sons p5
        p.userStartAudio().then(() => {
            console.log("🎵 Audio débloqué, tous les sons peuvent jouer");
        });
    });
    
    // ─────────────────────────────────────────────
    // PRELOAD
    // ─────────────────────────────────────────────
    p.preload = function() {
      uiFont = p.loadFont('PixelifySans-VariableFont_wght.ttf');
      bg = p.loadImage('bg8.jpg');
      
      // Charger les sons
      soundPink = p.loadSound('grass.mp3', 
        () => console.log('✅ Son herbe chargé'), 
        () => console.log('❌ Erreur son herbe'));
      soundGrey = p.loadSound('metal.mp3', 
        () => console.log('✅ Son pylone chargé'), 
        () => console.log('❌ Erreur son pylone'));
      soundBrown = p.loadSound('bee.mp3', 
        () => console.log('✅ Son scolyte chargé'), 
        () => console.log('❌ Erreur son scolyte'));
      soundManifest = p.loadSound('crowd.mp3', 
        () => console.log('✅ Son manifs chargé'), 
        () => console.log('❌ Erreur son manifs'));
      soundAuto = p.loadSound('rock.mp3', 
        () => console.log('✅ Son montagne chargé'), 
        () => console.log('❌ Erreur son montagne'));
      soundWood = p.loadSound('wood.mp3', 
        () => console.log('✅ Son arbre chargé'), 
        () => console.log('❌ Erreur son arbre'));
    };

    // ─────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────
    p.setup = function() {
      let canvas = p.createCanvas(1445, 825);
      canvas.parent('p5-canvas-container');
      p.frameRate(60);

      cols = p.floor(p.width / cellSize);
      rows = p.floor(p.height / cellSize);
      grid = create2DArray(rows, cols);

      // Générer les étoiles
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: p.random(p.width),
          y: p.random(p.height),
          brightness: p.random(150, 255)
        });
      }

      PINK_VARIANTS = [
        p.color(105,140,80),
        p.color(90,125,70),
        p.color(75,110,60),
        p.color(60,95,50),
        p.color(180,180,230)
      ];
      
      BROWN_VARIANTS = [
        p.color(80, 50, 40),
        p.color(50, 35, 30)
      ];

      MANIFEST_VARIANTS = [
        p.color(255, 80, 80),
        p.color(255, 180, 60),
        p.color(80, 160, 255),
        p.color(160, 80, 255),
        p.color(60, 220, 140)
      ];

      WOOD_VARIANTS = [
      p.color(120, 80, 55),  // brun clair
      p.color(100, 70, 45),
      p.color(140, 90, 60)
      ];

      LEAF_VARIANTS = [
      p.color(46, 53, 42),   // vert foncé
      p.color(201, 201, 108),  // vert moyen
      p.color(49, 112, 57),   // vert clair
      p.color(123,137,110)
      ];

      p.noStroke();

      const bgVideo = document.getElementById('game-background-video');
      if (bgVideo) bgVideo.style.display = 'block';
    };

    // ─────────────────────────────────────────────
    // DRAW
    // ─────────────────────────────────────────────
    p.draw = function() {
      if (gameEnded) return;
      p.background('#e4edf1');

      drawSky(); // Ciel animé au lieu de l'image
      applyPhysics();
      drawGrid();
      drawButtons();

      if (p.mouseIsPressed && p.mouseY > 40) {
        let mc = p.constrain(p.floor(p.mouseX / cellSize), 0, cols - 1);
        let mr = p.constrain(p.floor(p.mouseY / cellSize), 0, rows - 1);
        paintBrush(mr, mc);
      }
      
      p.fill(255);
      p.textSize(12);
      p.text("C = effacer | ↑↓ = taille pinceau actif", 8, p.height - 8);
    };

    // ============================================================================
    //  CIEL ANIMÉ JOUR/NUIT
    // ============================================================================
    function drawSky() {
      let cycle = (p.sin(p.millis() * 0.0001) + 1) / 2;

      for (let y = 0; y < p.height; y++) {
        let t = p.map(y, 0, p.height, 0, 1);

        let dayTop    = p.color(135, 206, 250);
        let dayBottom = p.color(25, 90, 160);
        let nightTop    = p.color(10, 15, 40);
        let nightBottom = p.color(5, 5, 20);

        let topCol    = p.lerpColor(nightTop, dayTop, cycle);
        let bottomCol = p.lerpColor(nightBottom, dayBottom, cycle);

        let col = p.lerpColor(topCol, bottomCol, t);
        p.stroke(col);
        p.line(0, y, p.width, y);
      }

      p.noStroke();

      // Étoiles visibles la nuit
      let starOpacity = p.map(cycle, 1, 0, 0, 255);
      starOpacity = p.constrain(starOpacity, 0, 255);

      if (starOpacity > 0) {
        for (let s of stars) {
          p.stroke(255, starOpacity * (s.brightness / 255));
          p.point(s.x, s.y);
        }
      }

      p.noStroke();
    }

    // ============================================================================
    //  PHYSIQUE
    // ============================================================================
    function applyPhysics() {

      let nGrey = countGreyPillars();
      let factor = p.max(0.2, 1 - nGrey * 0.04);
      let effectiveLifetime = brownLifetime * factor;
      let electricDanger = nGrey > 100;

      for (let r = rows - 2; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {

          let cell = grid[r][c];
          if (cell === 0) continue;

          // --- DÉCLENCHEMENT DU FEU ---
          if (electricDanger) {
            if (isCellObj(cell) && (cell.type === "wood" || cell.type === "leaf")) {
              if (p.random() < 0.0008) {
                grid[r][c] = {
                  type: "fire",
                  life: 240
                };
                continue;
              }
            }
          }

          // --- BROWN (SCOLYTE) ---
          if (isCellObj(cell) && cell.type === "brown") {

            let below = grid[r + 1][c];

            if (below === 0) {
              grid[r + 1][c] = cell;
              grid[r][c] = 0;
              continue;
            }

            let dirs = [
              {dr: -1, dc: 0},
              {dr: 1, dc: 0},
              {dr: 0, dc: -1},
              {dr: 0, dc: 1}
            ];
            shuffleArray(dirs);

            for (let d of dirs) {
              let nr = r + d.dr;
              let nc = c + d.dc;

              if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

              let neighbor = grid[nr][nc];
              let ok = false;

              if (neighbor === 0) ok = true;
              else if (isCellObj(neighbor)) {
                if (neighbor.type === "pink" || neighbor.type === "brown") ok = true;
              } else {
                ok = true;
              }

              if (isCellObj(neighbor) && (neighbor.type === "grey" || neighbor.wire)) ok = false;

              if (ok) {
                let tmp = grid[nr][nc];
                grid[nr][nc] = cell;
                grid[r][c] = tmp;
                break;
              }
            }

            if (!cell.birth) cell.birth = p.millis();

            if (p.millis() - cell.birth >= effectiveLifetime) {

              let dirs2 = [
                {dr: -1, dc: 0},
                {dr: 1, dc: 0},
                {dr: 0, dc: -1},
                {dr: 0, dc: 1}
              ];
              shuffleArray(dirs2);

              for (let d of dirs2) {
                let nr = r + d.dr;
                let nc = c + d.dc;

                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (grid[nr][nc] === 0) {
                  grid[nr][nc] = {
                    type: "brown",
                    col: p.random(BROWN_VARIANTS),
                    fixed: true,
                    birth: p.millis()
                  };
                  break;
                }
              }

              cell.birth = p.millis();
            }

            continue;
          }

          // --- PINK (HERBE) ---
          if (isCellObj(cell) && cell.type === "pink") {
            let below = grid[r + 1][c];

            if (!cell.fixed && below === 0) {
              grid[r + 1][c] = cell;
              grid[r][c] = 0;
              continue;
            }

            if (!cell.fixed) {
              if (isLightRock(below)) {
                cell.fixed = true;
                cell.spreadCount = 0;
              } else {
                grid[r][c] = 0;
                continue;
              }
            }

            if (cell.fixed && cell.spreadCount < 3 && p.random(1) < 0.02) {
              let nr = r - 1;
              let nc = c + p.floor(p.random(-1, 2));
              if (nr >= 0 && nc >= 0 && nc < cols && grid[nr][nc] === 0) {
                grid[nr][nc] = {
                  type: "pink",
                  col: p.random(PINK_VARIANTS),
                  life: 255,
                  fixed: true,
                  spreadCount: cell.spreadCount + 1
                };
                cell.spreadCount++;
              }
            }

            cell.life -= 0.0000005;
            if (cell.life <= 0) grid[r][c] = 0;

            continue;
          }

          // --- GREY (PYLÔNE) ---
          if (isCellObj(cell) && cell.type === "grey") {

            if (cell.wire) continue;

            let below = grid[r + 1][c];

            if (!cell.fixed && below === 0) {
              grid[r + 1][c] = cell;
              grid[r][c] = 0;
              continue;
            }

            if (!cell.fixed) {
              cell.fixed = true;
              continue;
            }

            continue;
          }

          // --- WOOD (ARBRE) ---
          if (isCellObj(cell) && cell.type === "wood") {

            let below = grid[r + 1][c];

            if (!cell.fixed && below === 0) {
              grid[r + 1][c] = cell;
              grid[r][c] = 0;
              continue;
            }

            if (!cell.fixed) {
              cell.fixed = true;
              cell.leafCount = 0;
              cell.lastLeafTime = p.millis();
              cell.birth = p.millis();
              continue;
            }

            if (p.millis() - cell.birth > 1000) {
              continue;
            }

            let LEAF_DELAY = 6;
            let MAX_LEAVES = 50;

            if (cell.leafCount < MAX_LEAVES &&
                p.millis() - cell.lastLeafTime > LEAF_DELAY &&
                p.random(1) < 0.05) {

              let dirs = [];
              for (let dr = -3; dr <= 0; dr++) {
                for (let dc = -3; dc <= 3; dc++) {
                  if (dr*dr + dc*dc <= 9) {
                    dirs.push({dr, dc});
                  }
                }
              }
              shuffleArray(dirs);

              for (let d of dirs) {
                let nr = r + d.dr;
                let nc = c + d.dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 0) {

                  grid[nr][nc] = {
                    type: "leaf",
                    col: p.random(LEAF_VARIANTS),
                    life: 255
                  };

                  cell.leafCount++;
                  cell.lastLeafTime = p.millis();
                  break;
                }
              }
            }

            continue;
          }

          // --- LEAF (FEUILLES) ---
          if (isCellObj(cell) && cell.type === "leaf") {
            cell.life -= 0.02;
            if (cell.life <= 0) grid[r][c] = 0;
            continue;
          }

          // --- FIRE (FEU) ---
          if (isCellObj(cell) && cell.type === "fire") {

            let dirs = [
              {dr:-1, dc:0}, {dr:1, dc:0},
              {dr:0, dc:-1}, {dr:0, dc:1}
            ];

            for (let d of dirs) {
              let nr = r + d.dr;
              let nc = c + d.dc;
              if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

              let other = grid[nr][nc];

              if (isCellObj(other) &&
                  (other.type === "wood" || other.type === "leaf")) {

                if (p.random() < 0.2) {
                  grid[nr][nc] = {
                    type:"fire",
                    life: 120
                  };
                }
              }
            }

            cell.life -= 2;
            if (cell.life <= 0) {
              grid[r][c] = 0;
            }

            continue;
          }

          // --- MANIFESTANT ---
          if (isCellObj(cell) && cell.type === "manifest") {
            handleManifestant(r, c, cell);
            continue;
          }

          // --- AUTO (MONTAGNE) ---
          let val = cell;

          if (grid[r + 1][c] === 0) {
            grid[r + 1][c] = val;
            grid[r][c] = 0;
          } else {
            if (p.random(1) < 0.5) {
              if (c > 0 && grid[r + 1][c - 1] === 0) {
                grid[r + 1][c - 1] = val;
                grid[r][c] = 0;
              } else if (c < cols - 1 && grid[r + 1][c + 1] === 0) {
                grid[r + 1][c + 1] = val;
                grid[r][c] = 0;
              }
            } else {
              if (c < cols - 1 && grid[r + 1][c + 1] === 0) {
                grid[r + 1][c + 1] = val;
                grid[r][c] = 0;
              } else if (c > 0 && grid[r + 1][c - 1] === 0) {
                grid[r + 1][c - 1] = val;
                grid[r][c] = 0;
              }
            }
          }
        }
      }

      // --- FILS ÉLECTRIQUES ---
      let pillars = getGreyPillars();
      if (pillars.length >= 2) {
        pillars.sort((a,b)=>a.c - b.c);
        connectPillars(pillars);
      }
    }

    // ============================================================================
    //  AFFICHAGE
    // ============================================================================
    function drawGrid() {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

          let cell = grid[r][c];
          if (cell === 0) continue;

          if (isCellObj(cell)) {
            if (cell.type === "pink") p.fill(cell.col);
            else if (cell.type === "grey") p.fill(cell.col || p.color(180));
            else if (cell.type === "brown") p.fill(cell.col);
            else if (cell.type === "manifest") p.fill(cell.col);
            else if (cell.type === "wood") p.fill(cell.col);
            else if (cell.type === "leaf") p.fill(cell.col);
            else if (cell.type === "fire") p.fill(255, p.random(100,180), 30);
            else if (cell.wire) p.fill(cell.col || p.color(200));
            else p.fill(cell.col || p.color(200));
          } else {
            p.fill(cell);
          }

          p.rect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }

    // ============================================================================
    //  PINCEAUX AVEC SONS
    // ============================================================================
    function playBrushSound(sound) {
      if (!sound) {
        console.log('⚠️ Son non chargé');
        return;
      }
      
      if (p.millis() - lastSoundTime > soundCooldown) {
        if (sound.isLoaded()) {
          sound.setVolume(0.3);
          sound.play();
          lastSoundTime = p.millis();
          console.log('🔊 Son joué');
        } else {
          console.log('⚠️ Son pas encore chargé');
        }
      }
    }

    function paintBrush(row, col) {

      // --- BROWN ---
      if (brushCategory === "brown") {

        if (p.millis() - lastBrownDropTime >= brownCooldown) {

          grid[row][col] = {
            type: "brown",
            col: p.random(BROWN_VARIANTS),
            fixed: true,
            birth: p.millis()
          };

          playBrushSound(soundBrown);
          lastBrownDropTime = p.millis();
        }
        return;
      }

      // --- PINK ---
      if (brushCategory === "pink") {
        let size = brushSizePink;

        for (let dr = -size; dr <= size; dr++) {
          for (let dc = -size; dc <= size; dc++) {
            if (dr * dr + dc * dc <= size * size) {
              let r = row + dr;
              let c = col + dc;
              if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = {
                  type: "pink",
                  col: p.random(PINK_VARIANTS),
                  life: 255,
                  fixed: false
                };
              }
            }
          }
        }
        playBrushSound(soundPink);
        return;
      }

      // --- GREY ---
      if (brushCategory === "grey") {

        if (p.millis() - lastGreyDropTime >= greyCooldown) {
          for (let i = 0; i < 10; i++) {
            let r = row - i;
            if (r >= 0 && grid[r][col] === 0) {
              grid[r][col] = {
                type: "grey",
                col: p.color(180),
                fixed: false
              };
            }
          }
          playBrushSound(soundGrey);
          lastGreyDropTime = p.millis();
        }
        return;
      }

      // --- WOOD ---
      if (brushCategory === "wood") {

        if (p.millis() - lastWoodDropTime >= woodCooldown) {
          for (let i = 0; i < 10; i++) {
            let r = row - i;
            if (r >= 0 && grid[r][col] === 0) {
              grid[r][col] = {
                type: "wood",
                col: p.random(WOOD_VARIANTS),
                fixed: false
              };
            }
          }

          playBrushSound(soundWood);
          lastWoodDropTime = p.millis();
        }
        return;
      }

      // --- MANIFESTANT ---
      if (brushCategory === "manifest") {
        let size = brushSizeManifest;

        for (let dr = -size; dr <= size; dr++) {
          for (let dc = -size; dc <= size; dc++) {
            if (dr * dr + dc * dc <= size * size) {
              let r = row + dr;
              let c = col + dc;
              if (r >= 0 && r < rows && c >= 0 && c < cols) {
                grid[r][c] = {
                  type: "manifest",
                  col: p.random(MANIFEST_VARIANTS)
                };
              }
            }
          }
        }
        playBrushSound(soundManifest);
        return;
      }

      // --- AUTO ---
      let size = brushSizeAuto;
      let colorPick = getBrushColor();

      for (let dr = -size; dr <= size; dr++) {
        for (let dc = -size; dc <= size; dc++) {
          if (dr * dr + dc * dc <= size * size) {
            let r = row + dr;
            let c = col + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              grid[r][c] = colorPick;
            }
          }
        }
      }
      playBrushSound(soundAuto);
    }

    // ============================================================================
    //  COULEUR AUTO (avec assombrissement par pylônes)
    // ============================================================================
    function getBrushColor() {
      let nGrey = countGreyPillars();
      let darkFactor = p.max(0.2, 1 - nGrey * 0.008);

      let y = p.mouseY;
      let base;

      if (y < p.height / 3) {
        base = p.color(p.random(220, 255));
      } else if (y < (2 * p.height) / 3) {
        base = p.color(p.random(ROCK_LIGHT_MIN, ROCK_LIGHT_MAX));
      } else {
        base = p.color(p.random(60, 120));
      }

      let r = p.red(base) * darkFactor;
      let g = p.green(base) * darkFactor;
      let b = p.blue(base) * darkFactor;

      return p.color(r, g, b);
    }

    // ============================================================================
    //  SUPPORT PINK
    // ============================================================================
    function isLightRock(val) {
      if (val === 0 || val === null || val === undefined) return false;

      if (isCellObj(val)) {

        if (val.type === "pink") return false;
        if (val.type === "grey") return true;
        if (val.wire) return true;

        if (val.col) {
          let v = p.red(val.col);
          if (v >= 220) return false;
          return true;
        }

        return false;
      }

      let v;
      try { v = p.red(val); } catch { v = NaN; }
      if (isNaN(v)) return false;
      if (v >= 220) return false;
      return true;
    }

    // ============================================================================
    //  POTEAUX + FILS
    // ============================================================================
    function getGreyPillars() {
      let out = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let cell = grid[r][c];
          if (isCellObj(cell) && cell.type === "grey" && cell.fixed) {

            let isAboveGrey = false;
            if (r > 0) {
              let above = grid[r - 1][c];
              if (isCellObj(above) && above.type === "grey") isAboveGrey = true;
            }

            if (!isAboveGrey) out.push({ r, c });
          }
        }
      }
      return out;
    }

    function connectPillars(pillars) {

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let cell = grid[r][c];
          if (isCellObj(cell) && cell.wire) grid[r][c] = 0;
        }
      }

      for (let i = 0; i < pillars.length - 1; i++) {

        let A = pillars[i];
        let B = pillars[i + 1];

        let r1 = A.r, c1 = A.c;
        let r2 = B.r, c2 = B.c;

        let dx = p.abs(c2 - c1);
        let sag = p.max(2, dx * 0.15);

        let steps = p.max(p.abs(dx), p.abs(r2 - r1));
        if (steps <= 0) continue;

        for (let s = 0; s <= steps; s++) {
          let t = s / steps;

          let cc = p.lerp(c1, c2, t);
          let baseR = p.lerp(r1, r2, t);
          let rr = baseR + sag * p.sin(p.PI * t);

          rr = p.floor(rr);
          cc = p.floor(cc);

          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc] === 0) {
            grid[rr][cc] = {
              wire: true,
              fixed: true,
              col: p.color(200)
            };
          }
        }
      }
    }

    // ============================================================================
    //  BOUTONS + BOUTON FIN
    // ============================================================================
    function drawButtons() {

      p.textFont(uiFont);
      
      p.fill( brushCategory === "auto" ? "#48669aff" : "#48669a77" );
      p.rect(10, 10, 90, 25, 5);
      p.fill( brushCategory === "auto" ? "white" : "white");
      p.textSize(17);
      p.text("montagne", 12, 28);

      p.fill( brushCategory === "pink" ? "#d39affff"  : "#d39aff82" );
      p.rect(110, 10, 70, 25, 5);
      p.fill( brushCategory === "pink" ? "white" : "white");
      p.text("herbe", 120, 28);

      p.fill( brushCategory === "grey" ? "#586160ff"  : "#58616083" );
      p.rect(190, 10, 80, 25, 5);
      p.fill( brushCategory === "grey" ?  "white" : "white");
      p.text("pylone", 200, 28);

      p.fill( brushCategory === "brown" ? "#460808ff" : "#4608087b" );
      p.rect(280, 10, 85, 25, 5);
      p.fill( brushCategory === "brown" ? "white" : "white" );
      p.text("scolyte", 288 , 28);

      p.fill( brushCategory === "wood" ? "#286f29ff" : "#286f2979" );
      p.rect(375, 10, 75, 25, 5);
      p.fill( brushCategory === "wood" ? "white" : "white" );
      p.text("arbre", 387, 28);

      p.fill( brushCategory === "manifest" ? "#ff63acff" : "#ff63ac7f" );
      p.rect(460, 10, 90, 25, 5);
      p.fill( brushCategory === "manifest" ? "white" : "white" );
      p.text("manifs", 475, 28);

      // BOUTON FIN
      p.fill("#ffffffff");
      p.rect(p.width - 110, 10, 100, 25, 5);
      p.fill(0);
      p.text("TERMINER", p.width - 100, 28);
    }

    p.mousePressed = function() {
      if (p.mouseY < 40) {
        if (p.mouseX > 10 && p.mouseX < 100) brushCategory = "auto";
        if (p.mouseX > 110 && p.mouseX < 180) brushCategory = "pink";
        if (p.mouseX > 190 && p.mouseX < 270) brushCategory = "grey";
        if (p.mouseX > 280 && p.mouseX < 365) brushCategory = "brown";
        if (p.mouseX > 375 && p.mouseX < 450) brushCategory = "wood";
        if (p.mouseX > 460 && p.mouseX < 550) brushCategory = "manifest";
        
        // BOUTON FIN CLIQUÉ
        if (p.mouseX > p.width - 110 && p.mouseX < p.width - 10) {
          endGame();
        }
      }
    };

    // ============================================================================
    //  FIN DU JEU
    // ============================================================================
        function endGame() {
      gameEnded = true;

      // Compter tous les éléments
      let counts = {
        mountain: 0,
        pink: 0,
        grey: 0,
        brown: 0,
        wood: 0,
        manifest: 0
      };

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let cell = grid[r][c];
          
          if (cell === 0) continue;

          if (isCellObj(cell)) {
            if (cell.type === "pink") counts.pink++;
            else if (cell.type === "grey" || cell.wire) counts.grey++;
            else if (cell.type === "brown") counts.brown++;
            else if (cell.type === "wood" || cell.type === "leaf") counts.wood++;
            else if (cell.type === "manifest") counts.manifest++;
          } else {
            counts.mountain++;
          }
        }
      }

      console.log('📊 Comptage final:', counts);

      // Appeler la fonction d'écran de fin avec les comptes
      if (typeof showEndScreen === 'function') {
        showEndScreen(counts);
      } else {
        console.error('❌ showEndScreen() non trouvée dans script.js');
      }
    }

    // ============================================================================
    //  OUTILS
    // ============================================================================
    function isCellObj(v) {
      return (typeof v === "object" &&
              (v.type !== undefined || v.wire !== undefined || v.col !== undefined));
    }

    function create2DArray(r, c) {
      let arr = [];
      for (let i = 0; i < r; i++) {
        arr[i] = [];
        for (let j = 0; j < c; j++) arr[i][j] = 0;
      }
      return arr;
    }

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = p.floor(p.random(i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    p.keyPressed = function() {
      if (p.key === 'c' || p.key === 'C') {
        grid = create2DArray(rows, cols);
      }

      if (p.keyCode === p.UP_ARROW) {
        if (brushCategory === "auto") brushSizeAuto = p.min(20, brushSizeAuto + 1);
        else if (brushCategory === "pink") brushSizePink = p.min(20, brushSizePink + 1);
        else if (brushCategory === "grey") brushSizeGrey = p.min(20, brushSizeGrey + 1);
        else if (brushCategory === "wood") brushSizeWood = p.min(20, brushSizeWood + 1);
        else if (brushCategory === "manifest") brushSizeManifest = p.min(20, brushSizeManifest + 1);
      }

      if (p.keyCode === p.DOWN_ARROW) {
        if (brushCategory === "auto") brushSizeAuto = p.max(1, brushSizeAuto - 1);
        else if (brushCategory === "pink") brushSizePink = p.max(1, brushSizePink - 1);
        else if (brushCategory === "grey") brushSizeGrey = p.max(1, brushSizeGrey - 1);
        else if (brushCategory === "wood") brushSizeWood = p.max(1, brushSizeWood - 1);
        else if (brushCategory === "manifest") brushSizeManifest = p.max(1, brushSizeManifest - 1);
      }
    };

    function countGreyPillars() {
      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let cell = grid[r][c];
          if (isCellObj(cell) && cell.type === "grey" && cell.fixed) {
            count++;
          }
        }
      }
      return count;
    }

    // ============================================================================
    //  MANIFESTANTS
    // ============================================================================
    function explodeAt(r, c, radius) {
      for (let rr = r - radius; rr <= r + radius; rr++) {
        for (let cc = c - radius; cc <= c + radius; cc++) {
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          let cell = grid[rr][cc];
          if (!isCellObj(cell)) continue;
          if (cell.type === "grey" || cell.wire) {
            grid[rr][cc] = 0;
          }
        }
      }
    }

    function isTerrain(val) {
      if (val === 0) return false;
      if (isCellObj(val)) {
        if (val.type === "grey" || val.wire || val.type === "brown" || val.type === "manifest") return false;
        return true;
      }
      return true;
    }

  function handleManifestant(r, c, cell) {

  // --- Explose si touche pylône ou câble ---
  const dangerDirs = [
    { dr: 0, dc: 0 },
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 }
  ];

  for (let d of dangerDirs) {
    let nr = r + d.dr;
    let nc = c + d.dc;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

    let neighbor = grid[nr][nc];

    if (isCellObj(neighbor) && (neighbor.type === "grey" || neighbor.wire)) {
      explodeAt(r, c, 8);
      grid[r][c] = 0;
      return;
    }
  }

  // --- Déplacements "grouillant" comme les scolytes ---
  // Ils bougent dans toutes les directions, y compris sur autres manifestants
  let moveDirs = [
    { dr: -1, dc: 0 },  // haut
    { dr: 1, dc: 0 },   // bas
    { dr: 0, dc: -1 },  // gauche
    { dr: 0, dc: 1 },   // droite
    { dr: -1, dc: -1 }, // diag haut gauche
    { dr: -1, dc: 1 },  // diag haut droite
    { dr: 1, dc: -1 },  // diag bas gauche
    { dr: 1, dc: 1 }    // diag bas droite
  ];

  shuffleArray(moveDirs);

  for (let d of moveDirs) {
    let nr = r + d.dr;
    let nc = c + d.dc;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

    // case vide : déplacement immédiat
    if (grid[nr][nc] === 0) {
      grid[nr][nc] = cell;
      grid[r][c] = 0;
      return;
    }

    // case occupée par un autre manifestant → ils peuvent se "marcher dessus"
    if (isCellObj(grid[nr][nc]) && grid[nr][nc].type === "manifestant") {
      // échange de positions → effet grouillant
      let tmp = grid[nr][nc];
      grid[nr][nc] = cell;
      grid[r][c] = tmp;
      return;
    }
  }

  // s'il ne peut rien faire → il reste en place
}





  }; // Fin du return function(p)
} // Fin de createGameSketch