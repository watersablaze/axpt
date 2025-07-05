// FILE: app/projects/[lid]/page.tsx

import { notFound } from 'next/navigation';
import projects from '@/data/projects.json';
import ProjectDetail from '@/components/projects/ProjectDetail';

type Props = {
  params: { lid: string };
};

export default function ProjectDetailPage({ params }: Props) {
  const project = projects.find((p) => p.id === params.lid);
  if (!project) return notFound();

  return <ProjectDetail project={project} />;
}