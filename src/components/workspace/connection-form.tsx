'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DATABASE_TYPE_LABELS,
  DATABASE_TYPES,
  type DatabaseType,
  DEFAULT_PORTS,
} from '@/config/constants';
import { useCreateConnection, useUpdateConnection } from '@/hooks/use-connections';
import type { Connection } from '@/schemas/connection.schema';
import { connectionSchema } from '@/schemas/connection.schema';
import { SSHConfigFields } from './ssh-config-fields';

type ConnectionFormValues = z.input<typeof connectionSchema>;

interface ConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: Connection | undefined;
}

// rendering-hoist-jsx: Extract static component outside
function FormError({ message }: { message?: string | undefined }) {
  if (!message) {
    return null;
  }
  return <p className="text-sm text-destructive">{message}</p>;
}

// rerender-memo-with-default-value: Hoist static default values
const EMPTY_DEFAULT_VALUES: ConnectionFormValues = {
  name: '',
  type: DATABASE_TYPES.POSTGRESQL,
  host: 'localhost',
  port: DEFAULT_PORTS[DATABASE_TYPES.POSTGRESQL],
  database: '',
  username: '',
  password: '',
  ssl: true,
  sshEnabled: false,
};

// js-hoist-regexp: Hoist static values outside component
const DATABASE_TYPE_ENTRIES = Object.entries(DATABASE_TYPE_LABELS);

const getDefaultValues = (connection?: Connection): ConnectionFormValues => {
  if (connection) {
    return {
      name: connection.name,
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: '',
      ssl: connection.ssl,
      sshEnabled: connection.sshEnabled,
      sshHost: connection.sshHost ?? undefined,
      sshPort: connection.sshPort ?? undefined,
      sshUsername: connection.sshUsername ?? undefined,
    };
  }
  return EMPTY_DEFAULT_VALUES;
};

export function ConnectionForm({ open, onOpenChange, connection }: ConnectionFormProps) {
  const isEditing = !!connection;
  const [showPassword, setShowPassword] = useState(false);

  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();

  // rerender-memo-with-default-value: Memoize default values computation
  const defaultValues = useMemo(() => getDefaultValues(connection), [connection]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(connection));
    }
  }, [open, connection, reset]);

  const selectedType = watch('type');
  const sshEnabled = watch('sshEnabled');

  // rerender-functional-setstate: Use useCallback for stable handlers
  const handleTypeChange = useCallback(
    (value: DatabaseType | null) => {
      if (!value) {
        return;
      }
      setValue('type', value);
      const defaultPort = DEFAULT_PORTS[value];
      if (defaultPort) {
        setValue('port', defaultPort);
      }
    },
    [setValue],
  );

  const onSubmit = useCallback(
    async (data: ConnectionFormValues) => {
      try {
        // Ensure ssl and sshEnabled have boolean values (schema has defaults)
        const formData = {
          ...data,
          ssl: data.ssl ?? true,
          sshEnabled: data.sshEnabled ?? false,
        };

        if (isEditing && connection) {
          await updateConnection.mutateAsync({ id: connection.id, data: formData });
        } else {
          await createConnection.mutateAsync(formData);
        }
        reset();
        onOpenChange(false);
      } catch {
        // Error handled by mutation
      }
    },
    [isEditing, connection, updateConnection, createConnection, reset, onOpenChange],
  );

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Connection' : 'New Connection'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your database connection settings.'
              : 'Add a new database connection to get started.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My Database"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            <FormError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Database Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select database type" />
              </SelectTrigger>
              <SelectContent>
                {DATABASE_TYPE_ENTRIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError message={errors.type?.message} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input id="host" placeholder="localhost" {...register('host')} />
              <FormError message={errors.host?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" {...register('port', { valueAsNumber: true })} />
              <FormError message={errors.port?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database Name</Label>
            <Input id="database" placeholder="mydb" {...register('database')} />
            <FormError message={errors.database?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="postgres" {...register('username')} />
              <FormError message={errors.username?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEditing ? '••••••••' : 'Enter password'}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={togglePassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <FormError message={errors.password?.message} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('ssl')} className="rounded" />
              Use SSL
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('sshEnabled')} className="rounded" />
              SSH Tunnel
            </label>
          </div>

          {sshEnabled && <SSHConfigFields register={register} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
