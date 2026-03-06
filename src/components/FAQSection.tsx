import { useState } from 'react';

const faqs = [
  {
    q: 'Why is there a waitlist?',
    a: "We're releasing GegoBooks gradually to ensure the best experience for early users.",
  },
  {
    q: 'What does the $1 Priority Waitlist do?',
    a: 'Priority members get access before the public launch and move ahead of the free waitlist.',
  },
  {
    q: 'What is the Founder Circle?',
    a: 'Founder Circle members are the earliest 100 supporters of GegoBooks. They receive special perks, recognition, and direct access to the founder.',
  },
  {
    q: 'When will GegoBooks launch?',
    a: "We're currently preparing the early access version. Waitlist members will be the first to know.",
  },
  {
    q: 'What languages will GegoBooks support?',
    a: "We're starting with English and Pidgin English, with more African languages coming soon.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="fade-up text-center mb-12">
          <h2 className="font-heading font-bold text-2xl md:text-4xl text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="fade-up border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-heading font-semibold text-foreground">{faq.q}</span>
                <span className="text-muted text-xl ml-4">
                  {openIndex === i ? '−' : '+'}
                </span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="font-body text-sm text-muted">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
