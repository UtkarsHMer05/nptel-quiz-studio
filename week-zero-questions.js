// Supplied Week 0 screenshots: questions 1–10. Preserve their wording and option order.
export const weekZeroQuestions = [
  {
    week:0, number:1,
    text:'What does IPO stand for in the context of business?',
    options:['Initial Public Offering','Internal Profit Optimization','International Product Organization','Investment Potfolio Overview'],
    correct:[0],
    explanation:'IPO means Initial Public Offering: the first sale of a company’s shares to the public.',
    source:{title:'SEC Investor.gov — Initial Public Offering (IPO)',url:'https://www.investor.gov/introduction-investing/investing-basics/glossary/initial-public-offering-ipo'}
  },
  {
    week:0, number:2,
    text:'Which of the following best describes a partnership?',
    options:['A business owned by a single individual','A business structure where two or more individuals share ownership and responsibilities','A government-owned company','A business with no formal ownership structure'],
    correct:[1],
    explanation:'A partnership involves two or more people owning a business together. The option about shared ownership and responsibilities describes this structure.',
    source:{title:'U.S. Small Business Administration — Choose a business structure',url:'https://www.sba.gov/counseling/launch-your-business/'}
  },
  {
    week:0, number:3,
    text:'Problem-solving, critical thinking, and idea generation are techniques used for:',
    options:['Analyzing market trends','Enhancing creativity and innovation','Building brand awareness','Streamlining production processes'],
    correct:[1],
    explanation:'Generating ideas, evaluating them critically, and solving problems support creativity and innovation. OECD’s creative-thinking framework includes generating, evaluating, and improving ideas in problem-solving contexts.',
    source:{title:'OECD — PISA 2022 Creative Thinking',url:'https://www.oecd.org/en/topics/sub-issues/creative-thinking/pisa-2022-creative-thinking.html'}
  },
  {
    week:0, number:4,
    text:"In a SWOT analysis, what does the 'T' represent?",
    options:['Treat','Threat','Trick','Tactics'],
    correct:[1],
    explanation:'SWOT stands for Strengths, Weaknesses, Opportunities, and Threats. The T identifies external threats that could affect the business.',
    source:{title:'Business Queensland — SWOT analysis',url:'https://www.business.qld.gov.au/running-business/planning/swot-analysis'}
  },
  {
    week:0, number:5,
    text:'Which of the following is not a type of business structure?',
    options:['Sole proprietorship','Partnership','Corporation','Trademark'],
    correct:[3],
    explanation:'A trademark identifies the source of goods or services and is a form of intellectual property. Sole proprietorships, partnerships, and corporations are business structures.',
    source:{title:'USPTO — Trademark, patent, or copyright',url:'https://www.uspto.gov/trademarks/basics/trademark-patent-copyright'}
  },
  {
    week:0, number:6,
    text:'What does KPI stand for in business metrics?',
    options:['Key Process Indicator','Key Performance Indicator','Knowledge Productivity Index','Key Profit Insight'],
    correct:[1],
    explanation:'KPI means Key Performance Indicator. It is a measurable value used to assess progress toward a business objective.',
    source:{title:'Microsoft Learn — Using key performance indicators (KPIs) to meet your business goals',url:'https://learn.microsoft.com/en-gb/dynamics365/business-central/analytics-about-kpis'}
  },
  {
    week:0, number:7,
    text:'Which of the following is essential for starting a successful business?',
    options:['Identifying a target market','Developing a business plan','Securing funding','All of the above'],
    correct:[3],
    explanation:'Understanding the target market, planning the business, and arranging the funds needed to start it are all relevant steps. Funding can include the founder’s own money; it does not have to come from outside investors. All of the above is the best option.',
    source:{title:'U.S. Small Business Administration — Plan your business',url:'https://www.sba.gov/counseling/plan-your-business/'}
  },
  {
    week:0, number:8,
    text:'What is a key benefit of using social media for business marketing?',
    options:['Reducing product quality','Directly engaging with customers and building brand loyalty','Eliminating the need for a website','Limiting customer feedback to specific groups'],
    correct:[1],
    explanation:'Social media enables direct conversations with customers and helps businesses build trust, relationships, and brand awareness. It complements other marketing channels rather than eliminating the need for a website.',
    source:{title:'Business Queensland — Social media for business',url:'https://www.business.qld.gov.au/running-business/marketing-sales/marketing/websites-social-media/social-media'}
  },
  {
    week:0, number:9,
    text:'What do OYO Rooms and Swiggy have in common?',
    options:['Same business model','Both are tech startups','Both are valued at over $1 billion (Unicorns)','Both business models are free from financial risks'],
    correct:[2], keyStatus:'inferred',
    explanation:'The probable intended course answer is the unicorn option: both companies achieved startup valuations above $1 billion. This question is ambiguous because both also have technology-led startup origins. Swiggy became publicly listed in 2024, so “Unicorns” describes its historical private-company status. The official assignment answer key has not been provided; this practice key is inferred, not confirmed.',
    source:{title:'Reuters — Swiggy’s $10.7 billion pre-IPO valuation',url:'https://www.reuters.com/world/india/swiggy-targets-15-bln-valuation-india-ipo-sources-say-2024-08-23/',additional:[
      {title:'Business Standard / Reuters — OYO’s 2018 funding and valuation',url:'https://www.business-standard.com/amp/article/reuters/indian-hotel-chain-oyo-to-raise-1-billion-from-softbank-others-118092500637_1.html'},
      {title:'Swiggy — Company history and 2024 public listing',url:'https://www.swiggy.com/corporate/'}
    ]}
  },
  {
    week:0, number:10,
    text:'Choose the most appropriate definition of entrepreneurship:',
    options:['Copying business ideas from other companies','Starting a business','Developing ideas and research papers','Earning profits'],
    correct:[1],
    explanation:'Among these options, starting a business best captures entrepreneurship: acting on an opportunity to create a venture. Generating ideas and earning profits can be part of the process, but neither alone defines entrepreneurship.',
    source:{title:'Cambridge Dictionary — Entrepreneurship',url:'https://dictionary.cambridge.org/dictionary/english/entrepreneurship'}
  }
].map(q=>({...q,bank:'assignments',id:`w0q${q.number}`,type:q.correct.length>1?'multiple':'single'}));
