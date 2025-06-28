📁 RENDU TEXTURE 3D
├── precalculateTextureRectangles() → Calcule 600 rectangles UV une seule fois
├── render() → Boucle principale, stockage local textureRectangles
├── drawTransformedRectangle() → Projection perspective + extension gaps
└── bilinearInterpolation() → Subdivision adaptative pour vrais trapèzes


🔍 DÉCOUVERTES CLEFS
📦 STOCKAGE RECTANGLES
AVANT : Variable locale textureRectangles → inaccessible pour debug
APRÈS : Exposée via window.textureRectangles → analyse possible
🎯 MAPPING FACE→TEXTURE
Chaque face a originalIndex → correspondance directe avec rectangle texture
Grid position : gridU = originalIndex % MESH_U, gridV = Math.floor(originalIndex / MESH_U)
🔧 PROBLÈME GAPS CYLINDRE
CAUSE : Extension uniforme 1px ne tient pas compte de la géométrie cylindrique
TENTATIVE : Extension basée normales 3D → ÉCHEC (normales trop similaires devant/fond)
SOLUTION TESTÉE : Extension zonée par position grille → AMÉLIORATION PARTIELLE
📊 ANALYSE QUANTITATIVE
324 tuiles analysées sur 600 (54%)
Normales devant vs fond : différence seulement -0.083
Confirme que l'approche par normales était vouée à l'échec