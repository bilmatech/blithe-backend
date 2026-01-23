import { TemplateLoader } from '@Blithe/common/utils/template-loader.util';
import { Injectable } from '@nestjs/common';
import * as path from 'path';

@Injectable()
export class TemplateParserService {
  private TEMPLATE_ROOT = path.resolve(
    process.cwd(),
    'src/modules/email/templates',
  );

  async render(
    templatePath: string,
    variables: Record<string, any> = {},
  ): Promise<string> {
    let html = await TemplateLoader.loadTemplate(
      path.join(this.TEMPLATE_ROOT, templatePath),
    );

    html = await this.applyLayout(html, variables);
    html = await this.processFragments(html);
    html = this.applyLoops(html, variables); // NEW LOOP SUPPORT
    html = this.interpolateVariables(html, variables);

    return html;
  }

  // ----------------------------------------------------------------------
  // FRAGMENTS {{> header }}
  // ----------------------------------------------------------------------
  private async processFragments(html: string): Promise<string> {
    const fragmentRegex = /{{>\s*([a-zA-Z0-9_-]+)\s*}}/g;

    const matches = Array.from(html.matchAll(fragmentRegex));

    const replacements = await Promise.all(
      matches.map(async (match) => {
        const fragmentName = match[1];
        const fragmentPath = path.join(
          this.TEMPLATE_ROOT,
          'fragments',
          `${fragmentName}.html`,
        );

        try {
          return await TemplateLoader.loadTemplate(fragmentPath);
        } catch {
          console.warn(`Fragment not found: ${fragmentName}`);
          return '';
        }
      }),
    );

    let result = html;
    matches.forEach((match, index) => {
      result = result.replace(match[0], replacements[index]);
    });

    return result;
  }

  // ----------------------------------------------------------------------
  // LOOPS  {{#each items}} ... {{/each}}
  // ----------------------------------------------------------------------
  private applyLoops(html: string, variables: Record<string, any>): string {
    const loopRegex = /{{#each\s+([\w.]+)}}([\s\S]*?){{\/each}}/g;

    return html.replace(loopRegex, (_, arrayPath, loopContent) => {
      const dataArray = this.resolvePath(arrayPath, variables);

      if (!Array.isArray(dataArray)) return '';

      return dataArray
        .map((item) => {
          if (typeof item === 'string') {
            return loopContent.replace(/{{\s*this\s*}}/g, item);
          }

          if (typeof item === 'object' && item !== null) {
            return loopContent.replace(/{{\s*([\w]+)\s*}}/g, (__, key) => {
              return item[key] ?? '';
            });
          }

          return '';
        })
        .join('');
    });
  }

  // Allows nested paths like "user.transactions"
  private resolvePath(pathStr: string, obj: any) {
    return pathStr
      .split('.')
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  // ----------------------------------------------------------------------
  // VARIABLE RENDERING {{variable}}
  // ----------------------------------------------------------------------
  private interpolateVariables(
    html: string,
    variables: Record<string, any>,
  ): string {
    // 1) Raw HTML injection {{{ var }}}
    html = html.replace(/{{{\s*([^{}]+)\s*}}}/g, (_, key) => {
      const value = this.resolvePath(key, variables);
      return value !== undefined ? String(value) : '';
    });

    // 2) Escaped interpolation {{ var }}
    return html.replace(/{{\s*([^{}]+)\s*}}/g, (_, key) => {
      const value = this.resolvePath(key, variables);
      if (value === undefined || key === 'this') return '';

      // Escape HTML
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    });
  }

  // ----------------------------------------------------------------------
  // LAYOUT SUPPORT  {{!layout main}}
  // ----------------------------------------------------------------------
  private async applyLayout(
    html: string,
    variables: Record<string, any>,
  ): Promise<string> {
    const layoutRegex = /{{!layout\s+([a-zA-Z0-9_-]+)}}/;

    const match = html.match(layoutRegex);

    if (!match) return html;

    const layoutName = match[1];

    // Remove layout tag
    html = html.replace(layoutRegex, '');

    const layoutFile = path.join(
      this.TEMPLATE_ROOT,
      'layouts',
      `${layoutName}.html`,
    );

    let layoutHtml = await TemplateLoader.loadTemplate(layoutFile);

    // Insert the email content
    layoutHtml = layoutHtml.replace(/{{{\s*body\s*}}}/, html);

    // 🚨 RE-RUN full template parsing on the final combined HTML
    layoutHtml = await this.processFragments(layoutHtml);
    layoutHtml = this.applyLoops(layoutHtml, variables);
    layoutHtml = this.interpolateVariables(layoutHtml, variables);

    return layoutHtml;
  }
}
