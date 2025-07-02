<?php
// File: translations.php - Système de traductions pour interface topologie 3D (compatible DNAvatar)
// Desc: En français, dans l'architecture, je suis le gestionnaire de traductions CSV compatible avec système DNAvatar
// Version 2.0.0 (compatible DNAvatar + JSONP)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 00:30 UTC+1
// Logs:
//   - v2.0.0: Compatible avec système DNAvatar existant + JSONP + structure associative
//   - v1.0.0: Lecture CSV traductions + API JSON pour interface JavaScript

// Debug console pour développement
function debug_to_console($data) {
    $output = $data;
    if (is_array($output))
        $output = implode(',', $output);
    echo "<script>console.log('" . $output . "' );</script>";
}

// Fonction CSV vers array associatif (compatible DNAvatar)
function csvToArray($file, $delimiter = ',') { 
    if (($handle = fopen($file, 'r')) !== FALSE) { 
        $i = 0; 
        while (($lineArray = fgetcsv($handle, 4000, $delimiter, '"')) !== FALSE) { 
            for ($j = 0; $j < count($lineArray); $j++) { 
                $arr[$i][$j] = utf8_encode($lineArray[$j]); 
            } 
            $i++; 
        } 
        fclose($handle); 
    } 
    return $arr ?? []; 
}

// Fonction principale compatible DNAvatar
function loadTranslationsCompatible($csvFile = 'translations.csv') {
    $keys = array();
    $newArray = array();
    
    // Charger données CSV
    $data = csvToArray($csvFile, ',');
    
    if (empty($data)) {
        return [];
    }
    
    // Nombre d'éléments (moins 1 car on retire première ligne)
    $count = count($data) - 1;
    
    // Utiliser première ligne pour les noms de colonnes  
    $labels = array_shift($data);  
    
    foreach ($labels as $label) {
        // Nettoyer guillemets comme dans ton code
        $goodKey = str_replace('"', "", $label);
        $keys[] = $goodKey;
    }
    
    // Retirer première clé (ID)
    array_shift($keys);
    
    // Assembler structure associative
    for ($j = 0; $j < $count; $j++) {
        $key = array_shift($data[$j]);
        $key = str_replace('"', "", $key); // Nettoyer ID aussi
        $d = @array_combine($keys, $data[$j]); // @ pour supprimer warnings
        $newArray[$key] = $d;
    }
    
    return $newArray;
}

class TranslationManager {
    private $translations = [];
    private $languages = ['fr', 'en', 'es', 'it', 'de'];
    private $defaultLanguage = 'fr';
    private $currentLanguage = 'fr';
    
    public function __construct($csvFile = 'translations.csv') {
        $this->loadTranslations($csvFile);
    }
    
    /**
     * Charge les traductions depuis le fichier CSV
     */
    private function loadTranslations($csvFile) {
        if (!file_exists($csvFile)) {
            throw new Exception("Fichier de traductions non trouvé: $csvFile");
        }
        
        $handle = fopen($csvFile, 'r');
        if (!$handle) {
            throw new Exception("Impossible d'ouvrir le fichier: $csvFile");
        }
        
        $lineNumber = 0;
        while (($data = fgetcsv($handle, 1000, ',', '"')) !== FALSE) {
            $lineNumber++;
            
            // Ignorer les commentaires
            if (empty($data[0]) || strpos($data[0], '#') === 0) {
                continue;
            }
            
            // Vérifier format: ID + 5 langues (FR, EN, ES, IT, DE)
            if (count($data) < 6) {
                error_log("Ligne $lineNumber ignorée: format incorrect (besoin de 6 colonnes)");
                continue;
            }
            
            $id = trim($data[0], '"');
            $this->translations[$id] = [
                'fr' => trim($data[1], '"'),
                'en' => trim($data[2], '"'),
                'es' => trim($data[3], '"'),
                'it' => trim($data[4], '"'),
                'de' => trim($data[5], '"')
            ];
        }
        
        fclose($handle);
        
        // Log statistiques
        $count = count($this->translations);
        error_log("Traductions chargées: $count entrées depuis $csvFile");
        if (isset($this->translations['projectionTitle']) || isset($this->translations['"projectionTitle"']) || isset($this->translations['"""projectionTitle"""'])) {
            error_log('[DEBUG][PHP] Clé projectionTitle présente dans $this->translations');
        } else {
            error_log('[DEBUG][PHP] Clé projectionTitle ABSENTE dans $this->translations');
        }
    }
    
    /**
     * Définit la langue courante
     */
    public function setLanguage($lang) {
        $lang = strtolower($lang);
        if (in_array($lang, $this->languages)) {
            $this->currentLanguage = $lang;
            return true;
        }
        return false;
    }
    
    /**
     * Récupère une traduction par ID
     */
    public function get($id, $lang = null) {
        $lang = $lang ?: $this->currentLanguage;
        
        if (!isset($this->translations[$id])) {
            error_log("Traduction manquante: $id");
            return "[$id]"; // Afficher l'ID si traduction manquante
        }
        
        if (!isset($this->translations[$id][$lang])) {
            // Fallback vers langue par défaut
            if (isset($this->translations[$id][$this->defaultLanguage])) {
                return $this->translations[$id][$this->defaultLanguage];
            }
            return "[$id]";
        }
        
        return $this->translations[$id][$lang];
    }
    
    /**
     * Récupère toutes les traductions pour une langue
     */
    public function getAll($lang = null) {
        $lang = $lang ?: $this->currentLanguage;
        $result = [];
        
        foreach ($this->translations as $id => $translations) {
            $result[$id] = $this->get($id, $lang);
        }
        
        return $result;
    }
    
    /**
     * Récupère les langues disponibles
     */
    public function getAvailableLanguages() {
        return $this->languages;
    }
    
    /**
     * Récupère la langue courante
     */
    public function getCurrentLanguage() {
        return $this->currentLanguage;
    }
    
    /**
     * Vérifie si une traduction existe
     */
    public function exists($id) {
        return isset($this->translations[$id]);
    }
    
    /**
     * Retourne les statistiques
     */
    public function getStats() {
        $totalEntries = count($this->translations);
        $languageStats = [];
        
        foreach ($this->languages as $lang) {
            $count = 0;
            foreach ($this->translations as $id => $translations) {
                if (!empty($translations[$lang])) {
                    $count++;
                }
            }
            $languageStats[$lang] = [
                'count' => $count,
                'percentage' => $totalEntries > 0 ? round(($count / $totalEntries) * 100, 1) : 0
            ];
        }
        
        return [
            'totalEntries' => $totalEntries,
            'languages' => $languageStats,
            'currentLanguage' => $this->currentLanguage
        ];
    }
}

// API COMPATIBLE DNAVATAR (JSONP + structure associative)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Mode compatible DNAvatar (structure associative directe)
    if (isset($_GET['mode']) && $_GET['mode'] === 'dnavatar') {
        header('Content-type: application/javascript; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        
        // Charger traductions avec fonction compatible
        $translations = loadTranslationsCompatible('translations.csv');
        
        // Support JSONP comme ton code
        $callback = $_GET['callback'] ?? '';
        if ($callback) {
            echo $callback . '(' . json_encode($translations, JSON_UNESCAPED_UNICODE) . ');';
        } else {
            echo json_encode($translations, JSON_UNESCAPED_UNICODE);
        }
        exit;
    }
    
    // Mode API REST (nouveau système)
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    
    try {
        $translator = new TranslationManager();
        
        // Paramètres URL
        $action = $_GET['action'] ?? 'getAll';
        $lang = $_GET['lang'] ?? 'fr';
        $id = $_GET['id'] ?? null;
        
        // Définir langue
        if (!$translator->setLanguage($lang)) {
            throw new Exception("Langue non supportée: $lang");
        }
        
        $response = [];
        
        switch ($action) {
            case 'get':
                if (!$id) {
                    throw new Exception("Paramètre 'id' requis pour action 'get'");
                }
                $response = [
                    'success' => true,
                    'data' => $translator->get($id),
                    'id' => $id,
                    'language' => $lang
                ];
                break;
                
            case 'getAll':
                $response = [
                    'success' => true,
                    'data' => $translator->getAll(),
                    'language' => $lang,
                    'count' => count($translator->getAll())
                ];
                break;
                
            case 'languages':
                $response = [
                    'success' => true,
                    'data' => $translator->getAvailableLanguages(),
                    'current' => $translator->getCurrentLanguage()
                ];
                break;
                
            case 'stats':
                $response = [
                    'success' => true,
                    'data' => $translator->getStats()
                ];
                break;
                
            case 'dnavatar':
                // Mode compatible avec structure associative
                $response = [
                    'success' => true,
                    'data' => loadTranslationsCompatible('translations.csv'),
                    'format' => 'dnavatar_compatible'
                ];
                break;
                
            default:
                throw new Exception("Action non reconnue: $action");
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}

// Exemple d'utilisation directe en PHP
/*
$translator = new TranslationManager();
$translator->setLanguage('en');

echo $translator->get('topologyTitle') . "\n";
echo $translator->get('torus') . "\n";

print_r($translator->getStats());
*/
?> 