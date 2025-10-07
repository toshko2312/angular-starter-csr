export interface ProjectModel {
  id: number,
  date: Date,
  title: string,
  image: Image[]
}

interface Image {
  image_path: string
  description: string
}