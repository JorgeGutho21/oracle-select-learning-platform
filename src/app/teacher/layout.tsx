import type { ReactNode } from 'react';
import { TeacherNav } from '@/features/teacher/presentation/teacher-nav';

/** Navegación común del panel docente. La autorización la hace cada página (y RLS). */
export default function TeacherLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="teacher-workspace">
      <TeacherNav />
      <div className="teacher-workspace__main">{children}</div>
    </div>
  );
}
