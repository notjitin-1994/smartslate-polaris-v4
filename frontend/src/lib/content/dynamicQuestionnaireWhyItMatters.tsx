import React from 'react';
import {
  Target,
  BarChart3,
  Compass,
  Scale,
  Lightbulb,
  Brain,
  Flame,
  Globe,
  Zap,
  RefreshCw,
  Puzzle,
  Timer,
  Drama,
  Users,
  Gamepad2,
  FlaskConical,
  BookOpen,
  Palette,
  Link,
  Accessibility,
  Rocket,
  Shield,
  Megaphone,
  Wrench,
  DollarSign,
  Microscope,
} from 'lucide-react';

/**
 * Why This Matters content for Dynamic Questionnaire sections
 *
 * This file contains the educational content that explains the importance
 * of each section in the dynamic questionnaire. Each section provides
 * context and rationale to help users understand why their input matters.
 */

/**
 * Reusable icon component with brand-consistent styling
 */
const BrandIcon = ({
  icon: Icon,
  className = '',
}: {
  icon: React.ElementType;
  className?: string;
}) => (
  <Icon
    className={`text-primary inline-block h-5 w-5 drop-shadow-[0_0_8px_rgba(255,193,7,0.4)] ${className}`}
    aria-hidden="true"
  />
);

export interface WhyThisMattersContent {
  title: string;
  content: React.ReactNode;
}

export interface DynamicSectionContent {
  id: number;
  title: string;
  whyThisMatters: WhyThisMattersContent;
}

export const dynamicQuestionnaireWhyItMatters: DynamicSectionContent[] = [
  {
    id: 1,
    title: 'Learning Objectives & Outcomes',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Well-defined learning objectives are the foundation of effective training. They
            transform vague aspirations into measurable outcomes, ensuring every learning activity
            serves a clear purpose and delivers tangible value.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Clarity of Purpose
              </h4>
              <p className="text-text-secondary text-sm">
                Clear objectives answer the critical question: "What should learners be able to DO
                after completing this training?" Without this clarity, you risk creating content
                that's interesting but ineffective. Specificity drives focus.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={BarChart3} />
                Measurable Success
              </h4>
              <p className="text-text-secondary text-sm">
                Objectives that include performance criteria let you prove ROI. When you can measure
                skill acquisition, behavior change, or business impact, you transform training from
                a cost center into a strategic investment with demonstrable returns.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Compass} />
                Design Alignment
              </h4>
              <p className="text-text-secondary text-sm">
                Every instructional decision—content depth, delivery method, assessment type—flows
                from your objectives. They act as your North Star, preventing scope creep and
                ensuring every element serves learner success, not just content coverage.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Scale} />
                Stakeholder Confidence
              </h4>
              <p className="text-text-secondary text-sm">
                Objectives written using action verbs (create, analyze, implement) communicate
                exactly what leaders, managers, and learners can expect. This transparency builds
                trust and secures buy-in from decision-makers who control budgets and time.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Investing time in precise, outcome-focused objectives upfront saves months of rework
              later. You'll design targeted content, select appropriate assessments, and deliver
              training that demonstrably closes skill gaps and drives business results.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 2,
    title: 'Target Audience Analysis',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            One-size-fits-all training fails because learners aren't uniform. Deep audience analysis
            ensures your content meets people where they are—matching their expertise, motivations,
            constraints, and learning preferences—dramatically increasing engagement and retention.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Brain} />
                Cognitive Load Management
              </h4>
              <p className="text-text-secondary text-sm">
                Understanding prior knowledge prevents two fatal errors: overwhelming novices with
                advanced concepts or boring experts with remedial content. Right-sized challenge
                keeps learners in the optimal "zone of proximal development" where growth happens.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Flame} />
                Motivation Alignment
              </h4>
              <p className="text-text-secondary text-sm">
                Different audiences have different "why's." Sales teams care about quota attainment.
                Engineers value technical precision. Managers focus on team efficiency. Tailoring
                examples, scenarios, and incentives to these intrinsic motivators drives completion.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Globe} />
                Accessibility & Inclusion
              </h4>
              <p className="text-text-secondary text-sm">
                Audience analysis reveals critical needs: language translation, cultural adaptation,
                disability accommodations, device constraints, or connectivity limitations.
                Inclusive design from the start avoids costly retrofitting and ensures everyone can
                succeed.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Zap} />
                Efficiency Gains
              </h4>
              <p className="text-text-secondary text-sm">
                Segmenting audiences lets you create targeted learning paths instead of monolithic
                courses. Beginners get foundational modules; experts jump to advanced applications.
                This personalization reduces time-to-competence and respects learners' time.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Audience-centered design transforms passive recipients into engaged participants.
              You'll see higher completion rates, better knowledge transfer, improved on-the-job
              application, and ultimately, measurable business impact from your learning investment.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 3,
    title: 'Content Scope & Structure',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Strategic content architecture is the difference between overwhelming learners and
            building competence systematically. Thoughtful scope definition and logical sequencing
            create scaffolded learning experiences that build confidence while delivering mastery.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Cognitive Scaffolding
              </h4>
              <p className="text-text-secondary text-sm">
                Just like building construction, learning requires a solid foundation before adding
                complexity. Sequencing content from foundational concepts to advanced applications
                prevents learners from feeling lost and ensures new knowledge connects to existing
                mental models.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Timer} />
                Time Efficiency
              </h4>
              <p className="text-text-secondary text-sm">
                Chunking content into digestible modules (15-20 minutes each) aligns with attention
                spans and modern work schedules. Microlearning design lets busy professionals learn
                during coffee breaks instead of requiring dedicated half-days, increasing
                completion.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={RefreshCw} />
                Retrieval Practice
              </h4>
              <p className="text-text-secondary text-sm">
                Structured content enables spaced repetition—revisiting key concepts across modules
                strengthens memory consolidation. Strategic review points (after modules 3, 6, 9)
                combat the forgetting curve and ensure long-term retention, not just short-term
                recall.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Puzzle} />
                Modular Flexibility
              </h4>
              <p className="text-text-secondary text-sm">
                Well-defined modules create reusable learning assets. Today's onboarding course
                becomes tomorrow's refresher training or next year's advanced certification
                prerequisite. This modularity maximizes your content investment ROI over time.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Thoughtful content architecture transforms information dumps into learning journeys.
              Learners progress with confidence, retention improves dramatically, and your training
              delivers sustainable skill development rather than fleeting knowledge exposure.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 4,
    title: 'Instructional Strategy & Methods',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            How you deliver content matters as much as what you deliver. Strategic instructional
            methods—grounded in learning science—activate different cognitive processes, ensuring
            knowledge sticks and transfers to real-world performance.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={FlaskConical} />
                Active Learning Science
              </h4>
              <p className="text-text-secondary text-sm">
                Passive reading yields ~10% retention; active practice yields ~75%. Methods like
                scenario-based learning, problem-solving exercises, and peer collaboration force
                cognitive engagement, transforming spectators into practitioners who build durable
                skills.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Drama} />
                Contextual Application
              </h4>
              <p className="text-text-secondary text-sm">
                Case studies and simulations bridge the "knowing-doing gap." When learners practice
                in realistic contexts—handling objections, troubleshooting equipment, analyzing
                budgets—they build confidence and transfer skills directly to job performance
                without trial-and-error risk.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Users} />
                Social Learning Power
              </h4>
              <p className="text-text-secondary text-sm">
                Discussion forums, peer reviews, and collaborative projects tap into collective
                intelligence. Learners benefit from diverse perspectives, build professional
                networks, and develop skills like communication and teamwork—critical competencies
                beyond technical knowledge.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Differentiated Delivery
              </h4>
              <p className="text-text-secondary text-sm">
                Blending methods (video + reading + practice) respects diverse learning preferences
                and cognitive styles. Visual learners get diagrams; kinesthetic learners get
                simulations. Multimodal approaches ensure accessibility while reinforcing concepts
                through varied repetition.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Evidence-based instructional strategies don't just improve test scores—they drive
              behavior change. Learners confidently apply new skills on day one, reducing costly
              errors, increasing productivity, and delivering measurable performance improvements.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 5,
    title: 'Learning Activities & Interactions',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Engagement isn't entertainment—it's the cognitive fuel that drives learning. Strategic
            activities and interactions transform passive consumption into active construction of
            knowledge, ensuring learners don't just complete courses but develop competence.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Gamepad2} />
                Interactivity Drives Retention
              </h4>
              <p className="text-text-secondary text-sm">
                Click-through slides yield minimal learning; interactive simulations yield mastery.
                Branching scenarios, drag-and-drop exercises, and decision trees force learners to
                apply concepts immediately, strengthening neural pathways through deliberate
                practice.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={RefreshCw} />
                Feedback Loops
              </h4>
              <p className="text-text-secondary text-sm">
                Immediate, corrective feedback accelerates learning by clarifying misconceptions
                before they solidify. Well-designed activities provide explanations, not just
                "correct/incorrect"—helping learners understand why their reasoning was flawed and
                how to improve.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Puzzle} />
                Authentic Problem-Solving
              </h4>
              <p className="text-text-secondary text-sm">
                Activities that mirror real job challenges build transfer-ready skills. When
                learners analyze actual datasets, respond to customer scenarios, or troubleshoot
                equipment failures, they develop pattern recognition and decision-making expertise
                that applies immediately.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Progressive Challenge
              </h4>
              <p className="text-text-secondary text-sm">
                Varied difficulty levels prevent boredom (too easy) and anxiety (too hard). Start
                with guided practice, progress to scaffolded challenges, culminate in independent
                application. This gradual release of support builds confidence alongside competence.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Thoughtfully designed activities aren't busywork—they're deliberate practice
              opportunities that build automaticity. Learners develop fluency, not just familiarity,
              enabling them to perform under pressure when job demands require quick, confident
              action.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 6,
    title: 'Assessment & Evaluation',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Assessment isn't about gatekeeping—it's about proving learning happened and guiding
            improvement. Strategic evaluation measures what matters (performance, not memorization),
            validates training ROI, and identifies gaps requiring intervention.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Alignment with Objectives
              </h4>
              <p className="text-text-secondary text-sm">
                If your objective says "analyze data," multiple-choice recall tests won't suffice.
                Performance-based assessments—case studies, portfolios, simulations—directly measure
                the skills you promised to develop, ensuring training delivers what it advertised.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Microscope} />
                Diagnostic Power
              </h4>
              <p className="text-text-secondary text-sm">
                Pre-assessments reveal knowledge gaps, enabling personalized learning paths.
                Formative assessments identify struggling learners early for intervention. Summative
                assessments confirm mastery. This diagnostic approach prevents one-size-fits-all
                inefficiency.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={BarChart3} />
                Data-Driven Improvement
              </h4>
              <p className="text-text-secondary text-sm">
                Assessment analytics reveal which content confused learners, which activities
                worked, and which objectives need reinforcement. This data transforms future
                iterations from guesswork into evidence-based refinement, continuously improving
                quality.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={DollarSign} />
                Business Impact Validation
              </h4>
              <p className="text-text-secondary text-sm">
                Kirkpatrick Level 3 and 4 evaluation (behavior change and business results) proves
                training ROI to stakeholders. When you track metrics like reduced errors, faster
                onboarding, or increased sales, training shifts from cost center to strategic asset.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Rigorous assessment transforms training from a compliance checkbox into a performance
              accelerator. You'll demonstrate ROI to leadership, identify high-performers for
              advancement, and continuously refine content to maximize impact on business outcomes.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 7,
    title: 'Resources & Materials',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Quality resources don't just supplement learning—they enable it. Strategic material
            selection ensures learners have the right tools, references, and supports to succeed
            during training and apply skills long after completion.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={BookOpen} />
                Just-in-Time Support
              </h4>
              <p className="text-text-secondary text-sm">
                Job aids, quick-reference guides, and cheat sheets reduce cognitive load. When
                learners can access procedural knowledge on demand, they free mental resources for
                higher-order thinking like problem-solving and decision-making—accelerating
                competence.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Palette} />
                Multimedia Engagement
              </h4>
              <p className="text-text-secondary text-sm">
                Video demonstrations, interactive infographics, and audio explanations cater to
                diverse learning preferences while reinforcing concepts through multiple modalities.
                Dual coding (visual + verbal) improves encoding and retention compared to text
                alone.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Link} />
                Extended Learning Ecosystem
              </h4>
              <p className="text-text-secondary text-sm">
                Curated external resources—industry articles, expert videos, professional
                communities— extend learning beyond formal training. This ecosystem approach fosters
                continuous development and keeps skills current in rapidly evolving fields.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Accessibility} />
                Accessibility Compliance
              </h4>
              <p className="text-text-secondary text-sm">
                WCAG-compliant resources (captions, transcripts, alt-text, screen-reader compatible)
                ensure equitable access for learners with disabilities. Universal Design for
                Learning principles benefit everyone while meeting legal requirements.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Comprehensive resources transform training from a one-time event into a sustained
              performance support system. Learners succeed independently, reduce reliance on expert
              help, and maintain competence long after initial training—maximizing your investment.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 8,
    title: 'Technology & Platform',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Technology should enable learning, not obstruct it. Strategic platform selection
            balances functionality, usability, accessibility, and integration—creating seamless
            experiences that learners actually use and administrators can efficiently manage.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Rocket} />
                User Experience Impact
              </h4>
              <p className="text-text-secondary text-sm">
                Clunky interfaces cause abandonment; intuitive platforms drive completion. Mobile-
                responsive design, fast load times, and clear navigation reduce friction, letting
                learners focus on content instead of battling technology. UX directly impacts ROI.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={BarChart3} />
                Analytics & Reporting
              </h4>
              <p className="text-text-secondary text-sm">
                Robust LMS analytics reveal who's struggling, which content confuses, and what
                drives success. xAPI tracking captures granular interaction data, enabling
                personalization and continuous improvement based on evidence, not assumptions.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Link} />
                Integration Efficiency
              </h4>
              <p className="text-text-secondary text-sm">
                SSO integration eliminates login friction. HRIS/ATS integration automates
                enrollment. API connectivity enables custom reporting. These integrations reduce
                administrative overhead, allowing L&D teams to focus on strategy, not manual data
                entry.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Shield} />
                Security & Compliance
              </h4>
              <p className="text-text-secondary text-sm">
                GDPR/SOC 2 compliance protects sensitive learner data. Role-based permissions
                control content access. Audit trails document training completion for regulatory
                requirements. Security isn't optional—it's foundational for enterprise trust.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              The right technology platform scales learning efficiently, provides actionable
              insights, and delivers frictionless experiences that learners embrace. Your team saves
              time, learners stay engaged, and stakeholders see measurable impact from your tech
              investment.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 9,
    title: 'Implementation & Rollout',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Perfect training fails if implementation is chaotic. Strategic rollout planning ensures
            smooth launches, manages change resistance, builds stakeholder support, and establishes
            sustainable practices that turn one-time initiatives into lasting organizational assets.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Pilot Testing Value
              </h4>
              <p className="text-text-secondary text-sm">
                Beta launches with small cohorts reveal usability issues, confusing content, and
                technical glitches before full rollout. Early feedback enables iteration, preventing
                large-scale disasters and ensuring learners experience polished, professional
                training.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Megaphone} />
                Change Management
              </h4>
              <p className="text-text-secondary text-sm">
                Manager briefings, executive sponsorship, and learner communication campaigns build
                awareness and buy-in. When leaders champion training and communicate "why,"
                resistance drops, participation rises, and training becomes valued development, not
                compliance burden.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Timer} />
                Phased Rollout Strategy
              </h4>
              <p className="text-text-secondary text-sm">
                Gradual deployment (department by department) prevents overwhelming support teams,
                enables controlled scaling, and allows course corrections based on early adopter
                feedback. Phased approaches reduce risk while building momentum through early wins.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Wrench} />
                Support Infrastructure
              </h4>
              <p className="text-text-secondary text-sm">
                Help desk protocols, FAQ resources, and facilitator training ensure learners get
                timely support when stuck. Robust support infrastructure prevents frustration-driven
                abandonment and demonstrates organizational commitment to learner success.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Strategic implementation transforms training launches from chaotic firefights into
              orchestrated successes. High adoption rates, positive learner sentiment, and smooth
              operations prove your program is professionally managed and positioned for long-term
              impact.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 10,
    title: 'Success Metrics & Continuous Improvement',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Learning programs that don't measure impact become budget casualties. Strategic metrics
            prove value, guide optimization, and transform training from cost center to strategic
            advantage. What gets measured gets managed—and improved.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={BarChart3} />
                Kirkpatrick's Four Levels
              </h4>
              <p className="text-text-secondary text-sm">
                Reaction (satisfaction), Learning (knowledge gain), Behavior (on-job application),
                and Results (business impact) provide comprehensive evaluation. Tracking all four
                levels proves training didn't just happen—it worked, driving tangible outcomes.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={DollarSign} />
                ROI Calculation
              </h4>
              <p className="text-text-secondary text-sm">
                Phillips ROI methodology (benefits minus costs, divided by costs) quantifies
                training value in financial terms stakeholders understand. Demonstrating 3:1 or 5:1
                returns secures future budgets and positions L&D as revenue driver, not overhead.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={RefreshCw} />
                Continuous Iteration
              </h4>
              <p className="text-text-secondary text-sm">
                Regular data review (quarterly analytics audits) identifies improvement
                opportunities: confusing modules, underutilized resources, demographic gaps.
                Evidence-based iteration ensures training evolves with business needs, maintaining
                relevance and effectiveness.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 flex items-center gap-2 font-semibold">
                <BrandIcon icon={Target} />
                Leading vs. Lagging Indicators
              </h4>
              <p className="text-text-secondary text-sm">
                Leading indicators (completion rates, engagement scores) predict future success.
                Lagging indicators (performance improvement, revenue impact) confirm it happened.
                Balanced dashboards provide early warnings and outcome validation for comprehensive
                program health.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <BrandIcon icon={Lightbulb} />
              The Result
            </p>
            <p className="text-text-secondary text-sm">
              Data-driven evaluation transforms learning from faith-based to evidence-based. You'll
              defend budgets with confidence, optimize continuously, demonstrate strategic value to
              leadership, and build a reputation as a measurable contributor to organizational
              success.
            </p>
          </div>
        </div>
      ),
    },
  },
];

/**
 * Helper function to get whyThisMatters content by section title
 *
 * @param sectionTitle - The title of the section to match
 * @returns WhyThisMattersContent or undefined if not found
 */
export function getWhyThisMattersContent(sectionTitle: string): WhyThisMattersContent | undefined {
  const section = dynamicQuestionnaireWhyItMatters.find(
    (s) => s.title.toLowerCase() === sectionTitle.toLowerCase()
  );
  return section?.whyThisMatters;
}
