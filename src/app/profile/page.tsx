import type { Metadata } from 'next';
import { loadProfile } from '@/composition/accounts/account-pages';
import { updateProfileAction } from '@/composition/accounts/auth-actions';
import { firstParam, type SearchParams } from '@/composition/accounts/search-params';
import { SignOutButton } from '@/composition/accounts/sign-out-button';
import { accountNotice } from '@/features/accounts/application/auth-forms';
import { ProfileForm } from '@/features/accounts/presentation/auth-forms';
import { ProfileView } from '@/features/accounts/presentation/profile-view';
import { Alert } from '@/presentation/components/ui';

export const metadata: Metadata = {
  title: 'Mi perfil',
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const [{ profile, overall }, params] = await Promise.all([loadProfile(), searchParams]);
  const notice = accountNotice(firstParam(params.aviso));
  return (
    <ProfileView
      profile={profile}
      overall={overall}
      notice={notice && <Alert tone={notice.tone} title={notice.text} live />}
      form={
        <ProfileForm
          action={updateProfileAction}
          firstName={profile.firstName}
          lastName={profile.lastName}
        />
      }
      signOut={<SignOutButton />}
    />
  );
}
