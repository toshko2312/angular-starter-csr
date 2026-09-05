export interface ProjectModel {
  id: number,
  date: Date,
  title: string,
  image: ProjectImage[],
  /** Optional columns — rendered only when the row provides them. */
  description?: string,
  tags?: string[],
  /** Optional English text; blank falls back to the Bulgarian above. */
  title_en?: string | null,
  description_en?: string | null
}

export interface ProjectImage {
  image_path: string
  description: string
}
