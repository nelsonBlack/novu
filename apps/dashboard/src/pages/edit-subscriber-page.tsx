import { SubscriberDrawer } from '@/components/subscribers/subscriber-drawer';
import { useOnElementUnmount } from '@/hooks/use-on-element-unmount';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function EditSubscriberPage() {
  const { subscriberId } = useParams<{ subscriberId: string }>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const { ref: unmountRef } = useOnElementUnmount({
    callback: () => {
      navigate(-1);
    },
  });

  if (!subscriberId) {
    return null;
  }

  return <SubscriberDrawer ref={unmountRef} subscriberId={subscriberId} open={open} onOpenChange={setOpen} />;
}
