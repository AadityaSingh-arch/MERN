import { useParams } from 'react-router-dom';
import RecruiterWorkspace from '../components/RecruiterWorkspace';

export default function EditJobPage() {
  const { id } = useParams();
  // key forces a clean form when moving from one job's edit screen to another.
  return <RecruiterWorkspace key={id} editJobId={id} />;
}
