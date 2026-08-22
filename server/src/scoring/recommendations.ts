import type { QuestionDomain } from '../types.js';
import { LOW_RISK_MIN, type DomainScore } from './engine.js';

export type Recommendation = {
  domain: QuestionDomain;
  priority: number;
  title: string;
  detail: string;
};

const DOMAIN_RECOMMENDATIONS: Record<
  QuestionDomain,
  Omit<Recommendation, 'domain' | 'priority'>[]
> = {
  access_control: [
    {
      title: 'Give each person their own login and turn on MFA',
      detail:
        'A low access-control score usually means shared mailboxes or an owner account without multi-factor authentication. For an SME, that is how a single phished password becomes a hijacked bank or supplier email. Create individual accounts, turn MFA on for email and cloud admin, and disable leavers the same day.',
    },
    {
      title: 'Cut the number of people with admin or owner rights',
      detail:
        'If admin reviews are rare, a former contractor or an unused “manager” login may still be live. Review who can reset passwords or pay invoices every quarter and remove access that is not needed for day-to-day work.',
    },
  ],
  data_backup: [
    {
      title: 'Keep one backup the ransomware cannot reach',
      detail:
        'A low backup score typically means files live only on one PC or one synced cloud folder. When ransomware or a stolen laptop hits, that copy goes too. Use automatic backups and keep at least one copy offline, in a separate cloud account, or with versioning the staff PCs cannot overwrite.',
    },
    {
      title: 'Actually restore a file, not just “we think it is backed up”',
      detail:
        'Many small firms discover at restore time that the backup job has been failing for months. Restore a sample invoice or customer list every quarter and write down who does it if the owner is away.',
    },
  ],
  network_device_security: [
    {
      title: 'Change the router and Wi-Fi default password',
      detail:
        'A low network-device score often means the ISP router still uses the sticker password or “admin”. That lets a visitor or a neighbour’s device reach printers and shared folders. Set a unique admin password, split guest Wi-Fi from staff devices, and turn remote administration off unless you need it.',
    },
    {
      title: 'Patch the firewall and Wi-Fi box on a calendar, not when it breaks',
      detail:
        'SME routers sit unpatched for years. Firmware updates close holes that are already being scanned on home and office broadband. Check for updates at least quarterly, or replace kit the vendor no longer supports.',
    },
  ],
  security_awareness: [
    {
      title: 'Train staff on fake invoices and password-reset emails',
      detail:
        'A low awareness score means people will treat a rushed payment request or a “mailbox full” link as normal. For an SME that is how supplier-bank details get changed. Run a short yearly briefing, and give staff one person or mailbox to forward suspicious mail to before they click or pay.',
    },
    {
      title: 'Write three rules for customer data and passwords',
      detail:
        'Without a written rule, staff reuse the owner’s password or send customer lists over personal WhatsApp. A one-page note — unique passwords, no shared logins, customer files stay in the business systems — is enough to start and is what an insurer will ask for after a claim.',
    },
  ],
  incident_response_readiness: [
    {
      title: 'Write who to call if you are locked out tomorrow',
      detail:
        'A low incident-response score means there is no plan beyond “ring the owner”. If the owner is away, ransomware or a stolen laptop stops the shop. List IT support, the bank fraud line, the insurer, and (if you hold personal data) the data-protection contact, and store a paper copy off the main PC.',
    },
    {
      title: 'Make sure someone else can run email and payments',
      detail:
        'SMEs often have one person who knows every password. If they are unavailable, you cannot reset MFA or talk to the host. Share break-glass access with a second trusted person and keep basic logs (mailbox sign-in alerts, backup reports) so you can see what happened after a scare.',
    },
  ],
};

export function recommendationsFor(domains: DomainScore[]): Recommendation[] {
  const weak = domains
    .filter((domain) => domain.score < LOW_RISK_MIN)
    .sort((a, b) => a.score - b.score || a.domain.localeCompare(b.domain));

  const items: Recommendation[] = [];
  let priority = 1;
  for (const domain of weak) {
    for (const item of DOMAIN_RECOMMENDATIONS[domain.domain]) {
      items.push({
        domain: domain.domain,
        priority,
        title: item.title,
        detail: item.detail,
      });
      priority += 1;
    }
  }
  return items;
}
