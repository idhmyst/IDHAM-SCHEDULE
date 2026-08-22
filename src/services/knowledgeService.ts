import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { KnowledgeDocument } from '../types';
import { StorageService } from './storage';

export const KnowledgeService = {
  async getAllDocuments(): Promise<KnowledgeDocument[]> {
    return StorageService.getKnowledgeDocs();
  },

  async pickAndLearnDocument(): Promise<KnowledgeDocument | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      let content = '';

      // Try reading text directly for text-based formats (txt, json, md, csv, js, ts, py, etc.)
      try {
        if (asset.uri) {
          content = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
      } catch (e) {
        // If binary (like PDF/DOCX), store file metadata and keywords
        content = `File: ${asset.name} (Tipe: ${asset.mimeType || 'Dokumen'}). Berisi materi dan referensi belajar kelas.`;
      }

      const newDoc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: asset.name.replace(/\.[^/.]+$/, ''),
        fileName: asset.name,
        fileUri: asset.uri,
        textContent: content,
        summary: content.slice(0, 180),
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveKnowledgeDoc(newDoc);
      return newDoc;
    } catch (err) {
      console.error('Error learning document', err);
      return null;
    }
  },

  async addTextKnowledge(title: string, text: string): Promise<KnowledgeDocument> {
    const newDoc: KnowledgeDocument = {
      id: Date.now().toString(),
      title,
      fileName: `${title}.txt`,
      textContent: text,
      summary: text.slice(0, 180),
      createdAt: new Date().toISOString(),
    };

    await StorageService.saveKnowledgeDoc(newDoc);
    return newDoc;
  },

  async searchKnowledge(query: string): Promise<{ doc: KnowledgeDocument; snippet: string } | null> {
    const docs = await StorageService.getKnowledgeDocs();
    if (docs.length === 0) return null;

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch: KnowledgeDocument | null = null;
    let highestScore = 0;
    let bestSnippet = '';

    for (const doc of docs) {
      const lowerContent = (doc.title + ' ' + doc.textContent).toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (lowerContent.includes(word)) {
          score += 1;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = doc;

        // Extract relevant sentence snippet
        const firstMatchIndex = lowerContent.indexOf(queryWords[0] || '');
        if (firstMatchIndex >= 0) {
          const start = Math.max(0, firstMatchIndex - 50);
          const end = Math.min(doc.textContent.length, firstMatchIndex + 250);
          bestSnippet = (start > 0 ? '...' : '') + doc.textContent.slice(start, end).trim() + (end < doc.textContent.length ? '...' : '');
        } else {
          bestSnippet = doc.summary || doc.textContent.slice(0, 200);
        }
      }
    }

    if (bestMatch && highestScore > 0) {
      return { doc: bestMatch, snippet: bestSnippet };
    }

    return null;
  },
};
