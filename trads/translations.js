// File: translations.js - Système de traductions pour interface topologie 3D (JavaScript)
// Desc: En français, dans l'architecture, je suis le gestionnaire de traductions CSV en JavaScript
// Version 1.0.1 (version JavaScript compatible serveur Python)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 08:30 UTC+1
// Logs:
//   - v1.0.1: Correction exports pour compatibilité HTML + fonction debug
//   - v1.0.0: Version JavaScript du système traductions compatible avec serveur Python

// Fonction PrintDebug globale
function pd(message, context = '') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`❌ [${context}][translations.js] ${timestamp}: ${message}`);
}

class TranslationManager {
    constructor() {
        this.translations = {};
        this.languages = ['fr', 'en', 'es', 'it', 'de'];
        this.defaultLanguage = 'fr';
        this.currentLanguage = 'fr';
    }
    
    // Charge les traductions depuis le CSV
    async loadTranslations(csvFile = 'translations.csv') {
        try {
            const response = await fetch(csvFile);
            const csvText = await response.text();
            
            const lines = csvText.split('\n');
            let loadedCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Ignorer commentaires et lignes vides
                if (!line || line.startsWith('#')) continue;
                
                // Parser CSV avec guillemets
                const data = this.parseCSVLine(line);
                
                if (data.length < 6) {
                    console.warn(`Ligne ${i+1} ignorée: format incorrect (besoin de 6 colonnes)`);
                    continue;
                }
                
                // Nettoyer guillemets comme dans ton code PHP
                const id = data[0].replace(/"/g, '');
                
                this.translations[id] = {
                    fr: data[1].replace(/"/g, ''),
                    en: data[2].replace(/"/g, ''),
                    es: data[3].replace(/"/g, ''),
                    it: data[4].replace(/"/g, ''),
                    de: data[5].replace(/"/g, '')
                };
                
                loadedCount++;
            }
            
            console.log(`Traductions chargées: ${loadedCount} entrées depuis ${csvFile}`);
            return true;
            
        } catch (error) {
            console.error('Erreur chargement traductions:', error);
            return false;
        }
    }
    
    // Parser ligne CSV avec guillemets (compatible avec ton format)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Guillemet échappé
                    current += '"';
                    i += 2;
                } else {
                    // Début/fin de guillemets
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Séparateur
                result.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Ajouter dernier élément
        result.push(current);
        
        return result;
    }
    
    // Définit la langue courante
    setLanguage(lang) {
        lang = lang.toLowerCase();
        if (this.languages.includes(lang)) {
            this.currentLanguage = lang;
            return true;
        }
        return false;
    }
    
    // Récupère une traduction par ID
    get(id, lang = null) {
        lang = lang || this.currentLanguage;
        
        if (!this.translations[id]) {
            console.warn(`Traduction manquante: ${id}`);
            return `[${id}]`; // Afficher l'ID si traduction manquante
        }
        
        if (!this.translations[id][lang]) {
            // Fallback vers langue par défaut
            if (this.translations[id][this.defaultLanguage]) {
                return this.translations[id][this.defaultLanguage];
            }
            return `[${id}]`;
        }
        
        return this.translations[id][lang];
    }
    
    // Récupère toutes les traductions pour une langue
    getAll(lang = null) {
        lang = lang || this.currentLanguage;
        const result = {};
        
        for (const id in this.translations) {
            result[id] = this.get(id, lang);
        }
        
        return result;
    }
    
    // Structure associative compatible DNAvatar
    getDNAvatarFormat() {
        const result = {};
        
        for (const id in this.translations) {
            result[id] = this.translations[id];
        }
        
        return result;
    }
    
    // Récupère les langues disponibles
    getAvailableLanguages() {
        return this.languages;
    }
    
    // Récupère la langue courante
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // Vérifie si une traduction existe
    exists(id) {
        return this.translations.hasOwnProperty(id);
    }
    
    // Retourne les statistiques
    getStats() {
        const totalEntries = Object.keys(this.translations).length;
        const languageStats = {};
        
        for (const lang of this.languages) {
            let count = 0;
            for (const id in this.translations) {
                if (this.translations[id][lang] && this.translations[id][lang].trim()) {
                    count++;
                }
            }
            languageStats[lang] = {
                count: count,
                percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100 * 10) / 10 : 0
            };
        }
        
        return {
            totalEntries: totalEntries,
            languages: languageStats,
            currentLanguage: this.currentLanguage
        };
    }
}

// API compatible pour utilisation globale
class TranslationAPI {
    constructor() {
        this.manager = new TranslationManager();
        this.loaded = false;
    }
    
    // Initialiser le système
    async init(csvFile = 'translations.csv') {
        this.loaded = await this.manager.loadTranslations(csvFile);
        return this.loaded;
    }
    
    // API REST simulée (compatible avec version PHP)
    async handleRequest(params) {
        if (!this.loaded) {
            throw new Error('Traductions non chargées. Appelez init() d\'abord.');
        }
        
        const action = params.action || 'getAll';
        const lang = params.lang || 'fr';
        const id = params.id || null;
        
        // Définir langue
        if (!this.manager.setLanguage(lang)) {
            throw new Error(`Langue non supportée: ${lang}`);
        }
        
        let response = {};
        
        switch (action) {
            case 'get':
                if (!id) {
                    throw new Error("Paramètre 'id' requis pour action 'get'");
                }
                response = {
                    success: true,
                    data: this.manager.get(id),
                    id: id,
                    language: lang
                };
                break;
                
            case 'getAll':
                response = {
                    success: true,
                    data: this.manager.getAll(),
                    language: lang,
                    count: Object.keys(this.manager.getAll()).length
                };
                break;
                
            case 'languages':
                response = {
                    success: true,
                    data: this.manager.getAvailableLanguages(),
                    current: this.manager.getCurrentLanguage()
                };
                break;
                
            case 'stats':
                response = {
                    success: true,
                    data: this.manager.getStats()
                };
                break;
                
            case 'dnavatar':
                // Mode compatible avec structure associative
                response = {
                    success: true,
                    data: this.manager.getDNAvatarFormat(),
                    format: 'dnavatar_compatible'
                };
                break;
                
            default:
                throw new Error(`Action non reconnue: ${action}`);
        }
        
        return response;
    }
    
    // Mode DNAvatar direct (structure associative)
    getDNAvatarData() {
        if (!this.loaded) {
            console.error('Traductions non chargées');
            return {};
        }
        return this.manager.getDNAvatarFormat();
    }
}

// Instance globale pour compatibilité HTML
if (typeof window !== 'undefined') {
    window.TranslationAPI = TranslationAPI;
    window.TranslationManager = TranslationManager;
}

// Export pour modules ES6 (si disponible)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TranslationManager, TranslationAPI };
} 