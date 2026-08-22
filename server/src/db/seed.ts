import { pool } from './pool.js';

type QuestionSeed = {
  id: string;
  domain:
    | 'access_control'
    | 'data_backup'
    | 'network_device_security'
    | 'security_awareness'
    | 'incident_response_readiness';
  text: string;
  weight: number;
  answer_type: 'yes_no' | 'scale' | 'multiple_choice';
  options: Record<string, unknown>;
};

const yesNo = { choices: ['yes', 'no'] };
const scale = { min: 1, max: 5 };

const questions: QuestionSeed[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    domain: 'access_control',
    text: 'Does each staff member have their own login, rather than sharing one account for email or finance systems?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    domain: 'access_control',
    text: 'Is multi-factor authentication turned on for business email and any admin or cloud accounts?',
    weight: 3,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    domain: 'access_control',
    text: 'When someone leaves the business, are their accounts disabled the same day?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    domain: 'access_control',
    text: 'How often do you review who has administrator or owner access to key systems?',
    weight: 1.5,
    answer_type: 'multiple_choice',
    options: {
      choices: ['every_quarter', 'once_a_year', 'rarely_or_never'],
    },
  },
  {
    id: '11111111-1111-4111-8111-111111111201',
    domain: 'data_backup',
    text: 'Are customer records, invoices, and other critical files backed up automatically?',
    weight: 3,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111202',
    domain: 'data_backup',
    text: 'Do you keep at least one backup copy off-site or in a separate cloud account from the live files?',
    weight: 2.5,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111203',
    domain: 'data_backup',
    text: 'Have you successfully restored a file from backup in the last 12 months?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111204',
    domain: 'data_backup',
    text: 'How confident are you that ransomware could not encrypt your backups as well as live files?',
    weight: 2,
    answer_type: 'scale',
    options: scale,
  },
  {
    id: '11111111-1111-4111-8111-111111111301',
    domain: 'network_device_security',
    text: 'Have default passwords been changed on the office router, firewall, and Wi-Fi?',
    weight: 3,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111302',
    domain: 'network_device_security',
    text: 'Is guest Wi-Fi separated from the network that staff devices and printers use?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111303',
    domain: 'network_device_security',
    text: 'How often do you apply firmware or security updates to network devices?',
    weight: 1.5,
    answer_type: 'multiple_choice',
    options: {
      choices: ['at_least_quarterly', 'once_a_year', 'only_when_something_breaks'],
    },
  },
  {
    id: '11111111-1111-4111-8111-111111111304',
    domain: 'network_device_security',
    text: 'Is remote administration of the router or firewall limited to known people or turned off if unused?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111401',
    domain: 'security_awareness',
    text: 'Do staff receive phishing or security-awareness training at least once a year?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111402',
    domain: 'security_awareness',
    text: 'Is there a short written rule for how staff should handle customer data and passwords?',
    weight: 1.5,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111403',
    domain: 'security_awareness',
    text: 'Do staff have a clear way to report a suspicious email or payment request?',
    weight: 1.5,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111404',
    domain: 'security_awareness',
    text: 'How well would a typical staff member recognise a fake invoice or password-reset email?',
    weight: 2,
    answer_type: 'scale',
    options: scale,
  },
  {
    id: '11111111-1111-4111-8111-111111111501',
    domain: 'incident_response_readiness',
    text: 'Do you have a written plan for what to do if accounts are locked, data is lost, or a device is stolen?',
    weight: 2.5,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111502',
    domain: 'incident_response_readiness',
    text: 'Do you know who to call after an incident (IT support, insurer, bank, or data-protection contact)?',
    weight: 2,
    answer_type: 'yes_no',
    options: yesNo,
  },
  {
    id: '11111111-1111-4111-8111-111111111503',
    domain: 'incident_response_readiness',
    text: 'Could the business keep operating if the main admin or owner were unavailable for several days?',
    weight: 1.5,
    answer_type: 'scale',
    options: scale,
  },
  {
    id: '11111111-1111-4111-8111-111111111504',
    domain: 'incident_response_readiness',
    text: 'Do you keep basic logs or records that would help you see what happened after a suspected incident?',
    weight: 1.5,
    answer_type: 'yes_no',
    options: yesNo,
  },
];

export async function seedQuestions(): Promise<number> {
  let upserted = 0;

  for (const question of questions) {
    await pool.query(
      `
        INSERT INTO questions (id, domain, text, weight, answer_type, options, active)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, true)
        ON CONFLICT (id) DO UPDATE SET
          domain = EXCLUDED.domain,
          text = EXCLUDED.text,
          weight = EXCLUDED.weight,
          answer_type = EXCLUDED.answer_type,
          options = EXCLUDED.options,
          active = EXCLUDED.active
      `,
      [
        question.id,
        question.domain,
        question.text,
        question.weight,
        question.answer_type,
        JSON.stringify(question.options),
      ],
    );
    upserted += 1;
  }

  return upserted;
}

async function runCli(): Promise<void> {
  try {
    const count = await seedQuestions();
    console.log(`Seeded ${count} questions across five domains.`);
  } finally {
    await pool.end();
  }
}

const isDirectRun = /seed\.(ts|js)$/.test(process.argv[1] ?? '');

if (isDirectRun) {
  runCli().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
