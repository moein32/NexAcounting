import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PartyFormWizard } from '../components/PartyFormWizard';
import { partyService } from '../../../services/partyService';
import { useAuthStore } from '../../../stores/authStore';
import { Party } from '../../../types/party';
import { LoadingState } from '../../../components/ui/LoadingState';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { Edit, Users } from 'lucide-react';

export function EditPartyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness } = useAuthStore();

  const [party, setParty] = useState<Party | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchParty() {
      if (!currentBusiness || !id) return;
      setIsLoading(true);
      try {
        const data = await partyService.getPartyById(currentBusiness.id, id);
        setParty(data || []);
      } catch (err) {
        console.error('Error loading party for edit:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchParty();
  }, [currentBusiness, id]);

  if (isLoading) {
    return <LoadingState text="در حال بارگیری اطلاعات طرف حساب جهت ویرایش..." />;
  }

  if (!party) {
    return (
      <Card className="p-8">
        <EmptyState
          title="طرف حساب یافت نشد"
          description="طرف حساب درخواستی وجود ندارد یا دسترسی شما به آن محدود شده است."
          icon={<Users className="w-10 h-10 text-slate-400" />}
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/parties')}>
              بازگشت به فهرست
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ویرایش طرف حساب: ${party.display_name}`}
        description="به‌روزرسانی مشخصات فردی، آدرس، رابطین و مشخصات مالی"
        icon={<Edit className="w-6 h-6 text-amber-600" />}
      />

      <PartyFormWizard initialData={party} isEditMode={true} />
    </div>
  );
}
