export interface ProjectModel {
  id: number,
  date: Date,
  title: string,
  image: ProjectImage[],
  /** Optional columns — rendered only when the row provides them. */
  description?: string,
  tags?: string[]
}

export interface ProjectImage {
  image_path: string
  description: string
}
