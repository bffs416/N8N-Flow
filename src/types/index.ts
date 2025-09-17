export type Similarity = {
  workflowId: number; // Changed from string to number
  workflowName: string;
  score: number;
  reason: string;
};

export type Workflow = {
  id: number; // This will be the numeric, auto-incrementing ID
  workflow_uuid: string; // A stable unique identifier for client-side logic
  fileName: string;
  content?: string;
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
  isFavorite?: boolean;
};
