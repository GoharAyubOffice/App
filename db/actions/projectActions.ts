import { database } from '../index';
import { Project } from '../model/project';

export interface ProjectData {
  name: string;
  description?: string;
  color?: string;
  createdBy: string;
  workspaceId: string;
}

export class ProjectActions {
  static async createProject(projectData: ProjectData): Promise<Project | null> {
    try {
      const result = await database.write(async () => {
        const project = await database.get('projects').create((newProject: any) => {
          newProject.name = projectData.name;
          newProject.description = projectData.description || '';
          newProject.color = projectData.color || '#3B82F6';
          newProject.createdBy = projectData.createdBy;
          newProject.workspaceId = projectData.workspaceId;
          newProject.isActive = true;
          newProject.createdAt = new Date();
          newProject.updatedAt = new Date();
        });
        return project;
      });

      return result as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  static async getUserProjects(userId?: string): Promise<Project[]> {
    try {
      const projects = await database.get('projects')
        .query()
        .fetch();

      return projects as Project[];
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }
  }

  static async getAvailableProjects(): Promise<Project[]> {
    try {
      const projects = await database.get('projects')
        .query()
        .fetch();

      return projects as Project[];
    } catch (error) {
      console.error('Error fetching available projects:', error);
      return [];
    }
  }

  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const project = await database.get('projects').find(projectId);
      return project as Project;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  static async updateProject(projectId: string, updates: Partial<ProjectData>): Promise<Project | null> {
    try {
      const result = await database.write(async () => {
        const project = await database.get('projects').find(projectId);
        
        return await project.update((updatedProject: any) => {
          if (updates.name !== undefined) updatedProject.name = updates.name;
          if (updates.description !== undefined) updatedProject.description = updates.description;
          if (updates.color !== undefined) updatedProject.color = updates.color;
          updatedProject.updatedAt = new Date();
        });
      });

      return result as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      await database.write(async () => {
        const project = await database.get('projects').find(projectId);
        await project.markAsDeleted();
      });

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }
}