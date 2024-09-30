export interface Task {
    title: string;
    createdBy: string;
    createdAt: Date | null;
    dueDate: Date | null;
    downloads: string[];
  }