'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2Icon, EyeClosed, EyeIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
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
import {
  useCreateConnection,
  useTestNewConnection,
  useUpdateConnection,
} from '@/hooks/use-connections';
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

// Helper type for test result state
type TestResultState = {
  success: boolean;
  message: string;
  latency?: number;
  version?: string;
} | null;

// Helper to create error result
const createErrorResult = (message: string): TestResultState => ({
  success: false,
  message,
});

// Helper to create success result
const createSuccessResult = (latency?: number, version?: string): TestResultState => {
  const result: NonNullable<TestResultState> = {
    success: true,
    message: 'Connection successful',
  };
  if (latency !== undefined) {
    result.latency = latency;
  }
  if (version !== undefined) {
    result.version = version;
  }
  return result;
};

const getDefaultValues = (connection?: Connection): ConnectionFormValues => {
  if (connection) {
    return {
      name: connection.name,
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password ?? '',
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
  const [testResult, setTestResult] = useState<TestResultState>(null);

  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();
  const testConnection = useTestNewConnection();

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
      setTestResult(null);
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
          await updateConnection.mutateAsync({
            id: connection.id,
            data: formData,
          });
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
    setTestResult(null);
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleTestConnection = useCallback(async () => {
    const values = watch();

    // Validate required fields
    if (!values.host || !values.database || !values.username) {
      setTestResult(createErrorResult('Please fill in host, database, and username fields'));
      return;
    }

    if (!values.password) {
      setTestResult(createErrorResult('Please enter a password'));
      return;
    }

    setTestResult(null);

    try {
      const result = await testConnection.mutateAsync({
        ...values,
        ssl: values.ssl ?? true,
        sshEnabled: values.sshEnabled ?? false,
      });

      setTestResult(
        result.success
          ? createSuccessResult(result.latency, result.version)
          : createErrorResult('Connection failed'),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setTestResult(createErrorResult(message));
    }
  }, [watch, testConnection]);

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
                  placeholder="Enter password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={togglePassword}
                >
                  {showPassword ? <EyeClosed /> : <EyeIcon />}
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

          {/* Test Connection */}
          {testResult && (
            <div
              className={`flex flex-1 items-center gap-2 text-sm ${
                testResult.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2Icon className="size-4 shrink-0" />
              ) : (
                <XCircleIcon className="size-4 shrink-0" />
              )}
              <span className="flex-1 truncate">{testResult.message}</span>
              {testResult.success && testResult.latency && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {testResult.latency}ms
                </span>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <Button type="button" variant="destructive" onClick={handleClose}>
              No, Close
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnection.isPending}
              >
                {testConnection.isPending && <Loader2Icon className="size-4 animate-spin" />}
                {testConnection.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Yes, Update' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
