declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    fontSize(size: number): this;
    font(font: string): this;
    text(text: string, options?: any): this;
    moveDown(lines?: number): this;
    addPage(options?: any): this;
    list(items: string[], options?: any): this;
    on(event: string, callback: (chunk: Buffer) => void): this;
    pipe(stream: any): this;
    end(): void;
  }

  export = PDFDocument;
}
