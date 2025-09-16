export type Similarity = {
  workflowId: string;
  workflowName: string;
  score: number;
  reason: string;
};

export type Workflow = {
  id: string;
  displayId: number; // For enumeration
  fileName: string;
  content: string;
  flowName: string;
  mainArea: string;
  secondaryAreas: string[];
  mainFunction: string;
  automationDestinations: string[];
  dataOrigins: string[];
  keyNodes: string[];
  complexity: 'Simple' | 'Medio' | 'Complejo';
  shortDescription: string;
  useCaseExamples: string[];
  similarities: Similarity[];
};
