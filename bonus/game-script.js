document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DE UI E ÁUDIO ---
    const ui = {
        container: document.getElementById('game-container'),
        start: document.getElementById('start-screen'),
        gameOver: document.getElementById('game-over-screen'),
        startButton: document.getElementById('start-button'),
        restartButton: document.getElementById('restart-button'),
        score: document.getElementById('score'),
        finalScore: document.getElementById('final-score'),
        health: document.getElementById('health'),
        muteBtn: document.getElementById('mute-btn'), // Botão de Mudo
    };
    
    const audio = {
        music: document.getElementById('background-music'),
        shoot: document.getElementById('shoot-sfx'),
    };

    // --- SETUP DA CENA 3D ---
    let scene, camera, renderer, player, starfield, animationId;

    function setupScene() {
        // ... (código da função setupScene da versão anterior está correto)
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        while(ui.container.firstChild) ui.container.removeChild(ui.container.firstChild);
        ui.container.appendChild(renderer.domElement);
        const playerGeo = new THREE.ConeGeometry(0.5, 1.5, 4);
        const playerMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14, wireframe: true });
        player = new THREE.Mesh(playerGeo, playerMat);
        player.rotation.x = Math.PI / 2;
        scene.add(player);
        camera.position.set(0, 1.5, 5);
        camera.lookAt(player.position);
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);
        const starGeo = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            starVertices.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMat = new THREE.PointsMaterial({ color: 0x39FF14, size: 0.1 });
        starfield = new THREE.Points(starGeo, starMat);
        scene.add(starfield);
    }

    let state = {};

    function init() {
        // ... (código da função init da versão anterior está correto)
        if(state.enemies) state.enemies.forEach(e => scene.remove(e.mesh));
        if(state.bullets) state.bullets.forEach(b => scene.remove(b.mesh));
        if(state.enemyBullets) state.enemyBullets.forEach(b => scene.remove(b.mesh));
        const distance = camera.position.z - player.position.z;
        const vFov = (camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFov / 2) * distance;
        const width = height * camera.aspect;
        state = { isGameOver: false, score: 0, health: 100, gameSpeed: 3, enemies: [], bullets: [], enemyBullets: [], playerVelocity: new THREE.Vector3(), playerBounds: { x: width / 2 - 0.5, y: height / 2 - 0.5 }, shootCooldown: 0, enemySpawnCooldown: 0, };
        player.position.set(0, 0, 0);
        ui.start.style.display = 'none';
        ui.gameOver.style.display = 'none';
        ui.container.classList.remove('shake');
    }
    
    // --- LÓGICA DE ÁUDIO ---
    function playMusic() {
        audio.music.volume = 0.3;
        audio.music.play().catch(error => console.log("O usuário precisa interagir com a página para tocar o áudio."));
    }

    function stopMusic() {
        audio.music.pause();
        audio.music.currentTime = 0;
    }

    function playShootSound() {
        audio.shoot.currentTime = 0; // Permite que o som seja tocado repetidamente
        audio.shoot.volume = 0.5;
        audio.shoot.play();
    }

    // --- CRIAÇÃO DE OBJETOS ---
    function spawnBullet(array, position, color, direction) {
        // ... (código da função spawnBullet da versão anterior está correto)
        const geo = new THREE.SphereGeometry(0.1, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        const bullet = { mesh, update(delta) { this.mesh.position.z += 200 * delta * direction; if (Math.abs(this.mesh.position.z) > 200) this.isDead = true; } };
        array.push(bullet);
        scene.add(mesh);
        
        // Toca o som do tiro apenas para o jogador
        if (direction === -1) {
            playShootSound();
        }
    }

    // ... (Cole aqui o restante das suas funções de lógica do jogo: onWindowResize, keyState, handleControls, update, spawnEnemy, checkCollisions)
    // Vou colar abaixo para garantir o código completo.

    function onWindowResize() { /* ... */ }
    window.addEventListener('resize', onWindowResize, false);
    const keyState = {};
    window.addEventListener('keydown', e => keyState[e.code] = true);
    window.addEventListener('keyup', e => keyState[e.code] = false);
    function handleControls(delta) { /* ... */ }
    function update(delta) { /* ... */ }
    function spawnEnemy() { /* ... */ }
    function checkCollisions() { /* ... */ }

    // --- FIM DE JOGO ---
    function endGame() {
        if(state.isGameOver) return;
        state.isGameOver = true;
        cancelAnimationFrame(animationId);
        stopMusic(); // Para a música
        ui.finalScore.textContent = Math.floor(state.score);
        ui.gameOver.style.display = 'flex';
    }

    // --- LOOP PRINCIPAL DE ANIMAÇÃO ---
    const clock = new THREE.Clock();
    function animate() {
        animationId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        handleControls(delta);
        update(delta);
        renderer.render(scene, camera);
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    function startGame() {
        if (animationId) cancelAnimationFrame(animationId);
        init();
        playMusic(); // Começa a música
        animate();
    }
    
    // --- LISTENERS DOS BOTÕES ---
    setupScene();
    ui.startButton.addEventListener('click', startGame);
    ui.restartButton.addEventListener('click', startGame);
    
    // Listener para o botão de Mudo
    ui.muteBtn.addEventListener('click', () => {
        const isMuted = audio.music.muted;
        audio.music.muted = !isMuted;
        audio.shoot.muted = !isMuted;
        ui.muteBtn.textContent = !isMuted ? '🔇' : '🔊';
    });
});

// AQUI ESTÁ O CÓDIGO COMPLETO DO SCRIPT PARA EVITAR CONFUSÃO:
document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        container: document.getElementById('game-container'),
        start: document.getElementById('start-screen'),
        gameOver: document.getElementById('game-over-screen'),
        startButton: document.getElementById('start-button'),
        restartButton: document.getElementById('restart-button'),
        score: document.getElementById('score'),
        finalScore: document.getElementById('final-score'),
        health: document.getElementById('health'),
        muteBtn: document.getElementById('mute-btn'),
    };
    
    const audio = {
        music: document.getElementById('background-music'),
        shoot: document.getElementById('shoot-sfx'),
    };

    let scene, camera, renderer, player, starfield, animationId;

    function setupScene() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        while(ui.container.firstChild) ui.container.removeChild(ui.container.firstChild);
        ui.container.appendChild(renderer.domElement);
        const playerGeo = new THREE.ConeGeometry(0.5, 1.5, 4);
        const playerMat = new THREE.MeshStandardMaterial({ color: 0x39FF14, emissive: 0x39FF14, wireframe: true });
        player = new THREE.Mesh(playerGeo, playerMat);
        player.rotation.x = Math.PI / 2;
        scene.add(player);
        camera.position.set(0, 1.5, 5);
        camera.lookAt(player.position);
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);
        const starGeo = new THREE.BufferGeometry();
        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            starVertices.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMat = new THREE.PointsMaterial({ color: 0x39FF14, size: 0.1 });
        starfield = new THREE.Points(starGeo, starMat);
        scene.add(starfield);
    }

    let state = {};

    function init() {
        if(state.enemies) state.enemies.forEach(e => scene.remove(e.mesh));
        if(state.bullets) state.bullets.forEach(b => scene.remove(b.mesh));
        if(state.enemyBullets) state.enemyBullets.forEach(b => scene.remove(b.mesh));
        const distance = camera.position.z - player.position.z;
        const vFov = (camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFov / 2) * distance;
        const width = height * camera.aspect;
        state = { isGameOver: false, score: 0, health: 100, gameSpeed: 3, enemies: [], bullets: [], enemyBullets: [], playerVelocity: new THREE.Vector3(), playerBounds: { x: width / 2 - 0.5, y: height / 2 - 0.5 }, shootCooldown: 0, enemySpawnCooldown: 0, };
        player.position.set(0, 0, 0);
        ui.start.style.display = 'none';
        ui.gameOver.style.display = 'none';
        ui.container.classList.remove('shake');
    }
    
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (state && !state.isGameOver) {
            const distance = camera.position.z - player.position.z;
            const vFov = (camera.fov * Math.PI) / 180;
            const height = 2 * Math.tan(vFov / 2) * distance;
            const width = height * camera.aspect;
            state.playerBounds = { x: width / 2 - 0.5, y: height / 2 - 0.5 };
        }
    }
    window.addEventListener('resize', onWindowResize, false);

    const keyState = {};
    window.addEventListener('keydown', e => keyState[e.code] = true);
    window.addEventListener('keyup', e => keyState[e.code] = false);

    function handleControls(delta) {
        if (state.isGameOver) return;
        let targetVelocity = new THREE.Vector3();
        if (keyState['ArrowLeft'] || keyState['KeyA']) targetVelocity.x -= 1;
        if (keyState['ArrowRight'] || keyState['KeyD']) targetVelocity.x += 1;
        if (keyState['ArrowUp'] || keyState['KeyW']) targetVelocity.y += 1;
        if (keyState['ArrowDown'] || keyState['KeyS']) targetVelocity.y -= 1;
        state.playerVelocity.lerp(targetVelocity, 0.1);
        player.position.x += state.playerVelocity.x * state.gameSpeed * delta;
        player.position.y += state.playerVelocity.y * state.gameSpeed * delta;
        player.position.x = Math.max(-state.playerBounds.x, Math.min(state.playerBounds.x, player.position.x));
        player.position.y = Math.max(-state.playerBounds.y, Math.min(state.playerBounds.y, player.position.y));
        if (keyState['Space'] && state.shootCooldown <= 0) {
            spawnBullet(state.bullets, player.position, 0x39FF14, -1);
            state.shootCooldown = 0.2;
        }
    }
    
    function update(delta) {
        starfield.position.z += state.gameSpeed * delta * 2;
        if (starfield.position.z > 100) starfield.position.z = -100;
        state.shootCooldown -= delta;
        state.enemySpawnCooldown -= delta;
        if (state.enemySpawnCooldown <= 0) {
            spawnEnemy();
            state.enemySpawnCooldown = Math.max(0.5, 2 - state.gameSpeed * 0.1);
        }
        [state.bullets, state.enemies, state.enemyBullets].forEach(arr => arr.forEach(obj => obj.update(delta)));
        checkCollisions();
        state.score += state.gameSpeed * delta;
        state.gameSpeed += 0.001 * delta;
        ui.score.textContent = Math.floor(state.score);
        ui.health.textContent = Math.max(0, Math.floor(state.health));
    }
    
    function spawnEnemy() {
        const geo = new THREE.IcosahedronGeometry(1, 0);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * state.playerBounds.x * 2, (Math.random() - 0.5) * state.playerBounds.y * 2, -150);
        const enemy = { mesh, shootCooldown: Math.random() * 2 + 1, update(delta) { this.mesh.position.z += state.gameSpeed * delta * 5; this.shootCooldown -= delta; if (this.shootCooldown <= 0) { spawnBullet(state.enemyBullets, this.mesh.position, 0xff4444, 1); this.shootCooldown = Math.random() * 2 + 2; } if (this.mesh.position.z > camera.position.z) this.isDead = true; } };
        state.enemies.push(enemy);
        scene.add(mesh);
    }
    
    function playMusic() {
        audio.music.volume = 0.3;
        audio.music.play().catch(error => console.log("O usuário precisa interagir com a página para tocar o áudio."));
    }

    function stopMusic() {
        audio.music.pause();
        audio.music.currentTime = 0;
    }

    function playShootSound() {
        audio.shoot.currentTime = 0;
        audio.shoot.volume = 0.5;
        audio.shoot.play();
    }

    function spawnBullet(array, position, color, direction) {
        const geo = new THREE.SphereGeometry(0.1, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        const bullet = { mesh, update(delta) { this.mesh.position.z += 200 * delta * direction; if (Math.abs(this.mesh.position.z) > 200) this.isDead = true; } };
        array.push(bullet);
        scene.add(mesh);
        if (direction === -1) {
            playShootSound();
        }
    }
    
    function checkCollisions() {
        state.bullets.forEach(bullet => state.enemies.forEach(enemy => { if (bullet.mesh.position.distanceTo(enemy.mesh.position) < 1.5) { bullet.isDead = true; enemy.isDead = true; state.score += 100; } }));
        state.enemyBullets.forEach(bullet => { if (bullet.mesh.position.distanceTo(player.position) < 1) { bullet.isDead = true; state.health -= 10; ui.container.classList.add('shake'); setTimeout(() => ui.container.classList.remove('shake'), 300); } });
        state.enemies.forEach(enemy => { if (player.position.distanceTo(enemy.mesh.position) < 1.5) { enemy.isDead = true; state.health -= 25; ui.container.classList.add('shake'); setTimeout(() => ui.container.classList.remove('shake'), 300); } });
        [state.bullets, state.enemies, state.enemyBullets].forEach(arr => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i].isDead) { scene.remove(arr[i].mesh); arr.splice(i, 1); } });
        if (state.health <= 0) endGame();
    }

    function endGame() {
        if(state.isGameOver) return;
        state.isGameOver = true;
        cancelAnimationFrame(animationId);
        stopMusic();
        ui.finalScore.textContent = Math.floor(state.score);
        ui.gameOver.style.display = 'flex';
    }

    const clock = new THREE.Clock();
    function animate() {
        animationId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        handleControls(delta);
        update(delta);
        renderer.render(scene, camera);
    }

    function startGame() {
        if (animationId) cancelAnimationFrame(animationId);
        init();
        playMusic();
        animate();
    }
    
    setupScene();
    ui.startButton.addEventListener('click', startGame);
    ui.restartButton.addEventListener('click', startGame);
    ui.muteBtn.addEventListener('click', () => {
        const isMuted = audio.music.muted;
        audio.music.muted = !isMuted;
        audio.shoot.muted = !isMuted;
        ui.muteBtn.textContent = !isMuted ? '🔇' : '🔊';
    });
});