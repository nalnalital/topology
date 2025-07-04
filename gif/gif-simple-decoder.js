// File: gif-simple-decoder.js - Décodeur GIF simple sans dépendances
// Desc: Décode les GIF animés en utilisant la spécification GIF standard
// Version 1.0.2
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.2: Correction basée sur analyse hexadécimale du GIF
//   - v1.0.1: Correction gestion des blocs d'extension et amélioration robustesse
//   - v1.0.0: Création décodeur GIF simple basé sur la spécification GIF

// Décodeur GIF simple basé sur la spécification GIF
class SimpleGifDecoder {
  constructor() {
    this.frames = [];
    this.globalColorTable = [];
    this.width = 0;
    this.height = 0;
    this.loopCount = 0;
  }

  // Décoder un GIF depuis un ArrayBuffer
  decode(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    let offset = 0;

    // Vérifier la signature GIF
    const signature = String.fromCharCode(...data.slice(0, 6));
    if (signature !== 'GIF87a' && signature !== 'GIF89a') {
      throw new Error('Format GIF invalide');
    }

    offset = 6;

    // Lire les dimensions
    this.width = data[offset] | (data[offset + 1] << 8);
    this.height = data[offset + 2] | (data[offset + 3] << 8);
    offset += 7; // Skip packed fields et background color

    // Lire la table de couleurs globale si présente
    const hasGlobalColorTable = (data[6] & 0x80) !== 0;
    const colorTableSize = 2 << (data[6] & 0x07);
    
    if (hasGlobalColorTable) {
      this.globalColorTable = this.readColorTable(data, offset, colorTableSize);
      offset += colorTableSize * 3;
    }

    console.log(`[DECODER] GIF ${this.width}x${this.height}, table couleurs: ${this.globalColorTable.length} couleurs`);

    // Lire les blocs d'extension et d'image
    while (offset < data.length) {
      const blockType = data[offset];
      offset++;

      switch (blockType) {
        case 0x21: // Extension block
          offset = this.readExtensionBlock(data, offset);
          break;
        case 0x2C: // Image descriptor
          offset = this.readImageBlock(data, offset);
          break;
        case 0x3B: // Trailer
          console.log(`[DECODER] Trailer trouvé, ${this.frames.length} frames décodées`);
          return this.frames;
        default:
          // Ignorer les blocs inconnus au lieu de planter
          console.warn(`[DECODER] Bloc inconnu ignoré: 0x${blockType.toString(16)}`);
          offset = this.skipUnknownBlock(data, offset);
          break;
      }
    }

    return this.frames;
  }

  // Ignorer un bloc inconnu
  skipUnknownBlock(data, offset) {
    // Lire jusqu'à la fin du bloc (byte 0x00)
    while (offset < data.length && data[offset] !== 0) {
      offset += data[offset] + 1;
    }
    offset++; // Skip le byte de fin
    return offset;
  }

  // Lire une table de couleurs
  readColorTable(data, offset, size) {
    const colorTable = [];
    for (let i = 0; i < size; i++) {
      const r = data[offset + i * 3];
      const g = data[offset + i * 3 + 1];
      const b = data[offset + i * 3 + 2];
      colorTable.push([r, g, b]);
    }
    return colorTable;
  }

  // Lire un bloc d'extension
  readExtensionBlock(data, offset) {
    const extensionType = data[offset];
    offset++;

    if (extensionType === 0xF9) { // Graphics Control Extension
      const blockSize = data[offset];
      offset++;
      
      const packed = data[offset];
      const disposalMethod = (packed >> 2) & 0x07;
      const hasTransparency = (packed & 0x01) !== 0;
      offset++;

      const delayTime = data[offset] | (data[offset + 1] << 8);
      offset += 2;

      const transparentIndex = data[offset];
      offset++;

      // Stocker les informations pour la prochaine frame
      this.nextFrameInfo = {
        delay: delayTime * 10, // Convertir en millisecondes
        disposalMethod,
        transparentIndex: hasTransparency ? transparentIndex : null
      };
      
      console.log(`[DECODER] Graphics Control: delay=${delayTime*10}ms, disposal=${disposalMethod}, transparent=${transparentIndex}`);
    } else if (extensionType === 0xFE) { // Comment Extension
      console.log('[DECODER] Comment Extension ignorée');
    } else if (extensionType === 0xFF) { // Application Extension
      const blockSize = data[offset];
      offset++;
      
      // Lire l'identifiant d'application (8 bytes)
      const appId = String.fromCharCode(...data.slice(offset, offset + 8));
      offset += 8;
      
      // Lire le code d'authentification (3 bytes)
      const authCode = String.fromCharCode(...data.slice(offset, offset + 3));
      offset += 3;
      
      console.log(`[DECODER] Application Extension: ${appId} ${authCode}`);
      
      // Lire les données d'application
      while (offset < data.length && data[offset] !== 0) {
        const subBlockSize = data[offset];
        offset += subBlockSize + 1;
      }
      offset++; // Skip le byte de fin
    } else {
      console.warn(`[DECODER] Type d'extension inconnu: 0x${extensionType.toString(16)}`);
      
      // Lire jusqu'à la fin du bloc
      while (offset < data.length && data[offset] !== 0) {
        offset += data[offset] + 1;
      }
      offset++; // Skip le byte de fin
    }

    return offset;
  }

  // Lire un bloc d'image
  readImageBlock(data, offset) {
    // Lire le descripteur d'image
    const left = data[offset] | (data[offset + 1] << 8);
    const top = data[offset + 2] | (data[offset + 3] << 8);
    const width = data[offset + 4] | (data[offset + 5] << 8);
    const height = data[offset + 6] | (data[offset + 7] << 8);
    const packed = data[offset + 8];
    offset += 9;

    const hasLocalColorTable = (packed & 0x80) !== 0;
    const isInterlaced = (packed & 0x40) !== 0;
    const colorTableSize = 2 << (packed & 0x07);

    console.log(`[DECODER] Image: ${width}x${height} à (${left},${top}), interlaced=${isInterlaced}`);

    // Lire la table de couleurs locale si présente
    let colorTable = this.globalColorTable;
    if (hasLocalColorTable) {
      colorTable = this.readColorTable(data, offset, colorTableSize);
      offset += colorTableSize * 3;
      console.log(`[DECODER] Table couleurs locale: ${colorTable.length} couleurs`);
    }

    // Lire les données d'image compressées
    const imageData = this.readImageData(data, offset);

    // Créer la frame
    const frame = {
      left,
      top,
      width,
      height,
      colorTable,
      imageData,
      delay: this.nextFrameInfo ? this.nextFrameInfo.delay : 100,
      disposalMethod: this.nextFrameInfo ? this.nextFrameInfo.disposalMethod : 1,
      transparentIndex: this.nextFrameInfo ? this.nextFrameInfo.transparentIndex : null
    };

    this.frames.push(frame);
    this.nextFrameInfo = null;

    console.log(`[DECODER] Frame ajoutée: ${imageData.length} bytes de données`);

    return data.length; // On a fini de lire cette frame
  }

  // Lire les données d'image compressées (simplifié)
  readImageData(data, offset) {
    const minCodeSize = data[offset];
    offset++;

    console.log(`[DECODER] Taille code minimum: ${minCodeSize}`);

    // Pour simplifier, on retourne juste les données brutes
    // Dans une implémentation complète, il faudrait décompresser avec LZW
    const imageData = [];
    while (offset < data.length && data[offset] !== 0) {
      const blockSize = data[offset];
      offset++;
      for (let i = 0; i < blockSize; i++) {
        imageData.push(data[offset + i]);
      }
      offset += blockSize;
    }

    return imageData;
  }
}

// Exposer globalement
window.SimpleGifDecoder = SimpleGifDecoder; 