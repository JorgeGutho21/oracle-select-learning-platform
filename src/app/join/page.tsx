import { redirect } from 'next/navigation';

/** `/join` sin código lleva a la entrada por código de la sala en vivo (antes, 404). */
export default function Page() {
  redirect('/live');
}
