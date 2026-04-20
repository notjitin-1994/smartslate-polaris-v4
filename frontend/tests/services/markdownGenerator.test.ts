import { describe, it, expect } from 'vitest';
import { markdownGeneratorService } from '@/lib/services/markdownGenerator';
import { Blueprint } from '@/lib/ollama/schema';

describe('MarkdownGeneratorService', () => {
  it('should generate complete markdown for a blueprint', () => {
    const blueprint: Blueprint = {
      title: 'Test Learning Blueprint',
      overview: 'This is a test blueprint for learning.',
      learningObjectives: ['Learn testing fundamentals', 'Master test automation'],
      modules: [
        {
          title: 'Introduction to Testing',
          duration: 4,
          topics: ['What is testing?', 'Why test?'],
          activities: ['Read documentation', 'Watch videos'],
          assessments: ['Quiz', 'Assignment'],
        },
        {
          title: 'Advanced Testing Techniques',
          duration: 6,
          topics: ['Unit testing', 'Integration testing'],
          activities: ['Hands-on coding', 'Group projects'],
          assessments: ['Final project', 'Peer review'],
        },
      ],
      timeline: {
        'Week 1-2': 'Introduction to Testing',
        'Week 3-4': 'Advanced Techniques',
      },
      resources: [
        {
          name: 'Testing Best Practices',
          type: 'Article',
          url: 'https://example.com/testing',
        },
        {
          name: 'Testing Tools Guide',
          type: 'Documentation',
          url: 'https://example.com/tools',
        },
      ],
    };

    const markdown = markdownGeneratorService.generateMarkdown(blueprint);

    expect(markdown).toContain('# Test Learning Blueprint');
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('This is a test blueprint for learning.');
    expect(markdown).toContain('## Learning Objectives');
    expect(markdown).toContain('- Learn testing fundamentals');
    expect(markdown).toContain('- Master test automation');
    expect(markdown).toContain('## Modules');
    expect(markdown).toContain('### Introduction to Testing');
    expect(markdown).toContain('- **Duration:** 4 hours');
    expect(markdown).toContain('- **Topics:** What is testing?, Why test?');
    expect(markdown).toContain('- **Activities:** Read documentation, Watch videos');
    expect(markdown).toContain('- **Assessments:** Quiz, Assignment');
    expect(markdown).toContain('## Timeline');
    expect(markdown).toContain('| Week 1-2 | Introduction to Testing |');
    expect(markdown).toContain('## Resources');
    expect(markdown).toContain('[Testing Best Practices (Article)](https://example.com/testing)');
    expect(markdown).toContain('[Testing Tools Guide (Documentation)](https://example.com/tools)');
  });

  it('should handle blueprint without optional fields', () => {
    const blueprint: Blueprint = {
      title: 'Minimal Blueprint',
      overview: 'A minimal blueprint.',
      learningObjectives: ['Learn something'],
      modules: [
        {
          title: 'Basic Module',
          duration: 2,
          topics: ['Topic 1'],
          activities: ['Activity 1'],
          assessments: ['Assessment 1'],
        },
      ],
    };

    const markdown = markdownGeneratorService.generateMarkdown(blueprint);

    expect(markdown).toContain('# Minimal Blueprint');
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('A minimal blueprint.');
    expect(markdown).toContain('## Learning Objectives');
    expect(markdown).toContain('- Learn something');
    expect(markdown).toContain('## Modules');
    expect(markdown).toContain('### Basic Module');
    expect(markdown).not.toContain('## Timeline');
    expect(markdown).not.toContain('## Resources');
  });

  it('should handle empty arrays gracefully', () => {
    const blueprint: Blueprint = {
      title: 'Empty Arrays Blueprint',
      overview: 'Testing empty arrays.',
      learningObjectives: [],
      modules: [],
    };

    const markdown = markdownGeneratorService.generateMarkdown(blueprint);

    expect(markdown).toContain('# Empty Arrays Blueprint');
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('Testing empty arrays.');
    expect(markdown).toContain('## Learning Objectives');
    expect(markdown).toContain('## Modules');
    expect(markdown).not.toContain('## Timeline');
    expect(markdown).not.toContain('## Resources');
  });

  it('should escape special characters in markdown', () => {
    const blueprint: Blueprint = {
      title: 'Blueprint with *special* characters',
      overview: 'Overview with **bold** and *italic* text.',
      learningObjectives: ['Objective with | pipe'],
      modules: [
        {
          title: 'Module with `code`',
          duration: 1,
          topics: ['Topic with [link](https://example.com)'],
          activities: ['Activity with <script> tag'],
          assessments: ['Assessment with # hash'],
        },
      ],
    };

    const markdown = markdownGeneratorService.generateMarkdown(blueprint);

    expect(markdown).toContain('# Blueprint with \\*special\\* characters');
    expect(markdown).toContain('Overview with \\*\\*bold\\*\\* and \\*italic\\* text.');
    expect(markdown).toContain('- Objective with \\| pipe');
    expect(markdown).toContain('### Module with \\`code\\`');
    expect(markdown).toContain('- **Topics:** Topic with \\[link\\]\\(https://example.com\\)');
    expect(markdown).toContain('- **Activities:** Activity with &lt;script&gt; tag');
    expect(markdown).toContain('- **Assessments:** Assessment with \\# hash');
  });
});
