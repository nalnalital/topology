// # File: trads/pdf.js - Liens PDF Topologicon multilingues
// # Desc: En français, dans l'architecture, je suis la table des liens PDF du Topologicon pour chaque langue. La seule pochette BD (topologicon.jpg) est en français, dans trads/.
// # Version 1.3.0 (ajout URLs globales sites)
// # Author: DNAvatar.org - Arnaud Maignan
// # Date: [June 08, 2025] [HH:MM UTC+1]
// # Logs:
// #   - [v1.3.0] Ajout URLs globales des sites (siteUrl) pour chaque langue
// #   - [v1.2.1] Correction du chemin de la pochette BD (trads/topologicon.jpg)
// #   - [v1.2.0] Suppression des clés 'cover', la pochette BD n'existe qu'en français
// #   - [v1.1.0] Ajout des URLs locales vers les pochettes (covers) pour chaque langue
// #   - [v1.0.0] Création initiale avec les liens PDF

/**
 * Extrait l'URL globale du site à partir d'une URL de PDF
 * @param {string} pdfUrl - URL complète du PDF
 * @returns {string} - URL globale du site
 */
function extractSiteUrl(pdfUrl) {
  try {
    const url = new URL(pdfUrl);
    // Garder protocole + domaine + chemin jusqu'au dernier dossier
    const pathParts = url.pathname.split('/');
    pathParts.pop(); // Retirer le fichier PDF
    return url.protocol + '//' + url.host + pathParts.join('/');
  } catch (e) {
    // Fallback simple si URL invalide
    return pdfUrl.replace(/\/[^\/]+\.pdf.*$/, '');
  }
}

export const pdfLinks = {
  fr: {
    label: '🇫🇷 Français',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Francais/LE%20TOPOLOGICON.pdf',
    siteUrl: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Francais'
  },
  en: {
    label: '🇬🇧 Anglais',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/English/Topo_the_world_eng.pdf',
    siteUrl: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/English'
  },
  it: {
    label: '🇮🇹 Italien',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Italien/Topologicon_it.pdf',
    siteUrl: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Italien'
  },
  es: {
    label: '🇪🇸 Espagnol',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/ESPANOL/El_Topologicon_es.pdf',
    siteUrl: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/ESPANOL'
  },
  de: {
    label: '🇩🇪 Allemand',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Deutch/DAS%20_TOPOLOGIKON.pdf',
    siteUrl: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Deutch/das_topologikon.htm',
  },
}; 