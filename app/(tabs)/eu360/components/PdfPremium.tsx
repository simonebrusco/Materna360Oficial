'use client'

export type PremiumDocProps = {
  weekRange: string
  moodSummary: string
  coachTips: string[]
}

/**
 * Render and print a premium PDF report via window.print()
 * Opens a new window with a minimal printable HTML document
 * with inline CSS for print styling.
 */
export function renderPremiumDoc({
  weekRange,
  moodSummary,
  coachTips,
}: PremiumDocProps) {
  const win = window.open('', '_blank')
  if (!win) return

  const coachTipsHtml = (coachTips || [])
    .map((tip) => `<li>${tip}</li>`)
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Materna360 — Premium Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 20mm;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }

          html {
            height: 100%;
          }

          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
            padding: 20px;
          }

          .container {
            max-width: 900px;
            margin: 0 auto;
          }

          .cover {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 32px;
            margin-bottom: 24px;
            background: linear-gradient(135deg, #fff7fb 0%, #ffffff 100%);
            page-break-after: avoid;
          }

          .cover h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #000000;
          }

          .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid #ff005e;
            color: #ff005e;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
          }

          .cover p {
            font-size: 14px;
            color: #545454;
            margin: 8px 0;
          }

          .toc-section {
            margin: 24px 0;
            page-break-inside: avoid;
          }

          .toc-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #000000;
            border-bottom: 2px solid #ff005e;
            padding-bottom: 8px;
          }

          .toc-section ol {
            padding-left: 24px;
          }

          .toc-section ol li {
            margin-bottom: 6px;
            font-size: 14px;
            color: #545454;
          }

          .content-section {
            margin: 28px 0;
            page-break-inside: avoid;
          }

          .content-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #000000;
            border-bottom: 2px solid #ff005e;
            padding-bottom: 8px;
          }

          .content-section p {
            font-size: 14px;
            line-height: 1.6;
            color: #545454;
            margin-bottom: 12px;
          }

          .content-section ul {
            margin-left: 20px;
            margin-top: 12px;
          }

          .content-section ul li {
            margin-bottom: 8px;
            font-size: 14px;
            color: #545454;
          }

          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }

          @media print {
            .cover {
              page-break-after: auto;
            }

            .content-section {
              page-break-inside: auto;
              margin: 20px 0;
            }

            .footer {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Cover Section -->
          <div class="cover">
            <h1>Premium Report</h1>
            <div class="badge">Materna360 v0.2.0-p2-staging1</div>
            <p><strong>Período:</strong> ${weekRange || '—'}</p>
            <p style="margin-top: 16px; font-size: 13px;">
              Relatório gerado automaticamente. Compartilhe com profissionais de saúde para análises personalizadas.
            </p>
          </div>

          <!-- Table of Contents -->
          <div class="toc-section">
            <h2>Índice</h2>
            <ol>
              <li>Resumo da Semana</li>
              <li>Humor e Energia</li>
              <li>Dicas do Coach</li>
            </ol>
          </div>

          <!-- Weekly Summary Section -->
          <div class="content-section">
            <h2>Resumo da Semana</h2>
            <p>${moodSummary || 'Nenhum resumo disponível.'}</p>
          </div>

          <!-- Coach Tips Section -->
          <div class="content-section">
            <h2>Dicas do Coach</h2>
            ${
              (coachTips || []).length > 0
                ? `<ul>${coachTipsHtml}</ul>`
                : '<p>Nenhuma dica disponível nesta semana.</p>'
            }
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Materna360 © 2024 | Premium Report</p>
          </div>
        </div>

        <script>
          window.print();
        </script>
      </body>
    </html>
  `

  win.document.write(html)
  win.document.close()
}
