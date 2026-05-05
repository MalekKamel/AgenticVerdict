# Insights & Reports Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the Insights and Reports features through the phased rollout strategy.

## Pre-Deployment Checklist

### Prerequisites

- [ ] All tests passing (unit, integration, E2E, accessibility)
- [ ] Code review completed and approved
- [ ] Security review completed
- [ ] Performance benchmarks acceptable
- [ ] Monitoring dashboards configured
- [ ] Rollback plan documented
- [ ] Stakeholders notified

### Required Resources

- **Feature Flag**: `ENABLE_INSIGHTS_UI`
- **Environment Variables**:
  ```bash
  VITE_PUBLIC_ENABLE_INSIGHTS_UI=true|false
  ```
- **Monitoring**: Sentry, Datadog, or equivalent
- **Support**: On-call engineer assigned

## Phase 1: Development (Complete ✅)

**Status**: ✅ Complete  
**Date**: 2024-02-01  
**Scope**: Development environments only

### Deployment Steps

1. **Enable in development**:

   ```bash
   # .env.local
   VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
   ```

2. **Verify locally**:

   ```bash
   pnpm --filter @agenticverdict/frontend dev
   ```

3. **Test all flows**:
   - Create insight
   - View insight detail
   - Edit insight
   - View reports
   - Share report
   - Download report

### Success Criteria

- [ ] All features work in development
- [ ] No console errors
- [ ] All tests passing
- [ ] Accessibility audit passed

---

## Phase 2: Internal Testing

**Status**: 🔄 Ready to deploy  
**Scope**: Staging environment, internal users only  
**Duration**: 1-2 weeks

### Deployment Steps

1. **Deploy to staging**:

   ```bash
   # CI/CD pipeline
   make deploy-staging
   ```

2. **Enable for internal users**:

   ```bash
   # .env.staging
   VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
   ```

3. **Verify staging deployment**:

   ```bash
   # Health check
   curl https://staging.agenticverdict.com/api/health

   # Verify feature flag
   curl https://staging.agenticverdict.com/api/feature-flags
   ```

4. **Internal testing assignments**:
   - Developer 1: Create/edit insights
   - Developer 2: Reports viewing/downloading
   - QA Engineer: E2E test scenarios
   - Designer: UI/UX review
   - PM: User flow validation

### Monitoring

```typescript
// Monitor error rates
const errorRate = await metrics.getErrorRate("insights");
if (errorRate > 0.01) {
  alert("High error rate in insights feature");
}

// Monitor usage
const usageCount = await metrics.getEventCount("insight_created");
console.log(`Insights created: ${usageCount}`);
```

### Success Criteria

- [ ] Zero critical bugs
- [ ] Error rate < 1%
- [ ] Performance within acceptable range
- [ ] Internal team feedback positive
- [ ] All E2E tests passing in staging

### Rollback Plan

If issues arise:

```bash
# Disable feature flag in staging
echo "VITE_PUBLIC_ENABLE_INSIGHTS_UI=false" >> .env.staging
make deploy-staging
```

---

## Phase 3: Beta Program

**Status**: ⏳ Planned  
**Scope**: Production, beta users only  
**Duration**: 2-4 weeks

### Deployment Steps

1. **Deploy to production**:

   ```bash
   # CI/CD pipeline
   make deploy-production
   ```

2. **Enable for beta users**:

   ```bash
   # .env.production
   VITE_PUBLIC_ENABLE_INSIGHTS_UI=false  # Keep disabled by default

   # Enable via user segment (in app)
   const isEnabled = user.betaFeatures.includes('insights-reports');
   ```

3. **Invite beta users**:
   - Select 10-20 engaged users
   - Send invitation emails
   - Provide feedback channel (Slack/email)
   - Schedule onboarding calls

4. **Monitor closely**:
   ```bash
   # Set up alerts
   make alert-create --name insights-errors --threshold 5
   make alert-create --name insights-latency --threshold 2000
   ```

### Beta User Feedback Collection

```typescript
// In-app feedback widget
function InsightsFeedbackWidget() {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    await submitFeedback({
      feature: 'insights',
      userId: user.id,
      feedback,
      url: window.location.href,
    });
    toast.success('Thank you for your feedback!');
  };

  return (
    <FeedbackForm onSubmit={handleSubmit} />
  );
}
```

### Success Criteria

- [ ] Beta user satisfaction > 80%
- [ ] No P0/P1 bugs
- [ ] Error rate < 0.5%
- [ ] Performance impact < 5%
- [ ] Positive user feedback

### Rollback Plan

If critical issues arise:

```typescript
// Disable for all beta users
await userSegment.removeFeature("insights-reports");

// Or disable globally
await featureFlags.set("ENABLE_INSIGHTS_UI", false);
```

---

## Phase 4: General Availability

**Status**: ⏳ Planned  
**Scope**: Production, all users  
**Duration**: Ongoing

### Deployment Steps

1. **Gradual rollout**:

   ```bash
   # Week 1: 10% of users
   VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
   # User segment: 10%

   # Week 2: 50% of users
   # User segment: 50%

   # Week 3: 100% of users
   # User segment: 100%
   ```

2. **Update documentation**:
   - User guides
   - Help center articles
   - Video tutorials
   - Release notes

3. **Announce launch**:
   - Blog post
   - Email newsletter
   - In-app announcement
   - Social media

4. **Monitor metrics**:

   ```typescript
   // Daily metrics review
   const metrics = {
     dau: await getDailyActiveUsers("insights"),
     creationRate: await getInsightCreationRate(),
     errorRate: await getErrorRate("insights"),
     performance: await getAverageLoadTime("insights"),
   };

   console.log("Insights GA Metrics:", metrics);
   ```

### Success Criteria

- [ ] Adoption rate > 30% of active users
- [ ] Error rate < 0.1%
- [ ] Performance within SLA
- [ ] Support tickets < 1% of users
- [ ] Positive user sentiment

### Monitoring Dashboard

Create dashboard with:

- **Usage Metrics**:
  - Daily active users
  - Insights created per day
  - Reports generated per day
  - Average session duration

- **Performance Metrics**:
  - Page load time
  - API response time
  - Error rate by endpoint
  - 95th percentile latency

- **Business Metrics**:
  - Feature adoption rate
  - User retention
  - Conversion impact
  - Support ticket volume

---

## Phase 5: Flag Removal

**Status**: ⏳ Future  
**Scope**: All environments  
**Timing**: After 4+ weeks of stable GA

### Prerequisites

- [ ] Feature stable for 4+ weeks
- [ ] Error rate consistently < 0.1%
- [ ] No known critical bugs
- [ ] User adoption > 50%
- [ ] Stakeholder approval

### Deployment Steps

1. **Remove feature flag checks**:

   ```typescript
   // Before
   if (isFeatureEnabled('ENABLE_INSIGHTS_UI')) {
     return <InsightsList />;
   }

   // After
   return <InsightsList />;
   ```

2. **Remove environment variable**:

   ```bash
   # Remove from all .env files
   # VITE_PUBLIC_ENABLE_INSIGHTS_UI
   ```

3. **Update documentation**:
   - Remove feature flag references
   - Update deployment guides
   - Archive this runbook

4. **Deploy**:

   ```bash
   make deploy-production
   ```

5. **Verify**:
   ```bash
   # Confirm feature works without flag
   curl https://app.agenticverdict.com/dashboard/insights
   ```

---

## Emergency Rollback

### Immediate Rollback (Any Phase)

If critical issues arise:

```bash
# 1. Disable feature flag
echo "VITE_PUBLIC_ENABLE_INSIGHTS_UI=false" > .env.production

# 2. Redeploy
make deploy-production

# 3. Verify rollback
curl https://app.agenticverdict.com/api/health

# 4. Notify stakeholders
slack-notify "#alerts" "Insights feature rolled back due to [issue]"
```

### Partial Rollback

If issues affect only specific functionality:

```typescript
// Disable specific feature
if (issueType === "create-wizard") {
  disableFeature("insight-creation");
} else if (issueType === "pdf-viewer") {
  disableFeature("pdf-viewing");
}
```

## Post-Deployment Review

### After Each Phase

Conduct retrospective:

1. **What went well?**
2. **What didn't go well?**
3. **What can we improve?**
4. **Action items for next phase**

### Metrics to Review

- Error rates
- Performance metrics
- User feedback
- Support tickets
- Adoption rates

### Documentation Updates

- Update this runbook with lessons learned
- Update user documentation
- Update internal wikis
- Update API documentation

## Contacts

- **Engineering Lead**: [Name]
- **Product Manager**: [Name]
- **On-Call Engineer**: [Rotation Schedule]
- **Support Lead**: [Name]

## Related Documentation

- [Feature Flag Guide](./insights-reports-feature-flag.md)
- [API Integration Examples](../../05-reference/insights-reports-api-examples.md)
- [Routes Documentation](../../05-reference/insights-reports-routes.md)
- [Monitoring Runbook](./monitoring-runbook.md)
