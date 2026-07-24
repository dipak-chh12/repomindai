export interface RepositoryOverview {
  repository_name: string;
  owner: string;
  full_name: string;
  primary_language: string;
  framework: string;
  total_files: number;
  indexed_files: number;
  lines_of_code: number;
  readme_summary: string;
  ai_summary: string;
}

export interface ArchitecturePattern {
  name: string;
  confidence: number;
  reasoning: string;
}

export interface TechStack {
  backend: string[];
  frontend: string[];
  database: string[];
  frameworks: string[];
  libraries: string[];
  testing: string[];
  devops: string[];
  ai_libraries: string[];
  package_managers: string[];
  build_tools: string[];
}

export interface FolderExplanation {
  path: string;
  explanation: string;
}

export interface ComponentItem {
  category: string;
  file_path: string;
  lines: string;
  explanation: string;
}

export interface RequestFlowStep {
  step: string;
  layer: string;
  description: string;
}

export interface AIInsights {
  strengths: string[];
  potential_code_smells: string[];
  duplicate_logic: string[];
  large_classes: string[];
  missing_documentation: string[];
  todo_comments: string[];
  suggested_improvements: string[];
}

export interface CodeStatistics {
  files_indexed: number;
  chunks_created: number;
  functions_detected: number;
  classes_detected: number;
  languages: Record<string, number>;
  average_chunk_size: number;
  embedding_model: string;
  retrieval_time_ms: number;
}

export interface RepositoryReport {
  overview: RepositoryOverview;
  architecture: ArchitecturePattern[];
  tech_stack: TechStack;
  folder_explanations: FolderExplanation[];
  important_components: ComponentItem[];
  request_flow: RequestFlowStep[];
  ai_insights: AIInsights;
  code_statistics: CodeStatistics;
}

export interface SearchResultItem {
  file_path: string;
  language: string;
  chunk_type: string;
  class_name: string;
  function_name: string;
  start_line: number;
  end_line: number;
  score: number;
  code_content: string;
  summary: string;
  github_url: string;
}

export interface Citation {
  source_id: number;
  file_path: string;
  start_line: number;
  end_line: number;
  similarity_score: number;
  github_url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  retrieved_chunks?: SearchResultItem[];
}

export interface SampleRepo {
  id: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: string;
  framework: string;
}
