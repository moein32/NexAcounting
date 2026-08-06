import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from 'docx';
import { formatCurrency, formatPersianDate } from '../../lib/utils';
import { EXPORT_FIELD_SCHEMAS } from '../ExportTemplate';

export interface WordReportData {
  title: string;
  subtitle?: string;
  businessName: string;
  generatedDate: string;
  schemaKey: string;
  data: Record<string, any>[];
  summaryCards?: { label: string; value: string | number }[];
}

export class WordExporter {
  public static async exportReport(report: WordReportData, filename: string): Promise<void> {
    const schema = EXPORT_FIELD_SCHEMAS[report.schemaKey] || [];

    // Header paragraphs
    const children: any[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [
          new TextRun({
            text: report.businessName,
            bold: true,
            size: 32,
            color: '003366',
            font: 'B Nazanin',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: report.title,
            bold: true,
            size: 26,
            color: '1A1A1A',
            font: 'B Nazanin',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `تاریخ گزارش: ${formatPersianDate(report.generatedDate)}`,
            size: 20,
            color: '555555',
            font: 'B Nazanin',
          }),
        ],
      }),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ];

    // Summary cards if provided
    if (report.summaryCards && report.summaryCards.length > 0) {
      const summaryRows = report.summaryCards.map(
        (sc) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: sc.label,
                        bold: true,
                        size: 20,
                        font: 'B Nazanin',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text:
                          typeof sc.value === 'number'
                            ? formatCurrency(sc.value)
                            : String(sc.value),
                        bold: true,
                        color: '006699',
                        size: 20,
                        font: 'B Nazanin',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: summaryRows,
        }),
        new Paragraph({ text: '', spacing: { after: 200 } })
      );
    }

    // Table Header Row
    const headerCells = schema.map(
      (col) =>
        new TableCell({
          width: { size: 100 / schema.length, type: WidthType.PERCENTAGE },
          shading: { fill: '003366' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: col.label,
                  bold: true,
                  color: 'FFFFFF',
                  size: 20,
                  font: 'B Nazanin',
                }),
              ],
            }),
          ],
        })
    );

    const tableRows: TableRow[] = [
      new TableRow({
        children: headerCells,
      }),
    ];

    // Data Rows
    report.data.forEach((row, rowIdx) => {
      const cells = schema.map((col) => {
        let val = row[col.key];
        if (col.format === 'currency') {
          val = typeof val === 'number' ? formatCurrency(val) : val ?? 0;
        } else if (col.format === 'date' && val) {
          val = formatPersianDate(val);
        } else if (val === null || val === undefined) {
          val = '---';
        }

        return new TableCell({
          shading: { fill: rowIdx % 2 === 0 ? 'FFFFFF' : 'F4F6F9' },
          children: [
            new Paragraph({
              alignment:
                col.format === 'currency' || col.format === 'number'
                  ? AlignmentType.LEFT
                  : AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: String(val),
                  size: 18,
                  font: 'B Nazanin',
                }),
              ],
            }),
          ],
        });
      });

      tableRows.push(new TableRow({ children: cells }));
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );

    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
