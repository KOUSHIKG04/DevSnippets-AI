export type Snippet = {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSnippetInput = {
  title: string;
  code: string;
  language: string;
  tags: string[];
};

export type SnippetAttachment = {
  id: number;
  snippetId: number;
  uri: string;
  type: "image";
  createdAt: string;
};
