'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle,
  Target,
  Users,
  Shield,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  BarChart3,
  MessageSquare,
  Eye,
  UserPlus,
  Code,
  FileJson,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Zap,
  Save,
  Share2,
  Presentation,
  Copy,
  Check,
} from 'lucide-react';

// Discovery template text constant (sent to stakeholders)
const DISCOVERY_TEMPLATE_TEXT = `LEARNING GAP DESCRIPTION DISCOVERY
==================================

Project Name: _________________________________
Submitted by: _________________________________
Date: _________________________________________


SECTION 1: BUSINESS PROBLEM
What specific business challenge needs solving?

Example: "Our sales team is losing 40% of qualified leads in the discovery phase due to insufficient product knowledge and consultative selling skills."

Your Answer:
_____________________________________________________
_____________________________________________________
_____________________________________________________


SECTION 2: CURRENT SITUATION
What is happening now? (Be specific with metrics)

• Current error rate: _______________________
• Time spent on task: _______________________
• Cost impact: $_____________________________
• Other relevant metrics: ____________________

Your Answer:
_____________________________________________________
_____________________________________________________
_____________________________________________________


SECTION 3: DESIRED OUTCOME
What changes after successful training? (Measurable targets)

• Target error rate: _________________________
• Expected time savings: _____________________
• ROI target: $______________________________
• Other success metrics: _____________________

Your Answer:
_____________________________________________________
_____________________________________________________
_____________________________________________________


SECTION 4: TARGET AUDIENCE
Who needs this training?

Select all that apply:
☐ New hires (0-6 months)
☐ Existing team members
☐ Managers/Leaders
☐ External partners/contractors

Additional details:
• Team size: ____________ people
• Geographic distribution: ___________________
• Current skill level: _______________________
• Learning environment: _____________________

Your Answer:
_____________________________________________________
_____________________________________________________


SECTION 5: CONSTRAINTS & REQUIREMENTS
What are the project boundaries?

• Timeline: Must be complete by: _____________
• Budget range: $__________ to $____________
• Compliance requirements: __________________
• Existing tools/systems: ____________________
• Technical limitations: _____________________

Your Answer:
_____________________________________________________
_____________________________________________________


SECTION 6: SUCCESS INDICATORS
How will you know this worked?

• Metric 1: _________________________________
• Metric 2: _________________________________
• Metric 3: _________________________________
• Time frame for measuring results: __________

Your Answer:
_____________________________________________________
_____________________________________________________


SECTION 7: STAKEHOLDER CONTEXT
Who are the key players?

• Who needs to approve this? _________________
• Who will champion adoption? ________________
• Who might resist? _________________________
• Who will be responsible for implementation? __

Your Answer:
_____________________________________________________
_____________________________________________________


==================================
END OF TEMPLATE

INSTRUCTIONS FOR STAKEHOLDERS:
1. Fill out all sections with as much detail as possible
2. Be specific with numbers, dates, and metrics
3. If a section doesn't apply, write "N/A" with a brief explanation
4. Return completed template to: [Your Email]
5. Questions? Contact: [Your Name/Phone]`;

// Compiled template (for static questionnaire input)
const COMPILED_TEMPLATE_TEXT = `LEARNING GAP DESCRIPTION TEMPLATE
(For Smartslate Static Questionnaire Input)

After receiving the completed discovery form from your stakeholders, compile their responses into this concise format. Focus on the essential information that will drive effective learning design.

==================================

THE PROBLEM (100-150 words max)
What business problem needs solving, and what's the current impact?

Combine answers from Sections 1 & 2 into a focused summary:
• The core business challenge
• Current metrics showing the gap
• Specific pain points

Example:
"Sales team losing 40% of qualified leads in discovery phase due to insufficient product knowledge. Current close rate is 15% vs. industry standard of 35%. Average sales cycle is 90 days with 3+ stakeholder meetings required. Annual revenue impact: $2.4M in lost opportunities."

Your Compiled Answer:
_____________________________________________________
_____________________________________________________
_____________________________________________________


THE GOAL (50-100 words max)
What measurable outcomes define success?

Distill Section 3 into specific, measurable targets:
• Primary success metric(s)
• Timeline for results
• Expected ROI or impact

Example:
"Increase close rate to 28% within 6 months. Reduce sales cycle to 60 days. Enable reps to handle technical objections without engineering support. Target ROI: $1.8M additional revenue in Year 1."

Your Compiled Answer:
_____________________________________________________
_____________________________________________________
_____________________________________________________


THE AUDIENCE (50-75 words max)
Who needs this learning solution?

Summarize Section 4 into actionable audience details:
• Role/level and team size
• Current skill baseline
• Learning context

Example:
"45 B2B sales representatives (mix of 15 new hires with <6 months tenure and 30 experienced reps). Current product knowledge: basic features only. Geographic: 60% remote, 40% hybrid in 3 office locations."

Your Compiled Answer:
_____________________________________________________
_____________________________________________________


THE CONSTRAINTS (50-75 words max)
What are the project boundaries?

Consolidate Section 5 into key constraints:
• Hard deadlines and budget limits
• Must-have compliance or technical requirements
• Non-negotiable parameters

Example:
"Launch by Q3 2024 (hard deadline for new product release). Budget: $75K-$90K including development and delivery. Must integrate with Salesforce CRM. SOC 2 compliance required for data handling."

Your Compiled Answer:
_____________________________________________________
_____________________________________________________


SUCCESS METRICS (25-50 words max)
How will results be measured?

Extract 2-3 primary KPIs from Section 6:

Example:
"Monthly close rate tracking via Salesforce. Sales cycle duration by rep. Post-training assessment scores. Quarterly revenue attribution."

Your Compiled Answer:
_____________________________________________________
_____________________________________________________


STAKEHOLDER ALIGNMENT (25-50 words max)
Who are the key decision-makers and champions?

Summarize Section 7 into essential stakeholder info:

Example:
"Sponsor: VP Sales (final approver). Champion: Sales Enablement Director (implementation lead). Potential resistance: veteran reps with 10+ years tenure."

Your Compiled Answer:
_____________________________________________________
_____________________________________________________


==================================
COMPILATION GUIDELINES

✓ DO:
• Use bullet points and specific numbers
• Focus on "what" and "why," not lengthy "how"
• Keep each section within word limits
• Include only information that impacts learning design decisions

✗ DON'T:
• Copy-paste entire stakeholder responses verbatim
• Include speculative or "nice-to-have" details
• Add background context not directly relevant to training
• Exceed word count guidelines

This compiled format ensures Smartslate's AI generates the most relevant dynamic questions for your specific context.`;

// Section 1 Component
function Section1LearningGapTemplate() {
  const [discoverycopied, setDiscoveryCopied] = useState(false);
  const [compiledCopied, setCompiledCopied] = useState(false);

  const handleCopyDiscoveryTemplate = async () => {
    try {
      await navigator.clipboard.writeText(DISCOVERY_TEMPLATE_TEXT);
      setDiscoveryCopied(true);
      setTimeout(() => setDiscoveryCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyCompiledTemplate = async () => {
    try {
      await navigator.clipboard.writeText(COMPILED_TEMPLATE_TEXT);
      setCompiledCopied(true);
      setTimeout(() => setCompiledCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section
      id="learning-gap-template"
      className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Step Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
            <FileText className="h-4 w-4 text-[rgb(167,218,219)]" />
            <span className="text-sm font-semibold text-[rgb(167,218,219)]">Step 1</span>
          </div>

          {/* Heading */}
          <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
            Speak Their Language (So They&apos;ll Actually Speak Yours)
          </h2>

          {/* Subheading */}
          <p className="mb-8 text-xl leading-relaxed text-[rgb(176,197,198)]">
            Your stakeholders don&apos;t speak &quot;learning objectives&quot; or &quot;Kirkpatrick
            levels.&quot; They speak revenue, compliance risk, and time-to-productivity. The
            Learning Gap Description Discovery translates their business problems into learning
            requirements—in 15 minutes instead of 90.
          </p>

          {/* Template Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-6 backdrop-blur-sm md:p-8"
          >
            {/* Header Section */}
            <div className="mb-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-[rgb(167,218,219)] md:text-3xl">
                  Learning Gap Description Discovery
                </h3>
                <p className="mt-2 text-base text-[rgb(176,197,198)]">
                  Copy this template and share it with your stakeholders to gather requirements
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleCopyDiscoveryTemplate}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  {discoverycopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Template Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Template to Clipboard
                    </>
                  )}
                </button>
                <button className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border-2 border-[rgba(167,218,219,0.4)] px-6 py-3 text-sm font-semibold text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.1)]">
                  <Download className="h-4 w-4" />
                  Download as Word Doc
                </button>
              </div>
            </div>

            {/* Template Display Area */}
            <div className="relative overflow-hidden rounded-lg border border-[rgba(167,218,219,0.3)] bg-[rgba(2,12,27,0.8)]">
              {/* Copy Button (Top Right) */}
              <button
                onClick={handleCopyDiscoveryTemplate}
                className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.9)] text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.15)]"
                aria-label="Copy template"
              >
                {discoverycopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>

              {/* Template Text */}
              <pre className="max-h-[600px] overflow-y-auto p-6 text-sm leading-relaxed text-[rgb(176,197,198)] md:text-base">
                <code>{DISCOVERY_TEMPLATE_TEXT}</code>
              </pre>
            </div>

            {/* Success Message */}
            {discoverycopied && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-400"
              >
                Template copied to clipboard! Paste it into your email, Word doc, or Google Doc.
              </motion.div>
            )}
          </motion.div>

          {/* How to Use Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6 backdrop-blur-sm md:p-8"
          >
            <h3 className="mb-4 text-2xl font-bold text-[rgb(167,218,219)]">
              How to Use This Template
            </h3>
            <ol className="space-y-3 text-base text-[rgb(176,197,198)]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                  1
                </span>
                <span>Copy the template using the button above</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                  2
                </span>
                <span>Paste into an email, Word doc, or Google Doc</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                  3
                </span>
                <span>Share with your stakeholder(s) to fill out</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                  4
                </span>
                <span>
                  Once they return it completed, review their responses and identify the key
                  information
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                  5
                </span>
                <span>
                  Use the Learning Gap Description Template below to compile their responses into a
                  focused format for the static questionnaire
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                  6
                </span>
                <span>Generate your custom dynamic questionnaire</span>
              </li>
            </ol>
          </motion.div>

          {/* Compiled Template Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12 rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-6 backdrop-blur-sm md:p-8"
          >
            {/* Header Section */}
            <div className="mb-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-[rgb(167,218,219)] md:text-3xl">
                  Learning Gap Description Template
                </h3>
                <p className="mt-2 text-base text-[rgb(176,197,198)]">
                  After receiving the completed discovery form, use this template to compile
                  stakeholder responses into the format required for Smartslate&apos;s static
                  questionnaire
                </p>
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleCopyCompiledTemplate}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  {compiledCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Template Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Template to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Template Display Area */}
            <div className="relative overflow-hidden rounded-lg border border-[rgba(167,218,219,0.3)] bg-[rgba(2,12,27,0.8)]">
              {/* Copy Button (Top Right) */}
              <button
                onClick={handleCopyCompiledTemplate}
                className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.9)] text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.15)]"
                aria-label="Copy compiled template"
              >
                {compiledCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>

              {/* Template Text */}
              <pre className="max-h-[600px] overflow-y-auto p-6 text-sm leading-relaxed text-[rgb(176,197,198)] md:text-base">
                <code>{COMPILED_TEMPLATE_TEXT}</code>
              </pre>
            </div>

            {/* Success Message */}
            {compiledCopied && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-400"
              >
                Template copied to clipboard! Use this format when entering information into the
                static questionnaire.
              </motion.div>
            )}
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: '15 Minutes vs 90-Minute Marathon',
                description:
                  'Stakeholders answer 7 focused questions instead of 30+ scattered fields. Completion rates jump from 23 percent to 87 percent.',
              },
              {
                icon: GitBranch,
                title: 'Smart Branching Logic',
                description:
                  'Compliance-heavy industries get regulatory questions. Tech startups get agility questions. No wasted time.',
              },
              {
                icon: Sparkles,
                title: 'Automatic Translation',
                description:
                  'Business speak ("reduce churn") becomes learning objectives ("increase product adoption skills") automatically.',
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6 backdrop-blur-sm transition-all"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                  <benefit.icon className="h-6 w-6 text-[rgb(167,218,219)]" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-[rgb(224,224,224)]">{benefit.title}</h3>
                <p className="text-[rgb(176,197,198)]">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function RecommendedWorkflowPage() {
  return (
    <div className="min-h-screen bg-[rgb(2,12,27)] text-[rgb(224,224,224)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[rgba(255,255,255,0.1)] bg-[rgb(2,12,27)]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center text-left"
            >
              <div className="mb-6 inline-block w-fit rounded-full border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
                <span className="text-sm font-semibold text-[rgb(167,218,219)]">
                  Streamlined Workflow
                </span>
              </div>

              <h1 className="font-heading mb-6 text-4xl leading-tight font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                Stop Chasing Stakeholders.{' '}
                <span className="text-[rgb(167,218,219)]">Start Building</span> Better Learning
                Programs.
              </h1>

              <p className="mb-6 text-xl leading-relaxed font-semibold text-[rgb(224,224,224)]">
                The complete workflow that transforms scattered requirements into strategic learning
                blueprints—without the endless emails, incomplete surveys, or last-minute &apos;one
                more thing&apos; revisions.
              </p>

              <p className="mb-8 text-lg leading-relaxed text-[rgb(176,197,198)]">
                You know the drill: Stakeholders who &apos;don&apos;t have time&apos; for your
                intake questionnaire suddenly have plenty of time to request changes after
                you&apos;ve built the wrong thing. Meanwhile, you&apos;re drowning in email threads,
                decoding vague feedback like &apos;make it more engaging,&apos; and wondering why a
                simple training project feels like project management nightmare.
              </p>

              <div>
                <a
                  href="#learning-gap-template"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/50"
                  style={{ color: 'rgb(255, 255, 255)' }}
                >
                  See the Workflow in Action
                  <ChevronDown className="h-5 w-5" />
                </a>
              </div>
            </motion.div>

            {/* Right Side - Animated Workflow Diagram */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden min-h-[500px] items-center justify-center lg:flex"
            >
              <div className="relative flex h-[500px] w-[480px] items-center justify-center">
                {/* Subtle Background Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.15, 0.25, 0.15],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute h-[300px] w-[300px] rounded-full bg-[rgb(167,218,219)] blur-[80px]"
                />

                {/* Workflow Nodes */}
                <div className="relative h-full w-full">
                  {[
                    { title: 'Gather', icon: FileText, step: 1, delay: 0 },
                    { title: 'Generate', icon: Sparkles, step: 2, delay: 0.2 },
                    { title: 'Review', icon: Eye, step: 3, delay: 0.4 },
                    { title: 'Share', icon: Share2, step: 4, delay: 0.6 },
                  ].map((node, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.4 + node.delay,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="absolute"
                      style={{
                        left: index % 2 === 0 ? '40px' : '280px',
                        top: `${60 + Math.floor(index / 2) * 200}px`,
                        zIndex: 4 - index,
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="w-[160px] rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.85)] p-4 shadow-xl backdrop-blur-md"
                        style={{
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(167,218,219,0.1)',
                        }}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                            <node.icon className="h-5 w-5 text-[rgb(167,218,219)]" />
                          </div>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(167,218,219,0.2)] text-xs font-bold text-[rgb(167,218,219)]">
                            {node.step}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-[rgb(224,224,224)]">
                          {node.title}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(167,218,219,0.1)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{
                              duration: 1.2,
                              delay: 0.8 + node.delay,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-[rgb(167,218,219)] to-[rgb(123,197,199)]"
                          />
                        </div>
                      </motion.div>

                      {/* Connecting Line to Next Node */}
                      {index < 3 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            duration: 0.8,
                            delay: 0.6 + node.delay,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          className="absolute top-[90px] left-[80px] h-[2px] w-[140px] origin-left bg-gradient-to-r from-[rgb(167,218,219)] to-transparent"
                          style={{
                            transform:
                              index % 2 === 0
                                ? 'rotate(45deg)'
                                : 'rotate(-135deg) translateY(-100%)',
                          }}
                        />
                      )}
                    </motion.div>
                  ))}

                  {/* Central Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ zIndex: 5 }}
                  >
                    <div className="relative">
                      {/* Rotating Ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="absolute inset-0 h-20 w-20 rounded-full"
                        style={{
                          background:
                            'conic-gradient(from 0deg, rgba(167,218,219,0) 0%, rgba(167,218,219,0.4) 50%, rgba(167,218,219,0) 100%)',
                        }}
                      />

                      {/* Center Badge */}
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgba(167,218,219,0.3)] bg-[rgb(13,27,42)]">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Zap className="h-8 w-8 text-[rgb(167,218,219)]" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1: Learning Gap Template */}
      <Section1LearningGapTemplate />

      {/* Section 2: Dynamic Questionnaire Collection */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <Sparkles className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">Step 2</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Let AI Do the Heavy Lifting (While Your Stakeholders Stay Productive)
            </h2>

            <p className="mb-8 text-xl leading-relaxed text-[rgb(176,197,198)]">
              Your stakeholders don&apos;t have 90 minutes for a workshop. But they do have 22
              minutes between meetings to answer a smart questionnaire on their phone.
              Smartslate&apos;s AI generates a custom questionnaire based on their Learning Gap
              Template—no scheduling circus required.
            </p>

            {/* Body paragraphs */}
            <div className="mb-8 space-y-4">
              <p className="text-lg leading-relaxed text-[rgb(176,197,198)]">
                The moment you input your static questionnaire answers, Gemini AI gets to work. In
                seconds, it analyzes your learning context—audience size, industry compliance needs,
                budget constraints, technical environment—and generates 50-70 custom questions
                organized into 10 strategic sections.
              </p>
              <p className="text-lg leading-relaxed text-[rgb(176,197,198)]">
                This isn&apos;t a template. It&apos;s intelligent question generation that adapts to
                your project.
              </p>
            </div>

            {/* Example Intelligence in Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12 rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                Example Intelligence in Action
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: 'Mention healthcare?',
                    description: 'You get HIPAA-specific questions about data security.',
                  },
                  {
                    title: 'Remote team?',
                    description: 'Questions prioritize asynchronous learning modalities.',
                  },
                  {
                    title: 'Tight budget?',
                    description: 'AI focuses on cost-effective delivery methods.',
                  },
                  {
                    title: 'Enterprise deployment?',
                    description: 'You get change management and stakeholder buy-in questions.',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-4"
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <div>
                      <div className="mb-1 font-semibold text-[rgb(224,224,224)]">{item.title}</div>
                      <div className="text-sm text-[rgb(176,197,198)]">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mobile-First Experience Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12 overflow-hidden rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                The Mobile-First Experience
              </h3>

              <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(2,12,27,0.5)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                    <Clock className="h-5 w-5 text-[rgb(167,218,219)]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[rgb(224,224,224)]">
                      Estimated Time Remaining
                    </div>
                    <div className="text-xl font-bold text-[rgb(167,218,219)]">22 minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-green-400">Auto-saved 3 seconds ago</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[rgb(176,197,198)]">Progress</span>
                  <span className="font-semibold text-[rgb(167,218,219)]">Section 3 of 10</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgba(167,218,219,0.1)]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '30%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-[rgb(167,218,219)] to-[rgb(123,197,199)]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6">
                  <h4 className="mb-3 text-lg font-semibold text-[rgb(224,224,224)]">
                    Question 14: Learning Modality Preferences
                  </h4>
                  <p className="mb-4 text-sm text-[rgb(176,197,198)]">
                    Based on your target audience (remote sales team), which delivery formats would
                    work best?
                  </p>
                  <div className="space-y-2">
                    {[
                      'Live virtual instructor-led training (VILT)',
                      'Self-paced online modules',
                      'Microlearning videos (5-10 min)',
                      'Peer-to-peer coaching sessions',
                    ].map((option, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-md border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.3)] p-3 transition-all hover:border-[rgba(167,218,219,0.5)] hover:bg-[rgba(167,218,219,0.05)]"
                      >
                        <div className="h-5 w-5 rounded border-2 border-[rgba(167,218,219,0.5)]" />
                        <span className="text-sm text-[rgb(176,197,198)]">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-sm text-[rgb(176,197,198)]">
                  Mobile-responsive • Auto-save every 30 seconds • Section-by-section navigation •
                  Progress tracking (20-25 minutes total)
                </div>
              </div>
            </motion.div>

            {/* Why This Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12 rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-8"
            >
              <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                Why This Works When Traditional Surveys Fail
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    number: 1,
                    title: 'Relevance',
                    description: 'Only see questions that matter to your specific project',
                  },
                  {
                    number: 2,
                    title: 'Respect',
                    description: '22 minutes vs 90-minute workshop',
                  },
                  {
                    number: 3,
                    title: 'Flexibility',
                    description: 'Answer on phone during commute or at desk between meetings',
                  },
                  {
                    number: 4,
                    title: 'Safety',
                    description: 'Auto-save means no "I lost 30 minutes of work" frustration',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-[rgba(167,218,219,0.1)] bg-[rgba(13,27,42,0.3)] p-6"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)] text-sm font-bold text-[rgb(167,218,219)]">
                        {item.number}
                      </div>
                      <h4 className="text-lg font-bold text-[rgb(224,224,224)]">{item.title}</h4>
                    </div>
                    <p className="text-sm text-[rgb(176,197,198)]">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-lg border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.05)] p-4">
                <p className="text-center text-lg font-semibold text-[rgb(167,218,219)]">
                  Traditional needs assessment surveys have a 23% completion rate. Smartslate&apos;s
                  dynamic questionnaires hit 87%
                </p>
              </div>
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="rounded-xl border border-[rgba(167,218,219,0.3)] bg-gradient-to-br from-[rgba(167,218,219,0.1)] to-[rgba(167,218,219,0.05)] p-8"
            >
              <div className="mb-4 text-3xl text-[rgb(167,218,219)]">"</div>
              <p className="mb-6 text-xl leading-relaxed text-[rgb(224,224,224)] italic">
                I used to spend 3 weeks scheduling stakeholder workshops. Now I send a link Monday
                morning and have complete requirements by Friday afternoon. My VP asked if I cloned
                myself.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(167,218,219,0.2)] text-lg font-bold text-[rgb(167,218,219)]">
                  MT
                </div>
                <div>
                  <div className="font-semibold text-[rgb(224,224,224)]">Marcus T.</div>
                  <div className="text-sm text-[rgb(176,197,198)]">Senior L&D Manager, FinTech</div>
                </div>
              </div>
            </motion.div>

            <div className="mt-8 text-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-[rgba(167,218,219,0.3)] px-6 py-3 font-semibold text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.1)]"
              >
                See a Sample Dynamic Questionnaire
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Blueprint Generation & Export */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <Eye className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">Step 3</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              From Raw Answers to Strategic Blueprint in Under 30 Seconds
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              Here&apos;s where most tools fail: They make you wait 6 hours for a consultant to
              &apos;synthesize findings.&apos; Smartslate&apos;s AI delivers a comprehensive
              learning blueprint faster than you can refill your coffee—then lets you export it in
              whatever format your audience needs.
            </p>

            {/* Generation Process Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12 overflow-hidden rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                The Generation Process
              </h3>

              <div className="mb-8 rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(2,12,27,0.5)] p-6">
                <div className="mb-4 flex items-center justify-center">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-700">
                    <Sparkles className="h-5 w-5" />
                    Generate Blueprint
                  </button>
                </div>
                <div className="mb-3 flex items-center justify-center gap-2 text-sm text-[rgb(176,197,198)]">
                  <Clock className="h-4 w-4" />
                  <span>Estimated time: 10-30 seconds</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgba(167,218,219,0.1)]">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '75%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-[rgb(167,218,219)] to-[rgb(123,197,199)]"
                  />
                </div>
              </div>

              <h4 className="mb-4 text-xl font-bold text-[rgb(224,224,224)]">
                What the Blueprint Includes
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  'Executive Summary: Business-aligned overview with ROI projections',
                  "Learning Objectives: Bloom's Taxonomy-aligned, measurable outcomes",
                  'Content Outline: Module-by-module breakdown with duration estimates',
                  'Instructional Strategy: Delivery methods, cohort models, engagement tactics',
                  'Assessment Strategy: Quiz design, rubrics, success metrics',
                  'Resource Allocation: Budget breakdown, staffing needs, timeline',
                  'Technical Requirements: LMS specs, integrations, accessibility standards',
                  'Risk Mitigation: Contingency plans for implementation obstacles',
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-md border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.3)] p-3"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Multi-Format Export */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-12 rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-[rgb(224,224,224)]">
                Multi-Format Export for Every Audience
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    format: 'PDF Export',
                    icon: FileText,
                    when: 'Executive presentations, vendor RFPs, final deliverables',
                    benefits:
                      'Professional report design, cross-platform compatibility, preserves formatting',
                  },
                  {
                    format: 'Microsoft Word Export',
                    icon: FileText,
                    when: 'Collaborative editing, template creation, detailed internal revisions',
                    benefits: 'Fully editable, track changes support, familiar interface',
                  },
                  {
                    format: 'Markdown Export',
                    icon: Code,
                    when: 'Version control (Git), documentation sites, developer handoff',
                    benefits:
                      'Plain text for easy diffing, integrates with CI/CD, converts to HTML/PDF',
                  },
                  {
                    format: 'JSON Export',
                    icon: FileJson,
                    when: 'System integration, API consumption, data analysis',
                    benefits: 'Structured data, machine-readable, database import ready',
                  },
                ].map((format, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                        <format.icon className="h-5 w-5 text-[rgb(167,218,219)]" />
                      </div>
                      <h4 className="text-xl font-bold text-[rgb(167,218,219)]">{format.format}</h4>
                    </div>
                    <div className="mb-3">
                      <div className="mb-1 text-sm font-semibold text-[rgb(224,224,224)]">
                        Use when:
                      </div>
                      <div className="text-sm text-[rgb(176,197,198)]">{format.when}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-semibold text-[rgb(224,224,224)]">
                        Benefits:
                      </div>
                      <div className="text-sm text-[rgb(176,197,198)]">{format.benefits}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-xl border border-[rgba(167,218,219,0.3)] bg-gradient-to-br from-[rgba(167,218,219,0.1)] to-[rgba(167,218,219,0.05)] p-8"
            >
              <div className="mb-4 text-3xl text-[rgb(167,218,219)]">"</div>
              <p className="mb-6 text-xl leading-relaxed text-[rgb(224,224,224)] italic">
                I sent a Smartslate blueprint to three LMS vendors for quotes. All three came back
                saying &apos;This is the most detailed RFP we&apos;ve ever received.&apos; Saved us
                weeks of scope clarification calls.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(167,218,219,0.2)] text-lg font-bold text-[rgb(167,218,219)]">
                  EV
                </div>
                <div>
                  <div className="font-semibold text-[rgb(224,224,224)]">Elena V.</div>
                  <div className="text-sm text-[rgb(176,197,198)]">
                    L&D Program Manager, Enterprise Healthcare
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700"
              >
                Generate Your First Blueprint
                <ChevronRight className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-[rgba(167,218,219,0.3)] px-6 py-3 font-semibold text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.1)]"
              >
                See Sample Blueprint Exports
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Sharing & Using Blueprints */}
      <section className="border-b border-[rgba(255,255,255,0.1)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.1)] px-4 py-2">
              <Share2 className="h-4 w-4 text-[rgb(167,218,219)]" />
              <span className="text-sm font-semibold text-[rgb(167,218,219)]">Step 4</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl">
              Turn Your Blueprint Into an Organizational Asset (Not Another Dead Document)
            </h2>

            <p className="mb-12 text-xl leading-relaxed text-[rgb(176,197,198)]">
              A blueprint buried in your file system is worthless. A blueprint that executives
              reference in budget meetings, vendors use for scoping, and your successor inherits for
              onboarding? That&apos;s strategic documentation that compounds value over time.
            </p>

            {/* Shareable Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12 rounded-xl border border-[rgba(167,218,219,0.3)] bg-[rgba(13,27,42,0.7)] p-8 backdrop-blur-sm"
            >
              <h3 className="mb-6 text-2xl font-bold text-[rgb(167,218,219)]">
                Shareable Links: Access Without Friction
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  'Generate unique share link',
                  'No login required for viewers',
                  'Copy and share via email/Slack/Teams',
                  'Anyone with link sees current version',
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-4"
                  >
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[rgb(167,218,219)]" />
                    <span className="text-sm text-[rgb(176,197,198)]">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Use Case Cards Grid */}
            <div className="mb-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  icon: Presentation,
                  title: 'Executive Alignment',
                  scenario: 'Your CFO asks "Why do we need $120K for this training program?"',
                  solution:
                    'Share blueprint link. CFO opens on tablet between meetings. Reads Executive Summary with ROI projections. Approved in 48 hours.',
                  impact: 'No deck building. No meeting prep. Just a link.',
                },
                {
                  icon: Users,
                  title: 'Vendor Management',
                  scenario:
                    'You\'re evaluating 3 LMS vendors. Each asks "What are your exact requirements?"',
                  solution:
                    'Export blueprint as PDF. Send to all 3 vendors. Content Outline has every spec. Vendors return accurate quotes.',
                  impact: 'Apples-to-apples comparison. Zero scope creep.',
                },
                {
                  icon: UserPlus,
                  title: 'Team Onboarding',
                  scenario: 'New L&D specialist asks "How do projects work here?"',
                  solution:
                    'Grant access to your 5 most recent blueprints. They see your process, standards, style.',
                  impact: 'Onboarding time cut by 60%. First deliverable quality: 90% vs 50%.',
                },
                {
                  icon: TrendingUp,
                  title: 'Continuous Improvement',
                  scenario: "Six months post-launch, Module 3 isn't working.",
                  solution:
                    'Open original blueprint. Check predictions. Create v2.0 with improvements.',
                  impact: 'Evidence-based iteration. No "what were we thinking?" moments.',
                },
              ].map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-[rgba(167,218,219,0.2)] bg-[rgba(13,27,42,0.5)] p-6 backdrop-blur-sm transition-all"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(167,218,219,0.15)]">
                      <useCase.icon className="h-6 w-6 text-[rgb(167,218,219)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[rgb(224,224,224)]">{useCase.title}</h3>
                  </div>
                  <div className="mb-4 space-y-3">
                    <div>
                      <div className="mb-1 text-sm font-semibold text-[rgb(167,218,219)]">
                        Scenario:
                      </div>
                      <p className="text-sm text-[rgb(176,197,198)]">{useCase.scenario}</p>
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-semibold text-[rgb(167,218,219)]">
                        Smartslate solution:
                      </div>
                      <p className="text-sm text-[rgb(176,197,198)]">{useCase.solution}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-3">
                    <p className="text-sm font-semibold text-[rgb(167,218,219)]">
                      Impact: {useCase.impact}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-xl border border-[rgba(167,218,219,0.3)] bg-gradient-to-br from-[rgba(167,218,219,0.1)] to-[rgba(167,218,219,0.05)] p-8"
            >
              <div className="mb-4 text-3xl text-[rgb(167,218,219)]">"</div>
              <p className="mb-6 text-xl leading-relaxed text-[rgb(224,224,224)] italic">
                Our blueprints used to live in a SharePoint graveyard. Now they&apos;re living
                references that executives actually use. Last quarter, our CFO cited a blueprint in
                a board meeting to justify our L&D budget. That never happened with PowerPoint
                decks.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(167,218,219,0.2)] text-lg font-bold text-[rgb(167,218,219)]">
                  PM
                </div>
                <div>
                  <div className="font-semibold text-[rgb(224,224,224)]">Priya M.</div>
                  <div className="text-sm text-[rgb(176,197,198)]">
                    Director of Learning Operations, SaaS Unicorn
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-8 text-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700"
              >
                Start Your First Blueprint
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(167,218,219,0.15)] to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-[rgb(224,224,224)] sm:text-5xl md:text-6xl">
              Ready to Transform Your <span className="text-[rgb(167,218,219)]">L&D Workflow?</span>
            </h2>
            <p className="mb-8 text-xl text-[rgb(176,197,198)]">
              Join L&D professionals who stopped chasing stakeholders and started building better
              learning programs.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#"
                className="w-full rounded-lg bg-indigo-600 px-8 py-4 text-center text-lg font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg sm:w-auto"
              >
                Try the Workflow Free
              </a>
              <a
                href="#"
                className="w-full rounded-lg border border-[rgba(167,218,219,0.3)] px-8 py-4 text-center text-lg font-semibold text-[rgb(167,218,219)] transition-all hover:bg-[rgba(167,218,219,0.1)] sm:w-auto"
              >
                Download Learning Gap Template
              </a>
            </div>

            <p className="mt-6 text-sm text-[rgb(176,197,198)]">
              No credit card. No setup headaches. Just better blueprints in 48 hours.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
