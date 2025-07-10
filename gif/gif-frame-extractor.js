// File: gif-frame-extractor.js - Extracteur de frames GIF
// Desc: Extrait toutes les frames d'un GIF et les affiche
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Création extracteur de frames GIF

// Extracteur de frames GIF
class GifFrameExtractor {
  constructor() {
    this.frames = [];
    this.globalColorTable = [];
    this.width = 0;
    this.height = 0;
  }

  // Extraire les frames d'un GIF
  async extractFrames(gifUrl) {
    try {
      console.log('[EXTRACTOR] Extraction des frames de:', gifUrl);
      
      // Charger le fichier GIF
      const response = await fetch(gifUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('[EXTRACTOR] Fichier chargé:', arrayBuffer.byteLength, 'bytes');
      
      // Décoder le GIF
      const data = new Uint8Array(arrayBuffer);
      this.decodeGif(data);
      
      console.log(`[EXTRACTOR] ${this.frames.length} frames extraites`);
      return this.frames;
      
    } catch (error) {
      console.error('[EXTRACTOR] Erreur extraction:', error);
      return [];
    }
  }

  // Décoder le GIF
  decodeGif(data) {
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
    offset += 7;

    // Lire la table de couleurs globale si présente
    const hasGlobalColorTable = (data[6] & 0x80) !== 0;
    const colorTableSize = 2 << (data[6] & 0x07);
    
    if (hasGlobalColorTable) {
      this.globalColorTable = this.readColorTable(data, offset, colorTableSize);
      offset += colorTableSize * 3;
    }

    console.log(`[EXTRACTOR] GIF ${this.width}x${this.height}, table couleurs: ${this.globalColorTable.length} couleurs`);

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
          console.log(`[EXTRACTOR] Trailer trouvé, ${this.frames.length} frames extraites`);
          return;
        default:
          console.warn(`[EXTRACTOR] Bloc inconnu ignoré: 0x${blockType.toString(16)}`);
          offset = this.skipUnknownBlock(data, offset);
          break;
      }
    }
  }

  // Ignorer un bloc inconnu
  skipUnknownBlock(data, offset) {
    while (offset < data.length && data[offset] !== 0) {
      offset += data[offset] + 1;
    }
    offset++;
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
        delay: delayTime * 10,
        disposalMethod,
        transparentIndex: hasTransparency ? transparentIndex : null
      };
      
      console.log(`[EXTRACTOR] Graphics Control: delay=${delayTime*10}ms, disposal=${disposalMethod}, transparent=${transparentIndex}`);
    } else if (extensionType === 0xFE) {
      console.log('[EXTRACTOR] Comment Extension ignorée');
    } else if (extensionType === 0xFF) {
      const blockSize = data[offset];
      offset++;
      
      const appId = String.fromCharCode(...data.slice(offset, offset + 8));
      offset += 8;
      
      const authCode = String.fromCharCode(...data.slice(offset, offset + 3));
      offset += 3;
      
      console.log(`[EXTRACTOR] Application Extension: ${appId} ${authCode}`);
      
      while (offset < data.length && data[offset] !== 0) {
        const subBlockSize = data[offset];
        offset += subBlockSize + 1;
      }
      offset++;
    } else {
      console.warn(`[EXTRACTOR] Type d'extension inconnu: 0x${extensionType.toString(16)}`);
      
      while (offset < data.length && data[offset] !== 0) {
        offset += data[offset] + 1;
      }
      offset++;
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

    console.log(`[EXTRACTOR] Image: ${width}x${height} à (${left},${top}), interlaced=${isInterlaced}`);

    // Lire la table de couleurs locale si présente
    let colorTable = this.globalColorTable;
    if (hasLocalColorTable) {
      colorTable = this.readColorTable(data, offset, colorTableSize);
      offset += colorTableSize * 3;
      console.log(`[EXTRACTOR] Table couleurs locale: ${colorTable.length} couleurs`);
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

    console.log(`[EXTRACTOR] Frame ajoutée: ${imageData.length} bytes de données`);

    return data.length;
  }

  // Lire les données d'image compressées
  readImageData(data, offset) {
    const minCodeSize = data[offset];
    offset++;

    console.log(`[EXTRACTOR] Taille code minimum: ${minCodeSize}`);

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

  // Créer un canvas pour une frame (simulation)
  createFrameCanvas(frameIndex) {
    if (frameIndex >= this.frames.length) return null;
    
    const frame = this.frames[frameIndex];
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    
    // Pour l'instant, on crée juste un canvas avec les dimensions
    // Le décodage LZW complet nécessiterait plus de travail
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, frame.width, frame.height);
    
    // Ajouter le numéro de frame
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Frame ${frameIndex + 1}`, 10, 30);
    ctx.fillText(`${frame.width}x${frame.height}`, 10, 60);
    ctx.fillText(`Delay: ${frame.delay}ms`, 10, 90);
    
    return canvas;
  }
}

// Exposer globalement
window.GifFrameExtractor = GifFrameExtractor; 