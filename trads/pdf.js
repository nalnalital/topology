// # File: trads/pdf.js - Liens PDF Topologicon multilingues
// # Desc: En français, dans l'architecture, je suis la table des liens PDF du Topologicon pour chaque langue. La seule pochette BD (topologicon.jpg) est en français, dans trads/.
// # Version 1.2.1
// # Author: DNAvatar.org - Arnaud Maignan
// # Date: [June 08, 2025] [HH:MM UTC+1]
// # Logs:
// #   - [v1.2.1] Correction du chemin de la pochette BD (trads/topologicon.jpg)
// #   - [v1.2.0] Suppression des clés 'cover', la pochette BD n'existe qu'en français
// #   - [v1.1.0] Ajout des URLs locales vers les pochettes (covers) pour chaque langue
// #   - [v1.0.0] Création initiale avec les liens PDF

export const pdfLinks = {
  fr: {
    label: '🇫🇷 Français',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/Francais/LE%20TOPOLOGICON.pdf'
  },
  en: {
    label: '🇬🇧 Anglais',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/English/Topo_the_world_eng.pdf'
  },
  it: {
    label: '🇮🇹 Italien',
    url: 'https://web.unica.it/static/resources/cms/documents/Topologicon_it.pdf'
  },
  es: {
    label: '🇪🇸 Espagnol',
    url: 'http://www.savoir-sans-frontieres.com/JPP/telechargeables/ESPANOL/El_Topologicon_es.pdf'
  },
  de: {
    label: '🇩🇪 Allemand',
    url: 'https://www.savoir-sans-frontieres.com/JPP/telechargeables/free_downloads.html#allemand',
    note: 'Téléchargement manuel requis sur la page officielle (allemand)'
  },
  ru: {
    label: '🇷🇺 Russe',
    url: 'https://topologos.fr/topologicon/Topologicon_RU.pdf'
  }
}; 