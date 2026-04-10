'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { Check, Edit2, Sparkles, AlertTriangle, FileText, Download } from 'lucide-react';
import { z } from 'zod';

const assumptionsSchema = z.object({
  assumptions: z.array(
    z.object({
      category: z.string(),
      statement: z.string(),
      riskLevel: z.enum(['low', 'medium', 'high']),
    })
  ),
});

const blueprintSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  targetAudience: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  curriculumPath: z.array(
    z.object({
      moduleName: z.string(),
      description: z.string(),
      deliveryFormat: z.string(),
    })
  ),
  techStack: z.array(z.string()),
  successMetrics: z.array(z.string()),
  risksAndMitigations: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string(),
    })
  ),
});

interface BlueprintData {
  title?: string;
  executiveSummary?: string;
  targetAudience?: string[];
  learningObjectives?: string[];
  curriculumPath?: Array<{
    moduleName: string;
    description: string;
    deliveryFormat: string;
  }>;
  techStack?: string[];
  successMetrics?: string[];
  risksAndMitigations?: Array<{
    risk: string;
    mitigation: string;
  }>;
}

interface FinalizationPanelProps {
  starmapId: string;
  initialBlueprint?: BlueprintData | null;
}

export function FinalizationPanel({ starmapId, initialBlueprint }: FinalizationPanelProps) {
  const [step, setStep] = useState<'assumptions' | 'reviewing' | 'blueprint'>(
    initialBlueprint ? 'blueprint' : 'assumptions'
  );

  const {
    object: assumptionsObject,
    submit: generateAssumptions,
    isLoading: isGeneratingAssumptions,
  } = useObject({
    api: `/api/starmaps/${starmapId}/assumptions`,
    schema: assumptionsSchema,
  });

  const {
    object: blueprintObject,
    submit: generateBlueprint,
    isLoading: isGeneratingBlueprint,
  } = useObject({
    api: `/api/starmaps/${starmapId}/blueprint`,
    schema: blueprintSchema,
  });

  const [editAssumptionIndex, setEditAssumptionIndex] = useState<number | null>(null);
  const [editAssumptionText, setEditAssumptionText] = useState('');

  // Start generating assumptions immediately if we don't have a blueprint
  useEffect(() => {
    if (step === 'assumptions' && !isGeneratingAssumptions && (!assumptionsObject || !assumptionsObject.assumptions)) {
      generateAssumptions({});
    }
  }, [step, isGeneratingAssumptions, assumptionsObject, generateAssumptions]);

  const handleApproveAssumptions = () => {
    // Gather all assumptions (edited or original)
    const finalAssumptions = assumptionsObject?.assumptions
      ?.filter((a): a is { statement: string } => !!a?.statement)
      .map((a) => a.statement) || [];
    setStep('blueprint');
    generateBlueprint({ approvedAssumptions: finalAssumptions });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const blueprintToRender = initialBlueprint || blueprintObject;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto w-full max-w-4xl mx-auto print:p-0 print:max-w-none">
      
      {/* PHASE 3: Critical Assumptions */}
      {step === 'assumptions' && (
        <div className="w-full space-y-6 animate-in fade-in zoom-in duration-500 print:hidden">
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-secondary-500/10 text-secondary-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">Critical Assumptions Review</h2>
            <p className="text-white/40">Before generating the final blueprint, please verify these key assumptions.</p>
          </div>

          <div className="space-y-4">
            {assumptionsObject?.assumptions?.map((assumption, index) => {
              if (!assumption?.statement || !assumption?.category) return null;
              
              return (
                <div key={index} className="glass-card p-6 rounded-2xl border-white/5 relative group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-widest text-primary-500 font-bold mb-2 block">
                        {assumption.category}
                      </span>
                      {editAssumptionIndex === index ? (
                        <textarea
                          className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary-500 min-h-[80px]"
                          value={editAssumptionText}
                          onChange={(e) => setEditAssumptionText(e.target.value)}
                          autoFocus
                          onBlur={() => {
                            // Using a temporary variable to handle the potentially read-only or partial nature
                            // although useObject state is generally managed by the hook
                            (assumption as any).statement = editAssumptionText;
                            setEditAssumptionIndex(null);
                          }}
                        />
                      ) : (
                        <p className="text-sm text-white/90 leading-relaxed">{assumption.statement}</p>
                      )}
                    </div>
                    
                    {editAssumptionIndex !== index && (
                      <button 
                        onClick={() => {
                          setEditAssumptionIndex(index);
                          setEditAssumptionText(assumption.statement || '');
                        }}
                        className="text-white/30 hover:text-white transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isGeneratingAssumptions && assumptionsObject?.assumptions?.length && (
            <div className="flex justify-center mt-8 pt-8 border-t border-white/10">
              <button
                onClick={handleApproveAssumptions}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-secondary-500 text-white font-bold hover:bg-secondary-400 transition-all shadow-[0_0_20px_rgba(236,72,153,0.2)]"
              >
                <Check size={20} />
                Verify & Generate Blueprint
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3/4: Strategy Blueprint Generation & Export */}
      {step === 'blueprint' && (
        <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20">
          
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                {isGeneratingBlueprint ? <Sparkles className="animate-pulse" size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-white">
                  {blueprintToRender?.title || 'Generating Strategy Blueprint...'}
                </h2>
                {isGeneratingBlueprint && <p className="text-xs text-primary-500">Synthesizing discovery data...</p>}
              </div>
            </div>

            {!isGeneratingBlueprint && blueprintToRender && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                <Download size={16} />
                Export to PDF
              </button>
            )}
          </div>

          {blueprintToRender && (
            <div className="glass-card rounded-3xl overflow-hidden border-white/10 bg-white/[0.02] shadow-2xl print:shadow-none print:border-none print:bg-white print:text-black">
              {/* Document Header */}
              <div className="p-8 md:p-12 border-b border-white/5 print:border-black/10">
                <h1 className="text-3xl md:text-4xl font-bold font-heading text-white mb-6 print:text-black">
                  {blueprintToRender.title}
                </h1>
                
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-primary-500 uppercase tracking-widest print:text-gray-500">Executive Summary</h3>
                  <p className="text-white/80 leading-relaxed text-sm md:text-base print:text-black">
                    {blueprintToRender.executiveSummary}
                  </p>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12">
                
                {/* Left Column */}
                <div className="space-y-12">
                  <section>
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 print:text-gray-500">Target Audience</h3>
                    <ul className="space-y-3">
                      {blueprintToRender.targetAudience?.filter((item): item is string => !!item).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/80 print:text-black">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 print:text-gray-500">Learning Objectives</h3>
                    <ul className="space-y-3">
                      {blueprintToRender.learningObjectives?.filter((item): item is string => !!item).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/80 print:text-black">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 print:text-gray-500">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {blueprintToRender.techStack?.filter((tech): tech is string => !!tech).map((tech, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 print:border-black/20 print:text-black print:bg-transparent">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="space-y-12">
                  <section>
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 print:text-gray-500">Curriculum Path</h3>
                    <div className="space-y-4">
                      {blueprintToRender.curriculumPath?.filter((module): module is { moduleName: string; deliveryFormat: string; description: string } => !!module?.moduleName).map((module, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 print:border-black/10 print:bg-transparent">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-white text-sm print:text-black">{module?.moduleName}</h4>
                            <span className="text-[10px] px-2 py-1 rounded-md bg-primary-500/20 text-primary-400 print:text-gray-600 print:bg-gray-100">
                              {module?.deliveryFormat}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed print:text-gray-700">
                            {module?.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-4 print:text-gray-500">Success Metrics</h3>
                    <ul className="space-y-3">
                      {blueprintToRender.successMetrics?.filter((item): item is string => !!item).map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-white/80 print:text-black">
                          <Check className="text-secondary-500 shrink-0" size={16} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
