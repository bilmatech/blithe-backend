import { promises as fs } from 'fs';
import * as path from 'path';

export class TemplateLoader {
  static async loadTemplate(filePath: string): Promise<string> {
    const absolute = path.resolve(process.cwd(), filePath);
    return fs.readFile(absolute, 'utf8');
  }
}
