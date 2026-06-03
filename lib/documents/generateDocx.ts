import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx'
import {
  STATUS_LABELS,
  LOAN_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DocumentType,
  DOCUMENT_LABELS,
} from '@/lib/types'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const BLUE = '1B5FAA'
const LIGHT_BLUE = 'D3E4F5'
const GRAY = '6B7280'
const BORDER_COLOR = 'E5E7EB'

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    text: text.toUpperCase(),
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
    },
    run: {
      color: BLUE,
      size: 20,
      bold: true,
    },
  })
}

function dataTable(rows: { label: string; value?: string | number | null }[]): Table {
  const filteredRows = rows.filter((r) => r.value !== null && r.value !== undefined && r.value !== '')

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: filteredRows.map((row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
            margins: { top: 80, bottom: 80, left: 120, right: 80 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: row.label, color: GRAY, size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            margins: { top: 80, bottom: 80, left: 120, right: 80 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(row.value ?? '-'), bold: true, size: 18 })],
              }),
            ],
          }),
        ],
      })
    ),
  })
}

interface AppData {
  application: Record<string, unknown>
  profile: Record<string, unknown> | null
  history: { status: string; changed_at: string; note?: string | null; internal_users?: { full_name?: string } | null }[]
  docs: { document_type: string }[]
}

export async function generateApplicationDocx(data: AppData): Promise<Buffer> {
  const { application: app, profile, history, docs } = data

  const statusLabel = STATUS_LABELS[app.status as keyof typeof STATUS_LABELS] ?? String(app.status)

  const doc = new Document({
    numbering: {
      config: [],
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({ text: 'CréditPro', bold: true, color: BLUE, size: 28 }),
                            ],
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: 'Plateforme de demande de crédit', color: GRAY, size: 16 })],
                          }),
                        ],
                      }),
                      new TableCell({
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({ text: String(app.application_number), bold: true, size: 24 })],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({ text: `Statut : ${statusLabel}`, color: BLUE, bold: true, size: 18 })],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [new TextRun({ text: `Généré le ${formatDate(new Date().toISOString())}`, color: GRAY, size: 16 })],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CréditPro - Document confidentiel    ', color: GRAY, size: 16 }),
                  new TextRun({ children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], color: GRAY, size: 16 }),
                ],
              }),
            ],
          }),
        },
        properties: {
          page: {
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        children: [
          // Title
          new Paragraph({
            text: `Dossier de demande de crédit - ${app.application_number}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 120 },
            run: { color: '1F2937', size: 28, bold: true },
          }),

          app.submitted_at
            ? new Paragraph({
                children: [new TextRun({ text: `Soumis le ${formatDate(String(app.submitted_at))}`, color: GRAY, size: 18 })],
                spacing: { after: 360 },
              })
            : new Paragraph({ text: '' }),

          // Client
          sectionTitle('Informations client'),
          dataTable([
            { label: 'Nom complet', value: profile?.full_name as string },
            { label: 'Email', value: profile?.email as string },
            { label: 'Téléphone', value: profile?.phone as string },
            { label: 'Date de naissance', value: profile?.date_of_birth as string },
            { label: 'Nationalité', value: profile?.nationality as string },
            { label: 'Adresse', value: profile?.address as string },
          ]),

          // Professional
          sectionTitle('Situation professionnelle'),
          dataTable([
            { label: 'Profession', value: profile?.profession as string },
            { label: 'Employeur', value: profile?.employer as string },
            {
              label: 'Type de contrat',
              value: profile?.contract_type
                ? CONTRACT_TYPE_LABELS[profile.contract_type as keyof typeof CONTRACT_TYPE_LABELS]
                : null,
            },
            { label: 'Ancienneté', value: profile?.seniority_years ? `${profile.seniority_years} ans` : null },
          ]),

          // Financial
          sectionTitle('Situation financière'),
          dataTable([
            { label: 'Revenu mensuel', value: profile?.monthly_income ? formatAmount(profile.monthly_income as number) : null },
            { label: 'Charges mensuelles', value: profile?.monthly_expenses ? formatAmount(profile.monthly_expenses as number) : null },
            { label: 'Autres crédits', value: profile?.other_credits ? formatAmount(profile.other_credits as number) : null },
          ]),

          // Loan
          sectionTitle('Crédit demandé'),
          dataTable([
            {
              label: 'Type de crédit',
              value: app.loan_type ? LOAN_TYPE_LABELS[app.loan_type as keyof typeof LOAN_TYPE_LABELS] : null,
            },
            { label: 'Montant', value: app.amount ? formatAmount(app.amount as number) : null },
            { label: 'Durée', value: app.duration_months ? `${app.duration_months} mois` : null },
            { label: 'Objet du prêt', value: app.purpose as string },
          ]),

          // KYC docs
          sectionTitle('Documents KYC'),
          dataTable(
            docs.length > 0
              ? docs.map((doc) => ({
                  label: DOCUMENT_LABELS[doc.document_type as DocumentType],
                  value: '✓ Téléversé',
                }))
              : [{ label: 'Aucun document', value: '-' }]
          ),

          // History
          sectionTitle('Historique du dossier'),
          ...history.flatMap((entry, i) => {
            const agent = entry.internal_users
            return [
              new Paragraph({
                spacing: { before: i === 0 ? 0 : 80, after: 20 },
                children: [
                  new TextRun({
                    text: `${STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS] ?? entry.status}`,
                    bold: true,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: entry.note ? 20 : 80 },
                children: [
                  new TextRun({
                    text: `${formatDateTime(entry.changed_at)}${agent?.full_name ? ` · ${agent.full_name}` : ''}`,
                    color: GRAY,
                    size: 16,
                  }),
                ],
              }),
              ...(entry.note
                ? [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [new TextRun({ text: entry.note, size: 17, italics: true })],
                    }),
                  ]
                : []),
            ]
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
