// Supplied Week 0 screenshot: questions 1–6. Preserve its wording and option order.
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
  }
].map(q=>({...q,bank:'assignments',id:`w0q${q.number}`,type:q.correct.length>1?'multiple':'single'}));
