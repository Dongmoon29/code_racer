import { useRouter } from 'next/router';
import ProblemForm from '../../../components/admin/ProblemForm';

export default function CreateProblemPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/problems');
  };

  const handleCancel = () => {
    router.push('/admin/problems');
  };

  return (
    <ProblemForm
      mode="create"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
