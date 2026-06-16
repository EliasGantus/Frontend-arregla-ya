import type { SelectHTMLAttributes } from 'react';

import { cabaNeighborhoods } from '@/shared/lib/caba-neighborhoods';
import { Select } from '@/shared/ui/select';

interface NeighborhoodSelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const NeighborhoodSelect = ({
  error,
  ...props
}: NeighborhoodSelectProps) => (
  <Select error={error} {...props}>
    <option value="">Selecciona un barrio</option>
    {cabaNeighborhoods.map((neighborhood) => (
      <option key={neighborhood} value={neighborhood}>
        {neighborhood}
      </option>
    ))}
  </Select>
);
