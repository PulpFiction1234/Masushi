import supabase from '@/server/supabase';

type SettingRow = {
  id: string;
  value: boolean;
};

const FORCE_CLOSED_ID = 'forceClosed';

export async function getForceClosed(): Promise<boolean> {
  const { data, error } = await supabase
    .from('Setting')
    .select('value')
    .eq('id', FORCE_CLOSED_ID)
    .maybeSingle<Pick<SettingRow, 'value'>>();

  if (error) {
    throw new Error(`Failed to retrieve force closed state: ${error.message}`);
  }

  return data?.value ?? false;
}

export async function setForceClosed(value: boolean): Promise<void> {
  const { error } = await supabase
    .from('Setting')
    .upsert(
      { id: FORCE_CLOSED_ID, value },
      { onConflict: 'id' } // sin `returning`
    );

  if (error) {
    throw new Error(`Failed to update force closed state: ${error.message}`);
  }
}
