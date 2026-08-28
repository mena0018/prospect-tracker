import { ArrowLeft, Building2, Link2, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { QueryGate } from '@/components/query-gate'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { cn, formatDate, formatValue } from '@/lib/utils'
import { ContactSheet } from '@/modules/contacts/components/contact-sheet'
import { DeleteContactDialog } from '@/modules/contacts/components/delete-contact-dialog'
import { RelationshipBadge } from '@/modules/contacts/components/relationship-badge'
import { CONTACTS_SEARCH_DEFAULTS } from '@/modules/contacts/contacts-schema'
import { useContact } from '@/modules/contacts/hooks/use-contacts'
import { useContactEditor } from '@/modules/contacts/hooks/use-contact-editor'
import { contactDisplayName, contactInitials } from '@/modules/contacts/utils/display'
import { formatDailyRate } from '@/modules/opportunities/utils/display'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import type { Contact } from '@/db/schema'
import type { ContactOpportunity } from '@/modules/contacts/contacts-server'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col gap-4 overflow-y-auto'
const CARD_LAYOUT = 'bg-card border-border flex flex-col rounded-xl border'

type Props = { contactId: string }

export function ContactDetail({ contactId }: Props) {
  const detailQuery = useContact(contactId)
  const editor = useContactEditor()
  const navigate = useNavigate()

  return (
    <div className={PANEL_LAYOUT}>
      <QueryGate queries={[detailQuery]} skeleton={<ContactDetailSkeleton />}>
        {([detail]) => (
          <>
            <ContactHeader
              contact={detail.contact}
              onEdit={() => editor.openEdit(detail.contact)}
              onDelete={() => editor.requestDelete(detail.contact)}
            />
            <OpportunitiesCard opportunities={detail.opportunities} />

            <ContactSheet
              open={editor.editor !== null}
              onOpenChange={(next) => {
                if (!next) editor.closeEditor()
              }}
              contact={editor.editor?.contact ?? null}
              onSubmit={async (values) => void (await editor.submit(values))}
            />

            <DeleteContactDialog
              open={editor.deleting !== null}
              onOpenChange={(next) => {
                if (!next) editor.cancelDelete()
              }}
              name={contactDisplayName(detail.contact)}
              isPending={editor.isDeleting}
              onConfirm={() => {
                void editor.confirmDelete().then(() => {
                  // The record no longer exists, so staying on its page would 404 on refetch.
                  void navigate({ to: APP_ROUTES.contacts, search: CONTACTS_SEARCH_DEFAULTS })
                })
              }}
            />
          </>
        )}
      </QueryGate>
    </div>
  )
}

type HeaderProps = {
  contact: Contact
  onEdit: () => void
  onDelete: () => void
}

function ContactHeader({ contact, onEdit, onDelete }: HeaderProps) {
  const subtitle = [contact.jobTitle, contact.company].filter(Boolean).join(' · ')

  return (
    <div className={cn(CARD_LAYOUT, 'gap-5 p-5.5')}>
      <div className="flex flex-wrap items-start gap-4">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={m.contact_detailBack()}
          render={<Link to={APP_ROUTES.contacts} search={CONTACTS_SEARCH_DEFAULTS} />}
          className="text-secondary-foreground flex-none rounded-lg"
        >
          <ArrowLeft />
        </Button>

        <span className="bg-secondary text-secondary-foreground flex size-12 flex-none items-center justify-center rounded-full text-sm font-semibold">
          {contactInitials(contact)}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-heading text-md truncate font-semibold">
            {contactDisplayName(contact)}
          </h1>
          {subtitle ? (
            <span className="text-muted-foreground truncate text-sm">{subtitle}</span>
          ) : null}
          <RelationshipBadge relationship={contact.relationship} className="mt-1 w-fit" />
        </div>

        <div className="flex flex-none gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.75">
            <Pencil />
            {m.common_edit()}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={m.common_delete()}
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <Separator className="bg-border-soft" />

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {contact.emails.map((email) => (
          <Reachability key={email} icon={<Mail />} value={email} href={`mailto:${email}`} />
        ))}
        {contact.phones.map((phone) => (
          <Reachability
            key={phone}
            icon={<Phone />}
            value={phone}
            href={`tel:${phone.replace(/\s/g, '')}`}
            tabular
          />
        ))}
        {contact.linkedinUrl ? (
          <Reachability
            icon={<Link2 />}
            value={contact.linkedinUrl}
            href={contact.linkedinUrl}
            external
          />
        ) : null}
        {contact.city ? <Reachability icon={<MapPin />} value={contact.city} /> : null}
        {contact.company ? <Reachability icon={<Building2 />} value={contact.company} /> : null}
      </div>

      {contact.notes ? (
        <>
          <Separator className="bg-border-soft" />
          <p className="text-secondary-foreground text-sm whitespace-pre-wrap">{contact.notes}</p>
        </>
      ) : null}
    </div>
  )
}

type ReachabilityProps = {
  icon: React.ReactNode
  value: string
  href?: string
  external?: boolean
  tabular?: boolean
}

function Reachability({ icon, value, href, external, tabular }: ReachabilityProps) {
  const content = (
    <>
      <span className="text-muted-foreground flex-none [&>svg]:size-4">{icon}</span>
      <span className={cn('truncate', tabular && 'tabular-nums')}>{value}</span>
    </>
  )

  const className = 'flex min-w-0 items-center gap-2.5 text-sm'

  if (!href) return <span className={className}>{content}</span>

  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noreferrer noopener' })}
      className={cn(className, 'hover:text-primary transition-colors')}
    >
      {content}
    </a>
  )
}

function OpportunitiesCard({ opportunities }: { opportunities: ContactOpportunity[] }) {
  return (
    <div className={cn(CARD_LAYOUT, 'min-h-0')}>
      <div className="border-border-soft flex flex-none items-center gap-3 border-b px-5.5 py-4">
        <h2 className="text-secondary-foreground tracking-label text-2xs font-semibold uppercase">
          {m.contact_detailOpportunities()}
        </h2>
        <span className="text-muted-foreground bg-secondary rounded-full px-1.75 text-xs font-semibold tabular-nums">
          {opportunities.length}
        </span>
      </div>

      {opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 px-4 py-14 text-center">
          <span className="font-semibold">{m.contact_detailNoOpportunities()}</span>
          <span className="text-muted-foreground text-xs">
            {m.contact_detailNoOpportunitiesHint()}
          </span>
        </div>
      ) : (
        <ul className="divide-border-soft divide-y">
          {opportunities.map((opportunity) => (
            <li
              key={opportunity.id}
              className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-2 px-5.5 py-3.5',
                opportunity.isArchived && 'opacity-60'
              )}
            >
              <div className="flex min-w-0 grow basis-60 flex-col">
                <span className="truncate text-sm font-semibold">
                  {opportunity.need ?? m.opportunity_untitled()}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {[opportunity.esn, opportunity.endClient].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>

              <StageBadge
                name={opportunity.stageName}
                color={opportunity.stageColor}
                className="flex-none"
              />

              <span className="text-secondary-foreground flex-none text-sm font-semibold tabular-nums">
                {formatDailyRate(opportunity.dailyRate)}
              </span>

              <span className="text-muted-foreground w-22 flex-none text-right text-sm tabular-nums">
                {formatValue(
                  opportunity.lastContactAt ? formatDate(opportunity.lastContactAt) : null
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ContactDetailSkeleton() {
  return (
    <div className={PANEL_LAYOUT}>
      <div className={cn(CARD_LAYOUT, 'gap-5 p-5.5')}>
        <div className="flex items-start gap-4">
          <Skeleton className="size-8 flex-none rounded-lg" />
          <Skeleton className="size-12 flex-none rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Separator className="bg-border-soft" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-44" />
          ))}
        </div>
      </div>
      <div className={CARD_LAYOUT}>
        <div className="border-border-soft border-b px-5.5 py-4">
          <Skeleton className="h-4 w-40" />
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="px-5.5 py-3.5">
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
