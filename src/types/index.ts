export type Similarity = {
  workflowId: string;
  workflowName: string;
  score: number;
  reason: string;
};

export type Workflow = {
  id: string;
  fileName: string;
  content: string;
  useCases: string;
  keyNodes: string;
  description: string;
  similarities: Similarity[];
};
