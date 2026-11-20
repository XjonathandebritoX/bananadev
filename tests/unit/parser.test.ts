import { describe, it, expect } from 'vitest';
import { parseCurriculum, validateCurriculum } from '../../src/lib/curriculum/parse';
import { getCurriculum } from '../../src/lib/curriculum/load';

describe('Curriculum Parser', () => {
  let curriculum: ReturnType<typeof getCurriculum>;

  it('should parse without throwing', () => {
    expect(() => {
      curriculum = getCurriculum();
    }).not.toThrow();
  });

  it('should have 6 semesters', () => {
    expect(curriculum.semesters).toHaveLength(6);
  });

  it('should have 45 disciplines', () => {
    expect(curriculum.disciplines).toHaveLength(45);
  });

  it('should have 6 integrator projects', () => {
    expect(curriculum.projects).toHaveLength(6);
  });

  it('should have 2400 total hours', () => {
    expect(curriculum.meta.totalHours).toBe(2400);
  });

  it('should have discipline numbers 1-45', () => {
    const numbers = curriculum.disciplines.map((d) => d.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
  });

  it('each semester should sum to 400h', () => {
    for (const semester of curriculum.semesters) {
      const disciplineHours = semester.disciplines.reduce((sum, d) => sum + d.hours, 0);
      const total = disciplineHours + semester.project.hours;
      expect(total).toBe(400);
    }
  });

  it('each discipline should have content and resources', () => {
    for (const discipline of curriculum.disciplines) {
      expect(discipline.content.length).toBeGreaterThan(0);
      // Eletiva Tecnológica é a única sem recursos próprios
      if (discipline.number !== 44) {
        expect(discipline.resources.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have 9 specializations', () => {
    expect(curriculum.specializations).toHaveLength(9);
  });

  it('should preserve all reference URLs', () => {
    expect(Object.keys(curriculum.references).length).toBeGreaterThan(90);
  });

  it('validateCurriculum should pass for valid curriculum', () => {
    const problems: string[] = [];
    validateCurriculum(curriculum, problems);
    expect(problems).toHaveLength(0);
  });
});