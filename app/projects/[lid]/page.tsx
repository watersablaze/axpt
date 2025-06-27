import { notFound } from 'next/navigation';
import projects from '@/data/projects.json';
import ProjectDetail from '@/components/projects/ProjectDetail';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = projects.find(p => p.id === params.id);
  if (!project) return notFound();

  return <ProjectDetail project={project} />;
}
