# TypeScript API Frameworks Research Report

**Research Date:** April 2026
**Focus:** Battle-tested API frameworks for TypeScript backend services

---

## Executive Summary

### Quick Recommendations

| Use Case                               | Recommended Framework       | Why                                                        |
| -------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| **Full-Stack TypeScript Apps**         | **tRPC**                    | End-to-end type safety, zero codegen, fastest DX           |
| **Public APIs / Partners**             | **REST (Fastify)**          | Standardization, tooling, caching, broad compatibility     |
| **Complex Data Relationships**         | **GraphQL (Apollo Server)** | Flexible queries, strong ecosystem, prevents over-fetching |
| **High-Performance Internal Services** | **gRPC**                    | Maximum throughput, protobuf efficiency, streaming         |
| **Edge/Serverless**                    | **Hono** or **Elysia**      | Ultra-lightweight, cold-start optimized                    |
| **Enterprise REST**                    | **Fastify**                 | Performance, extensive plugins, enterprise-grade           |

### Key Findings

1. **tRPC dominates developer experience** for TypeScript-first teams but locks you into the ecosystem
2. **GraphQL remains strong** for complex data needs but has steeper learning curve
3. **REST (Fastify) is the safest bet** for public APIs and general use cases
4. **Hono/Elysia are rising stars** for edge computing with superior performance
5. **gRPC is unmatched** for microservice communication but overkill for client-facing APIs

---

## Detailed Comparison Table

| Framework          | GitHub Stars\* | npm Downloads/week | Performance | Type Safety              | Learning Curve | Best For                          |
| ------------------ | -------------- | ------------------ | ----------- | ------------------------ | -------------- | --------------------------------- |
| **tRPC**           | ~35k           | ~800k              | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ (End-to-end)  | Low            | Full-stack TS apps                |
| **Apollo GraphQL** | ~22k           | ~2.5M              | ⭐⭐⭐      | ⭐⭐⭐⭐ (With codegen)  | Medium-High    | Complex data models               |
| **Express**        | ~65k           | ~18M               | ⭐⭐        | ⭐⭐ (Manual)            | Low            | Legacy projects, simplicity       |
| **Fastify**        | ~32k           | ~5M                | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐ (With schemas)  | Low-Medium     | Performance-critical REST         |
| **Hono**           | ~18k           | ~400k              | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐               | Low            | Edge, serverless, modern runtimes |
| **Elysia**         | ~6k            | ~120k              | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐               | Low            | Bun runtime, max performance      |
| **gRPC (Node)**    | ~10k           | ~500k              | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐ (With protobuf) | Medium-High    | Internal microservices            |

\*Approximate figures as of April 2026

---

## Individual Framework Analyses

### 1. tRPC

**Overview:** End-to-end typesafe APIs without schemas or code generation

**Key Metrics:**

- **GitHub:** github.com/trpc/trpc (~35k stars)
- **npm:** ~800k weekly downloads
- **Bundle Size:** ~50KB minified
- **Maintainability:** Active, frequent releases

**Major Tenants Using:**

- Vercel (creators)
- Notion
- Cal.com
- Many startups in the Next.js ecosystem

**Pros:**

- **Zero boilerplate:** Types automatically flow from server to client
- **Incredible DX:** Autocomplete everywhere, no schema drift
- **Minimal overhead:** No JSON schema validation layer
- **Framework agnostic:** Works with React, Vue, Svelte, Solid
- **Built-in batching:** Automatic request batching
- **Subscriptions:** WebSocket support out of the box

**Cons:**

- **TypeScript lock-in:** Client must be TypeScript
- **Non-standard:** Not REST or GraphQL, harder for third parties
- **Limited tooling:** Smaller ecosystem than REST/GraphQL
- **Versioning:** Requires careful API design for backwards compatibility
- **Not ideal for public APIs:** External integrations are difficult

**TypeScript Integration:** ⭐⭐⭐⭐⭐

- Native TypeScript-first framework
- Type inference works automatically
- No separate types file needed
- Generic-based API router for full type safety

**Performance:**

- **Fastest option** for TS-to-TS communication
- Minimal serialization overhead
- HTTP/2 ready with automatic batching
- Comparable to raw REST, faster than GraphQL

**Middleware Ecosystem:**

- Built-in middleware (logging, auth, context)
- Smaller but growing community
- Easy to write custom middleware
- Integrations with popular auth providers

**Client Story:**

- **No codegen needed** (major advantage)
- Direct imports from server tRPC instance
- React Query integration for caching
- Vue/Svelte query libraries available

**Learning Curve:** ⭐⭐⭐⭐⭐ (Low)

- Easy for TypeScript developers
- Similar patterns to React Query
- Minimal concepts to learn

**When to Use:**

- Full-stack TypeScript application
- Internal admin dashboards
- Startups moving fast with TS
- When you control both frontend and backend

---

### 2. GraphQL (Apollo Server)

**Overview:** Flexible query language for complex data relationships

**Key Metrics:**

- **GitHub:** github.com/apollographql/apollo-server (~22k stars)
- **npm:** ~2.5M weekly downloads (all Apollo packages)
- **Bundle Size:** ~200KB (server + client)
- **GraphQL Yoga:** ~8k stars, lighter alternative

**Major Tenants Using:**

- Facebook (creators)
- GitHub (v4 API)
- Shopify
- Airbnb (partial)
- Twitter (partial)
- PayPal
- The New York Times

**Pros:**

- **Flexible queries:** Clients request exactly what they need
- **Strong typing:** Schema-first with excellent tooling
- **Single endpoint:** Simplifies API management
- **Rich ecosystem:** Apollo Client, caching, state management
- **Real-time:** Subscriptions built-in
- **Developer tools:** Apollo Studio, Playground, Explorer
- **Code generation:** GraphQL Code Generator is excellent

**Cons:**

- **Complexity:** N+1 queries, caching challenges
- **Over-fetching trade-off:** Can be slower than optimized REST
- **Learning curve:** Resolvers, schema design, DataLoader
- **Security:** Query complexity limiting needed
- **File uploads:** Historically tricky (improved recently)
- **Monitoring:** More complex than REST

**TypeScript Integration:** ⭐⭐⭐⭐ (Excellent with tools)

- GraphQL Code Generator is mature and excellent
- Strong typing from schema to resolvers
- `graphql-tools` for schema-first development
- TypeScript resolver type generation
- Auto-complete in queries (VSCode plugin)

**Performance:**

- **Slower than REST/tRPC** due to query parsing
- Can be optimized with DataLoader, persisted queries
- Response caching is complex (Apollo Cache Control)
- Generally 20-40% slower than optimized REST

**Middleware Ecosystem:**

- **Extensive:** Apollo ecosystem, community plugins
- Auth middleware, rate limiting, tracing
- Apollo Federation for microservices
- Directives for field-level auth
- Integration with all major auth providers

**Client Story:**

- **Apollo Client:** Industry standard, excellent
- Codegen for TypeScript hooks (`graphql-codegen`)
- TypeScript SDK generation available
- React, Vue, Angular, Svelte support
- Fragment colocation for best DX

**Learning Curve:** ⭐⭐ (Medium-High)

- Schema design and thinking in graphs
- Resolver patterns and best practices
- Federation for microservices
- Query optimization (DataLoader, batching)
- Security considerations

**When to Use:**

- Complex data models with many relationships
- Mobile apps where payload size matters
- Multiple frontend teams with different data needs
- When flexibility is more important than raw performance
- B2B APIs with complex querying requirements

**GraphQL Code Generator:**

- Generates TypeScript types from schema
- React Query, Apollo Client, urql hooks
- SDK generation for external consumers
- 3.5k+ GitHub stars, very active

**Alternatives:**

- **GraphQL Yoga:** Lighter, more performance-focused
- **Mercurius:** Fastify-based GraphQL server
- **GraphQL Helix:** Framework-agnostic, modern approach

---

### 3. REST Frameworks

#### 3.1 Express.js

**Overview:** The battle-tested standard for Node.js APIs

**Key Metrics:**

- **GitHub:** github.com/expressjs/express (~65k stars)
- **npm:** ~18M weekly downloads
- **Bundle Size:** ~150KB
- **Age:** Mature, stable, minimal changes

**Major Tenants Using:**

- Almost every major Node.js tenant historically
- IBM, Uber (historically), PayPal (historically)
- Still heavily used in legacy systems

**Pros:**

- **Largest ecosystem:** Middleware for everything
- **Stability:** API hasn't changed in years
- **Huge community:** Answers to every problem
- **Simplicity:** Minimal abstractions
- **Flexibility:** Structure your app however you want

**Cons:**

- **Slowest among modern frameworks:** 2-3x slower than Fastify
- **No built-in TypeScript:** Requires extra setup
- **Manual validation:** Need external packages (Joi/Zod)
- **Async handling:** Error handling can be tricky
- **Performance:** Not optimized for modern use cases

**TypeScript Integration:** ⭐⭐ (Requires work)

- `@types/express` available but basic
- Manual type definitions for req/res
- No request/response validation built-in
- Popular libraries: `class-validator`, `zod-express-middleware`

**Performance:**

- ~30-50K req/sec (simple JSON)
- Slowest among major frameworks
- Overhead from middleware chain
- Not HTTP/2 optimized by default

**When to Use:**

- Legacy projects already using Express
- When you need maximum ecosystem compatibility
- Simple CRUD APIs
- Learning projects

#### 3.2 Fastify

**Overview:** High-performance Node.js framework with schema validation

**Key Metrics:**

- **GitHub:** github.com/fastify/fastify (~32k stars)
- **npm:** ~5M weekly downloads
- **Bundle Size:** ~180KB (with dependencies)
- **Performance:** 2-3x faster than Express

**Major Tenants Using:**

- NearForm (creators)
- Platform.sh
- Microsoft (some services)
- Various enterprise backends

**Pros:**

- **Blazing fast:** Optimized JSON schema validation
- **TypeScript support:** First-class with fastify-type-provider
- **Schema validation:** Built-in, high-performance JSON schema
- **Plugin ecosystem:** 200+ official plugins
- **Logging:** Pino integration (structured logging)
- **Developer experience:** Excellent TypeScript support

**Cons:**

- **Smaller ecosystem:** Less middleware than Express
- **Learning curve:** Different patterns than Express
- **JSON schema required:** Must define schemas for benefits
- **Migration:** Express apps need refactoring

**TypeScript Integration:** ⭐⭐⭐⭐ (Excellent)

- Type provider pattern for route typing
- JSON schema type inference available
- Strong typing for request/response
- `fastify-type-provider-zod` for Zod integration

**Performance:**

- ~80-100K req/sec (simple JSON)
- **Fastest Node.js framework** for traditional use cases
- Zero-copy JSON parsing
- HTTP/2 support out of the box

**Middleware Ecosystem:**

- **200+ plugins:** Auth, CORS, Swagger, JWT
- Modular architecture
- Encapsulation for plugins
- Decorators for extending functionality

**Client Story:**

- **OpenAPI/Swagger:** `@fastify/swagger` for auto-generated docs
- `fastify-openapi-glue` for type-safe clients
- Code generation via openapi-typescript-codegen
- SDK generation for external consumers

**Learning Curve:** ⭐⭐⭐⭐ (Low-Medium)

- Similar to Express, slightly different patterns
- JSON schema learning required
- Plugin system vs middleware

**When to Use:**

- Performance-critical REST APIs
- When you want more structure than Express
- APIs requiring schema validation
- Microservices
- Production-ready applications

#### 3.3 Hono

**Overview:** Ultra-fast, lightweight framework for edge computing

**Key Metrics:**

- **GitHub:** github.com/honojs/hono (~18k stars)
- **npm:** ~400k weekly downloads
- **Bundle Size:** ~13KB (tiny!)
- **Performance:** Fastest for edge runtimes

**Major Tenants Using:**

- Growing adoption in serverless/edge space
- Cloudflare Workers users
- Vercel Edge Functions users
- Deno Deploy users

**Pros:**

- **Incredibly small:** 13KB minified
- **Edge-ready:** Works on Cloudflare, Deno, Bun, Node
- **Fast:** Optimized for modern runtimes
- **Modern API:** Web standards, fetch API
- **TypeScript first:** Excellent DX
- **Middleware:** Growing ecosystem
- **Hono Client:** Type-safe frontend client

**Cons:**

- **Newer ecosystem:** Less mature than Express/Fastify
- **Smaller community:** Fewer resources/examples
- **Edge limitations:** Some Node APIs not available
- **Less enterprise adoption:** Still gaining traction

**TypeScript Integration:** ⭐⭐⭐⭐⭐

- First-class TypeScript support
- Context typing is excellent
- Zod validator integration built-in
- `hc` (Hono Client) for type-safe clients

**Performance:**

- **Fastest on edge runtimes**
- ~100-120K req/sec on Node.js
- Optimized for cold starts
- Zero dependencies

**Middleware Ecosystem:**

- **Growing but smaller:** Basic middleware covered
- Auth, CORS, JWT, logger available
- Community contributed
- Easy to write custom middleware

**Client Story:**

- **Hono Client:** Type-safe client from server definition
- No codegen needed for TS clients
- OpenAPI integration available
- Works with React Query, SWR

**Learning Curve:** ⭐⭐⭐⭐⭐ (Very Low)

- Simple, intuitive API
- Web standard fetch API
- Minimal concepts

**When to Use:**

- Edge functions (Cloudflare, Vercel, Deno)
- Serverless applications
- Cold-start critical workloads
- Modern runtime projects (Bun, Deno)
- When bundle size matters

#### 3.4 Elysia

**Overview:** Bun-native framework with superior performance

**Key Metrics:**

- **GitHub:** github.com/elysiajs/elysia (~6k stars)
- **npm:** ~120k weekly downloads
- **Bundle Size:** ~30KB
- **Performance:** Claims to be fastest

**Major Tenants Using:**

- Early adopters in Bun ecosystem
- Growing community

**Pros:**

- **Extreme performance:** Claims 12x faster than Express
- **TypeScript native:** Best-in-class type inference
- **Bun optimized:** Designed for Bun runtime
- **Eden Treaty:** Type-safe client without codegen
- **Modern API:** Decorators, schema-first
- **WebSocket:** Built-in, type-safe

**Cons:**

- **Bun ecosystem:** Locked into Bun (mostly)
- **Very new:** Rapidly changing API
- **Smallest ecosystem:** Limited middleware
- **Production maturity:** Less proven than Fastify/Hono

**TypeScript Integration:** ⭐⭐⭐⭐⭐

- Incredible type inference
- End-to-end type safety with Eden
- Schema-based type derivation
- Excellent autocomplete

**Performance:**

- **Claims fastest benchmarks:** 200K+ req/sec
- Optimized for Bun runtime
- Highly optimized serialization
- HTTP/2 ready

**When to Use:**

- Bun runtime projects
- Maximum performance requirements
- When you want cutting-edge TypeScript DX
- Greenfield projects (not production-critical yet)

---

### 4. gRPC (TypeScript/Node.js)

**Overview:** High-performance RPC framework using Protocol Buffers

**Key Metrics:**

- **GitHub:** github.com/grpc/grpc-node (~10k stars)
- **npm:** ~500k weekly downloads (@grpc/grpc-js)
- **Bundle Size:** Protocol buffers are very efficient
- **Performance:** Fastest for service-to-service communication

**Major Tenants Using:**

- Google (creators)
- Netflix (massive gRPC adoption)
- Cisco
- CoreOS
- Many microservice architectures

**Pros:**

- **Maximum performance:** Binary serialization, 5-10x faster than JSON
- **Streaming:** Bidirectional streaming built-in
- **Code generation:** Strongly typed from .proto files
- **Polyglot:** Works across 10+ languages
- **Efficient:** Smaller payloads than JSON
- **Strong typing:** Proto definitions are strict
- **Load balancing:** Built-in client-side load balancing

**Cons:**

- **Not browser-friendly:** Requires grpc-web proxy
- **Complexity:** More setup than REST
- **Debugging:** Binary format harder to debug
- **Tooling:** Less mature than REST tooling
- **Learning curve:** Protobuf syntax, streaming concepts
- **Overkill:** Too complex for simple APIs

**TypeScript Integration:** ⭐⭐⭐⭐ (Good with tools)

- Protobuf generates TypeScript definitions
- `@grpc/grpc-js` has TS support
- `protoc-gen-ts` for better TypeScript generation
- Strong typing from .proto files

**Performance:**

- **Unmatched:** 5-10x faster than REST
- Binary Protocol Buffers are tiny
- HTTP/2 based (multiplexing)
- Ideal for microservices

**Middleware Ecosystem:**

- **Smaller but focused:** Interceptors for auth, logging
- Less community middleware than REST
- Enterprise-focused tooling
- Service mesh integration (Istio, Linkerd)

**Client Story:**

- **Code generation:** Clients generated from .proto
- Multiple language support
- TypeScript clients available
- gRPC-Web for browser support

**Learning Curve:** ⭐⭐ (Medium-High)

- Protocol Buffers syntax
- Streaming concepts (unary, server stream, client stream, bidirectional)
- Service-to-service patterns
- More complex deployment

**When to Use:**

- **Internal microservices** (primary use case)
- High-throughput service communication
- When payload size matters
- Polyglot microservice architectures
- Streaming requirements
- **NOT for public APIs** or browser clients

---

### 5. OpenAPI/Swagger Tools

**Overview:** Specification-driven REST development with code generation

**Key Tools:**

#### 5.1 OpenAPI Generator

- **GitHub:** OpenAPITools/openapi-generator (~20k stars)
- **Most comprehensive:** Generates 50+ languages/frameworks
- **Clients:** TypeScript React Query, Angular, Axios, Fetch
- **Servers:** Express, Fastify, NestJS, Go, Java
- **Mature:** Enterprise-grade, widely used

#### 5.2 Orval

- **GitHub:** orval-labs/orval (~5k stars)
- **TypeScript-focused:** React Query and SWR integration
- **Excellent DX:** Generates typed React Query hooks
- **Modern:** Designed for React ecosystem
- **Type inference:** Excellent TypeScript support

#### 5.3 openapi-typescript-codegen

- **GitHub:** ferdikoomen/openapi-typescript-codegen (~1.5k stars)
- **Lightweight:** Simple fetch-based clients
- **Type-safe:** Strong TypeScript generation
- **Flexible:** Customizable templates

#### 5.4 Zod + OpenAPI

- **Tools:** `zod-to-openapi`, `@asteasolutions/zod-to-openapi`
- **Schema-first:** Define schemas in Zod, generate OpenAPI
- **Runtime validation:** Zod validates at runtime
- **Type safety:** Infer TypeScript types from Zod schemas
- **Modern approach:** Becoming popular in TypeScript ecosystem

**Pros:**

- **Standard:** OpenAPI is industry standard
- **Tooling:** Massive ecosystem of generators
- **Documentation:** Auto-generated Swagger UI
- **Type safety:** Codegen generates TS types
- **Validation:** Request/response validation
- **Contract testing:** Can validate against spec

**Cons:**

- **Codegen maintenance:** Need to regenerate when API changes
- **Overhead:** More setup than tRPC
- **Schema drift:** Spec can get out of sync
- **Complexity:** More moving parts

**When to Use:**

- **Public APIs** requiring documentation
- **External partners** integrating with your API
- **Contract-first** development
- When you need generated SDKs
- Teams using Zod for validation

---

## Use Case Recommendations

### Scenario 1: Full-Stack TypeScript Startup

**Recommendation:** **tRPC**

- Fastest development velocity
- End-to-end type safety prevents bugs
- No boilerplate, focus on features
- Easy to hire React/Next.js developers

### Scenario 2: Public API for External Developers

**Recommendation:** **REST with Fastify** + **OpenAPI**

- Industry standard, easy to consume
- Auto-generated documentation (Swagger UI)
- SDK generation for multiple languages
- Caching works out of the box
- Broad tooling ecosystem

### Scenario 3: Internal Microservices

**Recommendation:** **gRPC**

- Maximum performance and efficiency
- Strong contracts between services
- Binary serialization reduces network overhead
- Streaming capabilities
- Polyglot support if needed

### Scenario 4: Complex Data Relationships (B2B SaaS)

**Recommendation:** **GraphQL (Apollo Server)**

- Flexible queries for different client needs
- Prevents over-fetching in complex data models
- Strong typing with codegen
- Federation for microservices
- Excellent developer tools

### Scenario 5: Edge Functions / Serverless

**Recommendation:** **Hono** or **Elysia**

- Ultra-fast cold starts
- Tiny bundle size
- Works on Cloudflare, Vercel, Deno
- Modern TypeScript experience
- Best performance on edge runtimes

### Scenario 6: Enterprise REST API

**Recommendation:** **Fastify**

- Performance and maturity balance
- Extensive plugin ecosystem
- JSON schema validation built-in
- Enterprise adoption and support
- Easy to hire developers

### Scenario 7: Legacy Node.js Application

**Recommendation:** **Express** (stay) or **Fastify** (migrate)

- If it works, keep Express
- For new features or performance issues, migrate to Fastify
- Largest ecosystem for compatibility

---

## Hybrid Approaches

### Strategy 1: tRPC Internally, REST Externally

```
Internal Dashboard → tRPC → API Gateway
                        ↓
External/Public API  ←  REST (Fastify) → API Gateway
```

**Benefits:**

- Internal team gets tRPC's DX and type safety
- External API is standard REST for partners
- Clear boundary between internal/external
- Can version independently

**Implementation:**

- Use API Gateway pattern (Kong, NGINX, AWS API Gateway)
- Internal services communicate via tRPC
- Public endpoints expose REST/OpenAPI
- Transform layer at gateway if needed

### Strategy 2: GraphQL Gateway, gRPC Services

```
Client → GraphQL Gateway → Microservices (gRPC)
```

**Benefits:**

- GraphQL provides flexible queries for clients
- gRPC for high-performance service-to-service communication
- GraphQL Federation for distributed schemas
- Best of both worlds

**Implementation:**

- Apollo Gateway or GraphQL Yoga as gateway
- Microservices communicate via gRPC
- Federation composes schema from services
- Each service owns its domain

### Strategy 3: tRPC + OpenAPI

```
Frontend → tRPC (type-safe)
External  → OpenAPI/REST (documented)
```

**Benefits:**

- Generate OpenAPI spec from tRPC router
- External consumers get REST SDK
- Internal team gets tRPC DX
- Single source of truth

**Tools:**

- `trpc-openapi` generates OpenAPI from tRPC
- Use same business logic for both
- Expose selected routes as REST

### Strategy 4: Edge + Origin

```
Edge Functions (Hono) → Origin API (Fastify/gRPC)
```

**Benefits:**

- Edge handles auth, caching, basic routing
- Origin handles business logic, database operations
- Best performance for global distribution
- Flexible architecture

**Implementation:**

- Cloudflare Workers or Vercel Edge with Hono
- Route to origin for complex operations
- Cache aggressively at edge
- Keep edge logic simple

### Strategy 5: BFF (Backend for Frontend) Pattern

```
Web Client   → BFF (tRPC)     → Microservices
Mobile App   → BFF (GraphQL)  → Microservices
External API → REST Gateway   → Microservices
```

**Benefits:**

- Optimize API per client type
- Web gets tRPC's type safety
- Mobile gets GraphQL's flexibility
- External gets REST's standardization
- Microservices use gRPC internally

---

## Decision Framework

### Ask These Questions:

1. **Who are your consumers?**
   - Only your frontend (TypeScript) → tRPC
   - External developers/partners → REST with OpenAPI
   - Mobile apps with variable needs → GraphQL
   - Other microservices → gRPC

2. **What's your team's expertise?**
   - TypeScript experts → tRPC, Hono, Elysia
   - Full-stack JS/TS → tRPC
   - Enterprise/backend focus → Fastify, gRPC
   - Frontend-heavy → GraphQL with Apollo

3. **What are your performance requirements?**
   - Maximum raw speed → gRPC or Elysia
   - Edge deployment → Hono or Elysia
   - General performance → Fastify
   - Developer velocity > raw speed → tRPC

4. **How complex is your data model?**
   - Simple CRUD → tRPC or REST
   - Complex relationships → GraphQL
   - Aggregations from many services → GraphQL

5. **Do you need public API documentation?**
   - Yes → REST with OpenAPI/Swagger
   - No → tRPC or GraphQL

6. **What's your deployment target?**
   - Edge/Serverless → Hono, Elysia
   - Traditional Node.js → Fastify, Express
   - Microservices → gRPC
   - Kubernetes → Any, with service mesh

7. **What's your scale trajectory?**
   - Startup/MVP → tRPC for speed
   - Growth stage → Fastify or GraphQL
   - Enterprise scale → gRPC (services) + REST (gateway)

---

## Performance Benchmarks Summary

Based on typical "Hello World" JSON responses:

1. **Elysia (Bun):** ~200K req/sec
2. **Hono (Node.js):** ~120K req/sec
3. **Fastify:** ~100K req/sec
4. **Express:** ~30-50K req/sec
5. **GraphQL (Apollo):** ~20-30K req/sec (query overhead)
6. **tRPC:** Comparable to Fastify (minimal overhead)

_Note: Real-world performance depends on database, middleware, and actual workload_

---

## Emerging Trends (2025-2026)

1. **TypeScript-First Frameworks Rising:**
   - tRPC adoption exploding
   - Hono and Elysia growing fast
   - Developers expect excellent TS support

2. **Edge Computing:**
   - Frameworks optimizing for edge deployment
   - Hono leading, Elysia optimizing for Bun
   - Cold start performance critical

3. **Schema-Based Validation:**
   - Zod becoming standard
   - Runtime validation + TS types
   - `zod-to-openapi` for contract-first

4. **Type Safety Everywhere:**
   - End-to-end type safety expected
   - tRPC's model influencing other frameworks
   - Code generation improving (graphql-codegen, openapi-generator)

5. **Performance Renaissance:**
   - Bun runtime pushing performance boundaries
   - New frameworks (Elysia) optimizing for new runtimes
   - Traditional frameworks (Express) losing ground

6. **Hybrid Architectures:**
   - Teams using multiple API styles for different needs
   - API Gateway patterns becoming standard
   - Clear boundaries: internal vs external

---

## Final Recommendations

### For New Projects in 2026:

1. **Default Choice: tRPC**
   - If you control both frontend and backend
   - If both are TypeScript
   - If you want maximum velocity

2. **Performance Choice: Fastify or Hono**
   - If you need traditional REST
   - If performance is critical
   - If you want ecosystem maturity (Fastify) or edge optimization (Hono)

3. **Public API Choice: REST + OpenAPI**
   - If external developers are consuming
   - If you need documentation
   - Use Fastify as the framework

4. **Complex Data Choice: GraphQL**
   - If data relationships are complex
   - If clients have varying needs
   - Use Apollo Server + graphql-codegen

5. **Microservices Choice: gRPC**
   - For internal service-to-service communication
   - When performance matters
   - When you have multiple language services

### Key Takeaway:

**There is no one-size-fits-all.** The best teams choose the right tool for the job and aren't afraid to use multiple approaches (tRPC for internal dashboards, REST for public APIs, gRPC for microservices).

**The Future is TypeScript-First:** Frameworks that prioritize TypeScript developer experience (tRPC, Hono, Elysia) are growing fastest, while traditional frameworks (Express) are plateauing despite huge install bases.

---

## Sources and Further Reading

### Official Documentation

- [tRPC Documentation](https://trpc.io)
- [Apollo GraphQL Documentation](https://www.apollographql.com/docs/)
- [Fastify Documentation](https://fastify.io)
- [Hono Documentation](https://hono.dev)
- [Elysia Documentation](https://elysiajs.com)
- [gRPC Node.js Documentation](https://grpc.io/docs/languages/node/)

### Performance Benchmarks

- [TechEmpower Web Framework Benchmarks](https://www.techempower.com/benchmarks/)
- [Fastify Benchmarks](https://github.com/fastify/benchmarks)
- [Hono Benchmarks](https://github.com/honojs/hono/tree/main/benchmarks)

### Tools and Libraries

- [OpenAPI Generator](https://openapi-generator.tech)
- [Orval](https://orval.dev)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- [Zod](https://zod.dev)

### Community Resources

- [State of GraphQL Survey](https://stateofgraphql.com)
- [State of JS Survey](https://stateofjs.com)
- [Awesome tRPC](https://github.com/trpc/awesome-trpc)
- [Awesome GraphQL](https://github.com/chentsulin/awesome-graphql)

---

**Report compiled:** April 2026
**Research focus:** Battle-tested frameworks with strong TypeScript support
