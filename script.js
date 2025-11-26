// Dialogues de l'introduction
const dialogues = [
    "À 3 200 m d'altitude. Le vent mord, le silence règne...",
    "À tes pieds, le glacier de la Girose. Un territoire de beauté fragile, partagé entre la grandeur des montagnes et la main de l'homme",
    "Car vois-tu, un troisième tronçon de téléphérique reste en construction.",
];

// Dialogues de fin (seront définis dynamiquement selon les actions du joueur)
let endDialogues = [];
let currentEndDialogueIndex = 0;

let currentDialogueIndex = 0;
let currentCharIndex = 0;
let isTyping = false;
let typingSpeed = 50;

// Éléments du DOM
const videoIntro = document.getElementById('video-intro');
const introVideo = document.getElementById('intro-video');
const clickToStart = document.getElementById('click-to-start');
const backgroundMusic = document.getElementById('background-music');
const endMusic = document.getElementById('end-music');
const overlay = document.getElementById('intro-overlay');
const dialogText = document.getElementById('dialog-text');
const nextBtn = document.getElementById('next-btn');

// Variables pour gérer l'état
let musicStarted = false;
let dialoguesStarted = false;
let gameStarted = false;
let isEndingSequence = false;

// Fonction pour démarrer la musique
function startMusic() {
    if (!musicStarted) {
        backgroundMusic.play().catch(err => {
            console.log('Lecture audio bloquée par le navigateur:', err);
        });
        musicStarted = true;
    }
}

// Fonction pour démarrer les dialogues
function startDialogueIntro() {
    if (dialoguesStarted) return;
    dialoguesStarted = true;

    overlay.classList.add('active');
    typeText(dialogues[0]);
}

// Fonction pour afficher le texte lettre par lettre
function typeText(text, callback) {
    isTyping = true;
    nextBtn.disabled = true;
    dialogText.textContent = '';
    currentCharIndex = 0;

    const typeInterval = setInterval(() => {
        if (currentCharIndex < text.length) {
            dialogText.textContent += text[currentCharIndex];
            currentCharIndex++;
        } else {
            clearInterval(typeInterval);
            isTyping = false;
            nextBtn.disabled = false;
            if (callback) callback();
        }
    }, typingSpeed);
}

// Fonction pour passer au dialogue suivant
function nextDialogue() {
    if (isTyping) {
        dialogText.textContent = dialogues[currentDialogueIndex];
        isTyping = false;
        nextBtn.disabled = false;
        return;
    }

    currentDialogueIndex++;

    if (currentDialogueIndex < dialogues.length) {
        typeText(dialogues[currentDialogueIndex]);
    } else {
        startGame();
    }
}

// Fonction pour passer au dialogue de fin suivant
function nextEndDialogue() {
    if (isTyping) {
        dialogText.textContent = endDialogues[currentEndDialogueIndex];
        isTyping = false;
        nextBtn.disabled = false;
        return;
    }

    currentEndDialogueIndex++;

    if (currentEndDialogueIndex < endDialogues.length) {
        typeText(endDialogues[currentEndDialogueIndex]);
    } else {
        // Fin des dialogues - afficher bouton recommencer
        nextBtn.innerHTML = '<span>🔄 RECOMMENCER</span>';
        nextBtn.onclick = function() {
            location.reload();
        };
    }
}

// Fonction pour démarrer le jeu
function startGame() {
    if (gameStarted) return;
    gameStarted = true;

    console.log('🎮 Démarrage du jeu...');

    overlay.classList.remove('active');
    videoIntro.classList.remove('active');
    
    if (musicStarted) {
        fadeOutAudio(backgroundMusic, 1000);
    }
    
    if (typeof createGameSketch === 'function') {
        const gameSketch = createGameSketch();
        window.myP5 = new p5(gameSketch);
        console.log('✅ Sketch p5.js lancé avec succès!');
    } else {
        console.error('❌ Erreur : createGameSketch() n\'est pas définie dans sketch.js');
    }
}

// Fonction pour faire un fondu de sortie sur l'audio
function fadeOutAudio(audio, duration) {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = audio.volume / steps;
    
    const fadeInterval = setInterval(() => {
        if (audio.volume > volumeStep) {
            audio.volume -= volumeStep;
        } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fadeInterval);
        }
    }, stepDuration);
}

// ============================================================================
//  ÉCRAN DE FIN AVEC DIALOGUES
// ============================================================================
function showEndScreen(counts) {
    console.log('📊 Affichage écran de fin avec dialogues');

    isEndingSequence = true;
    currentEndDialogueIndex = 0;

    // Arrêter la vidéo du jeu avec transition
    const bgVideo = document.getElementById('game-background-video');
    if (bgVideo) {
        bgVideo.style.transition = 'opacity 1s';
        bgVideo.style.opacity = '0';
        setTimeout(() => {
            bgVideo.style.display = 'none';
        }, 1000);
    }

    // Démarrer la musique de fin avec fondu
    if (endMusic) {
        endMusic.volume = 0;
        endMusic.currentTime = 0;
        endMusic.play().then(() => {
            console.log('✅ Musique de fin lancée');
            let vol = 0;
            const fadeIn = setInterval(() => {
                if (vol < 0.5) {
                    vol += 0.05;
                    endMusic.volume = vol;
                } else {
                    clearInterval(fadeIn);
                }
            }, 50);
        }).catch(err => {
            console.log('❌ Lecture musique de fin bloquée:', err);
        });
    }

    // Générer les dialogues de fin basés sur les actions du joueur
    endDialogues = generateEndDialogues(counts);

    // Attendre un peu avant d'afficher les dialogues
    setTimeout(() => {
        overlay.classList.add('active');
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        
        // Réinitialiser le bouton
        nextBtn.innerHTML = '<span>SUIVANT</span>';
        nextBtn.onclick = nextEndDialogue;
        
        // Afficher le premier dialogue
        typeText(endDialogues[0]);
    }, 500);
}

// ============================================================================
//  GÉNÉRER LES DIALOGUES DE FIN
// ============================================================================
function generateEndDialogues(counts) {
    let dialogues = [];
    
    // Dialogue d'introduction
    dialogues.push("Votre empreinte à façonné peu à peu ces paysages autrefois intouchés. ");
    
    // Analyser les actions du joueur
    let totalElements = counts.pink + counts.grey + counts.brown + counts.wood + counts.manifest;
    
    // Dialogue sur la montagne (base)
    if (counts.mountain > 10000) {
        dialogues.push("La montagne est restée préservée, sauvage et intacte.");
    } else if (counts.mountain > 5000) {
        dialogues.push("La montagne a été marquée par votre présence, mais reste reconnaissable.");
    } else {
        dialogues.push("La montagne a été profondément transformée par vos interventions.");
    }
    
    // Dialogue sur les pylônes
    if (counts.grey > 500) {
        dialogues.push("Les pylônes électriques dominent le paysage. Le progrès a un coût.");
    } else if (counts.grey > 100) {
        dialogues.push("Quelques lignes électriques traversent discrètement la vallée.");
    } else if (counts.grey > 0) {
        dialogues.push("Une infrastructure minimale a été installée.");
    }
    
    // Dialogue sur la végétation (herbe + arbres)
    if (counts.pink > 1000 || counts.wood > 500) {
        dialogues.push("La nature a repris ses droits. La végétation prospère.");
    } else if (counts.pink > 100 || counts.wood > 100) {
        dialogues.push("Des touches de verdure parsèment le paysage.");
    }
    
    // Dialogue sur les scolytes
    if (counts.brown > 500) {
        dialogues.push("Les scolytes ont proliféré. Un déséquilibre écologique menace l'écosystème.");
    } else if (counts.brown > 100) {
        dialogues.push("Une population de scolytes s'est installée dans la région.");
    }
    
    // Dialogue sur les manifestants
    if (counts.manifest > 200) {
        dialogues.push("La contestation sociale a marqué le territoire. Le conflit reste vif.");
    } else if (counts.manifest > 50) {
        dialogues.push("Des voix se sont élevées contre le développement.");
    }
    
    // Dialogue sur les arbres spécifiquement
    if (counts.wood > 500) {
        dialogues.push("Une forêt dense s'est développée, refuge pour la biodiversité.");
    }
    
    // Dialogue de conclusion selon l'équilibre général
    if (counts.grey > 500 && counts.manifest > 100) {
        dialogues.push("Le glacier est devenu un champ de bataille entre développement et préservation.");
    } else if (counts.wood > 300 && counts.pink > 500 && counts.grey < 100) {
        dialogues.push("Un équilibre harmonieux s'est créé. La nature et l'humain coexistent.");
    } else if (counts.grey > 300 && counts.pink < 100 && counts.wood < 100) {
        dialogues.push("Le béton et l'acier ont remplacé la nature. Un choix irréversible.");
    } else if (totalElements < 100) {
        dialogues.push("Le glacier demeure sauvage.");
    } else {
        dialogues.push("Chacunes de vos decisions a façonné ce paysage. Vous êtes acteur de l'avenir.");
    }
    
    // Dialogue final
    dialogues.push("La simulation est terminée.\n Depuis plusieurs années, la neige manque de plus en plus sur le glacier de Girose. En voie de disparition, les sommets enneigés connaissent une bétonisation accélérée depuis que les équipes de la SATA y ont commencé la construction du troisième tronçon du téléphérique de La Grave à La Meije. Pour stopper le chantier, une ZAD s’est installée à 3 500 mètres d’altitude. Construisez le monde dans lequel vous voulez vivre.");
    
    return dialogues;
}

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Page chargée');

    // Vérifier que les éléments audio existent
    if (!backgroundMusic) console.error('❌ backgroundMusic non trouvé');
    if (!endMusic) console.error('❌ endMusic non trouvé');

    clickToStart.addEventListener('click', () => {
        startMusic();
        startDialogueIntro();
    });

    videoIntro.addEventListener('click', (e) => {
        if (!dialoguesStarted) {
            startMusic();
            startDialogueIntro();
        }
    });
    
    nextBtn.addEventListener('click', nextDialogue);
    
    // Tenter de démarrer la musique (sera probablement bloqué)
    backgroundMusic.play().catch(() => {
        console.log('Autoplay bloqué - la musique démarrera au premier clic');
    });
});

// Fonction optionnelle pour permettre de skip l'intro (Échap)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (overlay.classList.contains('active') || !dialoguesStarted)) {
        if (!isEndingSequence) {
            startGame();
        }
    }
});