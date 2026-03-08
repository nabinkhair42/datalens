'use client';

import type { FieldValues, UseFormRegister } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SSHConfigFieldsProps<T extends FieldValues> {
  register: UseFormRegister<T>;
}

export function SSHConfigFields<T extends FieldValues>({ register }: SSHConfigFieldsProps<T>) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <p className="text-sm font-medium">SSH Configuration</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="sshHost">SSH Host</Label>
          <Input
            id="sshHost"
            placeholder="ssh.example.com"
            // biome-ignore lint/suspicious/noExplicitAny: Field name matches schema
            {...register('sshHost' as any)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sshPort">SSH Port</Label>
          <Input
            id="sshPort"
            type="number"
            defaultValue={22}
            // biome-ignore lint/suspicious/noExplicitAny: Field name matches schema
            {...register('sshPort' as any, { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sshUsername">SSH Username</Label>
        <Input
          id="sshUsername"
          placeholder="ubuntu"
          // biome-ignore lint/suspicious/noExplicitAny: Field name matches schema
          {...register('sshUsername' as any)}
        />
      </div>
    </div>
  );
}
