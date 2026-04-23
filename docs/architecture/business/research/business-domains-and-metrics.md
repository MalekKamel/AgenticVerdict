# Business Domains & Metrics Framework

**Research Area:** Standard metrics, KPI frameworks, and best practices by business domain

**Research Date:** 2026-04-10

---

## Executive Summary

Effective business intelligence requires understanding the right metrics for each domain. This research synthesizes industry-standard metrics and KPI frameworks for Marketing, Finance, SEO, Social Media, and Local Business domains to inform connector and metric design.

---

## 1. Marketing Domain

### 1.1 Core Marketing Metrics

| Metric                         | Category    | Calculation                           | Business Question                |
| ------------------------------ | ----------- | ------------------------------------- | -------------------------------- |
| **Sessions**                   | Traffic     | Count of user visits                  | How many people visited?         |
| **Users**                      | Audience    | Unique visitors                       | How many unique people?          |
| **Pageviews**                  | Traffic     | Total pages loaded                    | How engaging is content?         |
| **Bounce Rate**                | Engagement  | Single-page sessions / Total sessions | Is content relevant?             |
| **Session Duration**           | Engagement  | Avg time per session                  | How long do people stay?         |
| **Conversion Rate**            | Performance | Conversions / Sessions                | How effective is the funnel?     |
| **Cost Per Acquisition (CPA)** | Efficiency  | Ad Spend / Conversions                | How efficient is spending?       |
| **Return on Ad Spend (ROAS)**  | Performance | Revenue / Ad Spend                    | What's the return on investment? |
| **Click-Through Rate (CTR)**   | Engagement  | Clicks / Impressions                  | How compelling is the creative?  |
| **Impressions**                | Reach       | Ad display count                      | How many saw the message?        |
| **Reach**                      | Audience    | Unique people who saw ad              | How broad is the reach?          |
| **Frequency**                  | Reach       | Impressions / Reach                   | How often was message seen?      |

### 1.2 Marketing KPI Frameworks

**AIDA Model (Awareness → Interest → Desire → Action):**

- **Awareness:** Impressions, Reach, CPM
- **Interest:** Clicks, CTR, Video Views
- **Desire:** Engagement, Time on Site, Pages/Session
- **Action:** Conversions, Revenue, ROAS

**Marketing Attribution Models:**

- **First-Touch:** Credit first interaction
- **Last-Touch:** Credit final interaction
- **Linear:** Equal credit across all touchpoints
- **Time-Decay:** More credit to recent touchpoints
- **Data-Driven:** Algorithmic attribution

### 1.3 Marketing Metrics by Platform

| Platform       | Key Metrics                             | Unique Value                   |
| -------------- | --------------------------------------- | ------------------------------ |
| **GA4**        | Sessions, Conversions, Revenue, Events  | Website analytics foundation   |
| **Meta**       | Reach, Impressions, CTR, CPC, ROAS      | Social advertising performance |
| **TikTok**     | Views, Engagement, Shares, Followers    | Short-form video metrics       |
| **Google Ads** | Impressions, Clicks, CPC, Quality Score | Search advertising performance |
| **LinkedIn**   | Impressions, CTR, Engagement, Leads     | B2B social advertising         |

---

## 2. Finance Domain

### 2.1 Core Finance Metrics

| Metric                  | Category      | Calculation                          | Business Question            |
| ----------------------- | ------------- | ------------------------------------ | ---------------------------- |
| **Revenue**             | Income        | Total sales/income                   | How much money coming in?    |
| **Expenses**            | Cost          | Total operating costs                | How much money going out?    |
| **Gross Profit**        | Profitability | Revenue - COGS                       | Profit before overhead       |
| **Net Profit**          | Profitability | Revenue - All Expenses               | Bottom-line profit           |
| **Gross Margin**        | Profitability | Gross Profit / Revenue               | Efficiency of production     |
| **Net Margin**          | Profitability | Net Profit / Revenue                 | Overall profitability        |
| **Operating Cash Flow** | Cash          | Cash from operations                 | Cash generated from business |
| **Accounts Receivable** | Assets        | Money owed by customers              | Outstanding payments         |
| **Accounts Payable**    | Liabilities   | Money owed to vendors                | Outstanding bills            |
| **Burn Rate**           | Cash          | Monthly cash spent                   | How long until runway ends?  |
| **Runway**              | Cash          | Cash / Burn Rate                     | Months until cash runs out   |
| **CAC**                 | Efficiency    | Sales & Marketing / New Customers    | Cost to acquire customer     |
| **LTV**                 | Value         | Avg Revenue per Customer × Retention | Customer lifetime value      |
| **LTV:CAC Ratio**       | Efficiency    | LTV / CAC                            | Unit economics health        |

### 2.2 Finance KPI Frameworks

**Three-Statement Analysis:**

- **Income Statement:** Revenue, expenses, profit over time
- **Balance Sheet:** Assets, liabilities, equity at a point in time
- **Cash Flow Statement:** Cash inflows/outflows by category

**Unit Economics:**

- **CAC (Customer Acquisition Cost)** — Sales & Marketing spend ÷ New customers
- **LTV (Customer Lifetime Value)** — Avg monthly revenue × Customer lifetime months
- **LTV:CAC** — Ratio of 3:1 is healthy; <1:1 is unsustainable

**SaaS Metrics:**

- **MRR (Monthly Recurring Revenue)** — Predictable monthly revenue
- **ARR (Annual Recurring Revenue)** — Annualized MRR
- **Churn Rate** — Customers canceling ÷ Total customers
- **Net Revenue Retention** — Revenue from existing customers including expansion

### 2.3 Finance Metrics by Platform

| Platform       | Key Metrics                          | Unique Value                       |
| -------------- | ------------------------------------ | ---------------------------------- |
| **QuickBooks** | Revenue, Expenses, Profit, Cash Flow | Small business accounting          |
| **Stripe**     | Transactions, Refunds, MRR, Churn    | Payment processing & subscriptions |
| **Xero**       | Revenue, Expenses, Invoices, Bills   | Cloud accounting (global)          |
| **Brex**       | Card Spend, Limits, Transactions     | Corporate card spending            |

---

## 3. SEO Domain

### 3.1 Core SEO Metrics

| Metric               | Category   | Calculation                      | Business Question           |
| -------------------- | ---------- | -------------------------------- | --------------------------- |
| **Organic Traffic**  | Traffic    | Sessions from organic search     | SEO-driven visitors         |
| **Keyword Rankings** | Visibility | Position in SERPs                | Where do we rank?           |
| **Impressions**      | Visibility | Times appeared in search results | Search visibility           |
| **Clicks**           | Traffic    | Clicks from search results       | Search-driven traffic       |
| **CTR**              | Engagement | Clicks / Impressions             | How compelling are results? |
| **Backlinks**        | Authority  | Links pointing to site           | Off-page SEO strength       |
| **Domain Authority** | Authority  | 1-100 score (Moz)                | Site's SEO strength         |
| **Page Authority**   | Authority  | 1-100 score per page             | Page's SEO strength         |
| **Indexed Pages**    | Technical  | Pages in search index            | Site coverage               |
| **Crawl Errors**     | Technical  | Pages failing to crawl           | Technical health            |
| **Core Web Vitals**  | Experience | LCP, FID, CLS scores             | User experience signals     |

### 3.2 SEO KPI Frameworks

**SEO Health Score:**

- **Technical SEO (30%)** — Site speed, mobile-friendliness, crawlability
- **On-Page SEO (40%)** — Content quality, keyword optimization, meta tags
- **Off-Page SEO (30%)** — Backlinks, domain authority, social signals

**Keyword Opportunity Framework:**

- **High Volume + Low Competition** — Quick wins
- **High Volume + High Competition** — Long-term plays
- **Low Volume + Low Competition** — Niche targeting
- **Low Volume + High Competition** — Avoid

### 3.3 SEO Metrics by Platform

| Platform                  | Key Metrics                                | Unique Value                    |
| ------------------------- | ------------------------------------------ | ------------------------------- |
| **Google Search Console** | Impressions, Clicks, CTR, Position         | Direct from Google search data  |
| **Ahrefs**                | Backlinks, Domain Rating, Keyword rankings | Comprehensive backlink analysis |
| **SEMrush**               | Keyword rankings, Competitor analysis      | Competitive intelligence        |
| **Moz**                   | Domain Authority, Page Authority           | Authority metrics               |

---

## 4. Social Media Domain

### 4.1 Core Social Media Metrics

| Metric                    | Category    | Calculation                         | Business Question        |
| ------------------------- | ----------- | ----------------------------------- | ------------------------ |
| **Followers**             | Audience    | Total followers                     | Audience size            |
| **Reach**                 | Exposure    | Unique people who saw content       | Content exposure         |
| **Impressions**           | Exposure    | Total content views                 | Content visibility       |
| **Engagement Rate**       | Engagement  | (Likes + Comments + Shares) / Reach | How engaging is content? |
| **Likes**                 | Engagement  | Count of likes                      | Basic engagement         |
| **Comments**              | Engagement  | Count of comments                   | Deep engagement          |
| **Shares**                | Virality    | Count of shares/reposts             | Content amplification    |
| **Video Views**           | Consumption | Video plays                         | Content consumption      |
| **Video Completion Rate** | Consumption | Completed views / Started views     | Video retention          |
| **Click-Through Rate**    | Traffic     | Link clicks / Impressions           | Traffic generation       |
| **Mentions**              | Brand       | Times brand was mentioned           | Brand awareness          |
| **Sentiment**             | Brand       | Positive/Negative mention ratio     | Brand perception         |

### 4.2 Social Media KPI Frameworks

**Social Media ROI:**

- **Awareness Metrics** — Reach, Impressions, Followers, Mentions
- **Engagement Metrics** — Likes, Comments, Shares, Engagement Rate
- **Conversion Metrics** — Clicks, Conversions, Revenue from social
- **Cost Metrics** — Cost per follower, Cost per engagement, CPM

**Content Performance Framework:**

- **Viral Coefficient** — Shares ÷ Reach (how shareable is content?)
- **Amplification Rate** — Shares per follower
- **Conversation Rate** — Comments per impression
- **Applause Rate** — Likes per impression

### 4.3 Social Media Metrics by Platform

| Platform                      | Key Metrics                                      | Unique Value                 |
| ----------------------------- | ------------------------------------------------ | ---------------------------- |
| **Meta (Facebook/Instagram)** | Reach, Impressions, Engagement, CTR              | Broad social advertising     |
| **TikTok**                    | Views, Likes, Shares, Followers, Completion Rate | Short-form video performance |
| **LinkedIn**                  | Impressions, CTR, Engagement, Leads              | B2B social & recruitment     |
| **Twitter/X**                 | Impressions, Engagement, Mentions, Followers     | Real-time engagement         |
| **YouTube**                   | Views, Watch Time, Subscribers, CTR              | Long-form video analytics    |

---

## 5. Local Business Domain

### 5.1 Core Local Business Metrics

| Metric                       | Category   | Calculation                    | Business Question        |
| ---------------------------- | ---------- | ------------------------------ | ------------------------ |
| **Calls**                    | Actions    | Phone calls from listing       | Lead generation          |
| **Directions**               | Actions    | Navigation requests            | Foot traffic driver      |
| **Website Visits**           | Traffic    | Clicks to website              | Online traffic source    |
| **Photo Views**              | Engagement | Photo view count               | Visual engagement        |
| **Reviews**                  | Reputation | Count of reviews               | Customer feedback volume |
| **Review Rating**            | Reputation | Average star rating (1-5)      | Customer satisfaction    |
| **Review Sentiment**         | Reputation | Positive/Negative ratio        | Brand perception         |
| **Local Search Impressions** | Visibility | Times appeared in local search | Local visibility         |
| **Local Search Clicks**      | Traffic    | Clicks from local search       | Local search traffic     |
| **Check-ins**                | Engagement | Customer check-ins             | Physical visits          |

### 5.2 Local Business KPI Frameworks

**Local Presence Score:**

- **Profile Completeness (30%)** — Photos, description, hours, categories
- **Review Health (30%)** — Rating, quantity, recency, response rate
- **Engagement (20%)** — Calls, directions, website clicks
- **Search Visibility (20%)** — Impressions, clicks, ranking

**Reputation Management:**

- **Review Velocity** — New reviews per week
- **Response Rate** — Responses to reviews ÷ Total reviews
- **Rating Trend** — 90-day rating change
- **Sentiment Analysis** — Positive vs. negative keywords

### 5.3 Local Business Metrics by Platform

| Platform                    | Key Metrics                        | Unique Value                       |
| --------------------------- | ---------------------------------- | ---------------------------------- |
| **Google Business Profile** | Calls, Directions, Reviews, Photos | Primary local presence             |
| **Yelp**                    | Reviews, Ratings, Page Views       | Restaurant & local service reviews |
| **TripAdvisor**             | Reviews, Ratings, Booking          | Travel & hospitality               |

---

## 6. Cross-Domain Metrics

### 6.1 Multi-Domain Insights

**Marketing → Finance:**

- Marketing efficiency: ROAS, CAC, LTV:CAC
- Budget utilization: Ad spend vs. allocated budget
- Revenue attribution: Marketing-sourced revenue

**SEO → Social:**

- Content amplification: Social shares of SEO content
- Traffic sources: Organic vs. social contribution
- Keyword rankings driving social content topics

**Local → Marketing:**

- Local attribution: Store visits from marketing campaigns
- Regional performance: Marketing impact by location
- Offline conversion: Calls/directions from digital campaigns

### 6.2 Unified KPI Framework

**Business Health Score:**

```
Overall Score = (Marketing × 30%) + (Finance × 30%) + (SEO × 15%) + (Social × 15%) + (Local × 10%)
```

**Domain Scoring:**

- Each domain scored 0-100 based on key metrics
- Thresholds: Poor (0-49), Fair (50-74), Good (75-89), Excellent (90-100)

---

## 7. Metric Selection Best Practices

### 7.1 SMART Criteria for Metrics

**S — Specific:** Clear definition, unambiguous measurement
**M — Measurable:** Quantifiable data available
**A — Actionable:** Can take action based on the metric
**R — Relevant:** Aligns with business objectives
**T — Time-bound:** Measured over consistent time periods

### 7.2 Metric Hierarchy

**Strategic Metrics (North Star):**

- One or two metrics that define business success
- Examples: Revenue, Profit, Customer Lifetime Value

**Operational Metrics:**

- Day-to-day metrics that drive strategic metrics
- Examples: Sessions, Conversions, Engagement Rate

**Diagnostic Metrics:**

- Deep-dive metrics for troubleshooting
- Examples: Bounce Rate, Time on Page, CTR by device

### 7.3 Metric Anti-Patterns

**Avoid Vanity Metrics:**

- Total followers (without engagement context)
- Total pageviews (without conversion context)
- Total impressions (without reach context)

**Avoid Data Silos:**

- Metrics in isolation without cross-domain context
- Platform-specific metrics without normalization
- Reported metrics without actionable insights

---

## 8. Recommendations for AgenticVerdict

### 8.1 Metric Architecture

**Implement a Unified Metric Schema:**

```typescript
interface Metric {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  dataType: MetricDataType;
  domain: BusinessDomain;
  platforms: PlatformMetric[];
  calculation?: string;
  benchmarks?: MetricBenchmark[];
}
```

### 8.2 Prioritized Metrics by Domain

**Phase 1 (MVP):**

**Marketing:**

- Sessions, Users, Pageviews
- Conversions, Conversion Rate
- Ad Spend, Impressions, Clicks, CTR
- ROAS, CPA

**Finance:**

- Revenue, Expenses, Profit
- Operating Cash Flow

**SEO:**

- Organic Traffic, Impressions, Clicks, CTR
- Keyword Rankings

**Social:**

- Followers, Reach, Impressions
- Engagement Rate, Likes, Comments, Shares

**Local:**

- Calls, Directions, Website Visits
- Reviews, Rating

### 8.3 Benchmark Integration

**Include Industry Benchmarks:**

- Allow comparison to industry averages
- Display percentile rankings
- Highlight over/underperformance

**Benchmark Sources:**

- Industry averages (by tenant size, vertical)
- Platform benchmarks (Google Analytics benchmarks)
- Historical performance (period-over-period, year-over-year)

---

## Sources

- Google Analytics 4 metrics reference
- Facebook/Meta Ads metrics documentation
- Google Search Console metrics guide
- Industry KPI frameworks (Databox, Klipfolio)
- Digital marketing standards (IAB, Google Marketing Platform)
