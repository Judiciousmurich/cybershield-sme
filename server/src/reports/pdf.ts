import PDFDocument from 'pdfkit';
import type { PublicUser } from '../types.js';
import type { ResultsPayload } from '../scoring/results.js';

export async function buildReportPdf(
  user: PublicUser,
  results: ResultsPayload,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#1e3a8a').fontSize(22).text('CyberShield');
    doc.fillColor('#111827').fontSize(16).text('Cyber risk assessment report');
    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(`Prepared for ${user.email}`)
      .text(`Assessment ${results.assessment_id}`)
      .text(`Generated ${new Date().toISOString()}`);

    doc.moveDown();
    doc.fillColor('#111827').fontSize(13).text('Business context');
    doc
      .fontSize(11)
      .fillColor('#374151')
      .text(
        user.business_context?.trim() ||
          'No business context was provided. Add a short description of the firm (sector, headcount, or systems) from the results page to include it here.',
        { width: 495 },
      );

    doc.moveDown();
    doc.fillColor('#111827').fontSize(13).text('Overall score and risk band');
    doc
      .fontSize(20)
      .text(`${results.overall.score}%  ·  ${results.overall.risk_band} risk`);
    doc
      .fontSize(11)
      .fillColor('#374151')
      .text(results.overall.rationale, { width: 495 });

    doc.moveDown();
    doc.fillColor('#111827').fontSize(13).text('Scores by domain');
    doc.moveDown(0.3);

    const barLeft = 50;
    const barWidth = 280;
    for (const domain of results.domains) {
      const y = doc.y;
      doc.fontSize(10).fillColor('#111827').text(domain.label, barLeft, y, {
        width: 160,
      });
      doc
        .save()
        .rect(barLeft + 170, y + 2, barWidth, 10)
        .fill('#e5e7eb');
      doc
        .rect(barLeft + 170, y + 2, barWidth * (domain.score / 100), 10)
        .fill('#1e3a8a')
        .restore();
      doc
        .fillColor('#111827')
        .text(`${domain.score}% (${domain.risk_band})`, barLeft + 460, y, {
          width: 90,
        });
      doc.moveDown(1.1);
    }

    doc.moveDown(0.4);
    doc.fillColor('#111827').fontSize(13).text('Prioritised recommendations');
    doc.moveDown(0.2);

    if (results.recommendations.length === 0) {
      doc
        .fontSize(11)
        .fillColor('#374151')
        .text(
          'No domain scored below the Low-risk threshold. Keep reviewing access and backups as the business changes.',
        );
    } else {
      for (const item of results.recommendations) {
        doc
          .fontSize(11)
          .fillColor('#111827')
          .text(`${item.priority}. ${item.title}`, { width: 495 });
        doc
          .fontSize(10)
          .fillColor('#374151')
          .text(item.detail, { width: 495 });
        doc.moveDown(0.5);
      }
    }

    doc.end();
  });
}
