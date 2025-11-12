import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/admin/dashboard',
    permanent: false,
  },
});

export default function AdminIndexRedirect() {
  return null;
}
