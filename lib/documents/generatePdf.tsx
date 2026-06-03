import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer'
import {
  STATUS_LABELS,
  LOAN_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DocumentType,
  DOCUMENT_LABELS,
} from '@/lib/types'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '2px solid #1B5FAA',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1B5FAA',
  },
  brandSub: {
    fontSize: 9,
    color: '#6b7280',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  appNumber: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#D3E4F5',
  },
  statusText: {
    fontSize: 9,
    color: '#154D8C',
    fontFamily: 'Helvetica-Bold',
  },
  meta: {
    fontSize: 8.5,
    color: '#6b7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1B5FAA',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: '1px solid #e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '1px solid #f3f4f6',
  },
  label: {
    width: '40%',
    color: '#6b7280',
    fontSize: 9.5,
  },
  value: {
    width: '60%',
    color: '#1f2937',
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },
  historyItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
    borderBottom: '1px solid #f3f4f6',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 2,
    flexShrink: 0,
  },
  historyText: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
  },
  historyMeta: {
    fontSize: 8.5,
    color: '#9ca3af',
    marginTop: 1,
  },
  historyNote: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 16,
  },
  col: {
    flex: 1,
  },
})

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

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

interface AppData {
  application: Record<string, unknown>
  profile: Record<string, unknown> | null
  history: { status: string; changed_at: string; note?: string | null; internal_users?: { full_name?: string } | null }[]
  docs: { document_type: string }[]
}

function ApplicationPDF({ data }: { data: AppData }) {
  const { application: app, profile, history, docs } = data

  return (
    <Document
      title={`Dossier ${app.application_number}`}
      author="CréditPro"
      subject="Demande de crédit"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>CréditPro</Text>
            <Text style={styles.brandSub}>Plateforme de demande de crédit</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.appNumber}>{String(app.application_number)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS] ?? String(app.status)}
              </Text>
            </View>
            {!!app.submitted_at && (
              <Text style={styles.meta}>Soumis le {formatDate(String(app.submitted_at))}</Text>
            )}
            <Text style={styles.meta}>Généré le {formatDate(new Date().toISOString())}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            {/* Client */}
            <Section title="Informations client">
              <DataRow label="Nom complet" value={profile?.full_name as string} />
              <DataRow label="Email" value={profile?.email as string} />
              <DataRow label="Téléphone" value={profile?.phone as string} />
              <DataRow label="Date de naissance" value={profile?.date_of_birth as string} />
              <DataRow label="Nationalité" value={profile?.nationality as string} />
              <DataRow label="Adresse" value={profile?.address as string} />
            </Section>

            {/* Professional */}
            <Section title="Situation professionnelle">
              <DataRow label="Profession" value={profile?.profession as string} />
              <DataRow label="Employeur" value={profile?.employer as string} />
              <DataRow
                label="Type de contrat"
                value={profile?.contract_type ? CONTRACT_TYPE_LABELS[profile.contract_type as keyof typeof CONTRACT_TYPE_LABELS] : null}
              />
              <DataRow
                label="Ancienneté"
                value={profile?.seniority_years ? `${profile.seniority_years} ans` : null}
              />
            </Section>
          </View>

          <View style={styles.col}>
            {/* Financial */}
            <Section title="Situation financière">
              <DataRow
                label="Revenu mensuel"
                value={profile?.monthly_income ? formatAmount(profile.monthly_income as number) : null}
              />
              <DataRow
                label="Charges mensuelles"
                value={profile?.monthly_expenses ? formatAmount(profile.monthly_expenses as number) : null}
              />
              <DataRow
                label="Autres crédits"
                value={profile?.other_credits ? formatAmount(profile.other_credits as number) : null}
              />
            </Section>

            {/* Loan */}
            <Section title="Crédit demandé">
              <DataRow
                label="Type de crédit"
                value={app.loan_type ? LOAN_TYPE_LABELS[app.loan_type as keyof typeof LOAN_TYPE_LABELS] : null}
              />
              <DataRow
                label="Montant"
                value={app.amount ? formatAmount(app.amount as number) : null}
              />
              <DataRow
                label="Durée"
                value={app.duration_months ? `${app.duration_months} mois` : null}
              />
              <DataRow label="Objet du prêt" value={app.purpose as string} />
            </Section>

            {/* KYC docs */}
            <Section title="Documents KYC">
              {docs.length > 0 ? (
                docs.map((doc) => (
                  <View key={doc.document_type} style={styles.row}>
                    <Text style={styles.label}>{DOCUMENT_LABELS[doc.document_type as DocumentType]}</Text>
                    <Text style={{ ...styles.value, color: '#16a34a' }}>✓ Téléversé</Text>
                  </View>
                ))
              ) : (
                <Text style={{ ...styles.meta, marginTop: 4 }}>Aucun document</Text>
              )}
            </Section>
          </View>
        </View>

        {/* History */}
        <Section title="Historique du dossier">
          {history.map((entry, i) => {
            const agent = entry.internal_users
            return (
              <View key={i} style={styles.historyItem}>
                <View style={styles.dot} />
                <View style={styles.historyText}>
                  <Text style={styles.historyStatus}>
                    {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS] ?? entry.status}
                  </Text>
                  {entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                  <Text style={styles.historyMeta}>
                    {formatDateTime(entry.changed_at)}
                    {agent?.full_name ? ` · ${agent.full_name}` : ''}
                  </Text>
                </View>
              </View>
            )
          })}
        </Section>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>CréditPro - Document confidentiel</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function generateApplicationPdf(data: AppData): Promise<Buffer> {
  const element = <ApplicationPDF data={data} />
  return renderToBuffer(element)
}
