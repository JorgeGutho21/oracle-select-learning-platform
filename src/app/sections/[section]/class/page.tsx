import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CurriculumDeckRoot } from '@/composition/curriculum/curriculum-deck-root';
import { deckView } from '@/features/curriculum/application/curriculum-api';
import { CURRICULUM_OUTLINE } from '@/features/curriculum/application/outline';
import { CurriculumSceneView } from '@/features/curriculum/presentation/scene-view';
import { getSection } from '@/features/sections/application/sections-api';

export function generateStaticParams() {
  return CURRICULUM_OUTLINE.map(({ section }) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<'/sections/[section]/class'>): Promise<Metadata> {
  const section = getSection((await params).section);
  return { title: section ? `Clase · ${section.title}` : 'Sección no encontrada' };
}

function sceneParam(value: string | string[] | undefined): number | null {
  const text = Array.isArray(value) ? value[0] : value;
  const number = Number(text);
  return text && Number.isInteger(number) && number > 0 ? number : null;
}

export default async function Page({
  params,
  searchParams,
}: PageProps<'/sections/[section]/class'>) {
  const id = (await params).section;
  if (id === 'fundamentos-sql') redirect('/presentation');
  const section = getSection(id);
  const deck = section ? deckView(section.id) : null;
  if (!section || !deck) notFound();
  const requested = sceneParam((await searchParams).scene);
  return (
    <div className="module-layout module-layout--presentation">
      <CurriculumDeckRoot
        section={section.id}
        requestedScene={requested !== null && requested <= deck.scenes.length ? requested : null}
        blocks={deck.blocks.map(({ id: blockId, title }) => ({ id: blockId, title }))}
        scenes={deck.scenes.map((scene) => ({
          number: scene.number,
          title: scene.title,
          shortTitle: scene.shortTitle,
          block: scene.block.id,
          steps: scene.steps,
          notes: scene.notes,
        }))}
        content={deck.scenes.map((scene) => (
          <CurriculumSceneView
            key={scene.id}
            scene={scene}
            section={{ number: section.number, title: section.title }}
          />
        ))}
      />
    </div>
  );
}
