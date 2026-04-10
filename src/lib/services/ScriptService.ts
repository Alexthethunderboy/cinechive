export interface ScriptInfo {
  url: string;
  source: string;
  isConfirmed: boolean;
}

export class ScriptService {
  /**
   * Returns best-effort script URL candidates by title.
   */
  static async findScript(title?: string, imdbId?: string): Promise<ScriptInfo[]> {
    if (!title) return [];
    
    const slugDashes = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slugUnderscores = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    const slugNoSpaces = title.replace(/\s+/g, '');

    const candidates: ScriptInfo[] = [
      {
        source: 'IMSDB',
        url: `https://imsdb.com/scripts/${title.replace(/\s+/g, '-')}.html`,
        isConfirmed: false
      },
      {
        source: 'ScriptSlug',
        url: `https://www.scriptslug.com/script/${slugDashes}`,
        isConfirmed: false
      },
      {
        source: 'DailyScript',
        url: `https://www.dailyscript.com/scripts/${slugUnderscores}.html`,
        isConfirmed: false
      }
    ];

    // Note: In a production server-side action, we could perform HEAD requests 
    // to confirm which one exists. For now, we return the predictions.
    return candidates;
  }
}
