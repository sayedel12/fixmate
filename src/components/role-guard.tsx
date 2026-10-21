import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Heading, Notice, Page } from './ui';
import { useAuth, type UserRole } from '../providers/auth-provider';
import { colors } from '../lib/theme';

export function RoleGuard({ role, children }: PropsWithChildren<{ role: UserRole }>) {
  const auth = useAuth();
  if (auth.loading || auth.roleLoading) {
    return <Page><ActivityIndicator color={colors.teal} /></Page>;
  }
  if (auth.roleError) {
    return <Page><Heading>Could not verify access</Heading><Notice tone="error">{auth.roleError}</Notice></Page>;
  }
  if (auth.session && !auth.role) {
    return <Page><Heading>Account role unavailable</Heading><Notice tone="error">Your secure profile could not be loaded. Contact FixMate support.</Notice></Page>;
  }
  if (!auth.session) {
    return <Page><Heading>Sign in required</Heading><Card><Text>This workspace is available only to authorized {role} accounts.</Text><Button title="Sign in" onPress={() => router.push('/sign-in')} /></Card></Page>;
  }
  if (auth.role !== role && auth.role !== 'admin') {
    return <Page><Heading>Access restricted</Heading><Card><Text>Your account does not have permission to open this workspace.</Text><Button title="Back to home" onPress={() => router.replace('/(tabs)')} /></Card></Page>;
  }
  return children;
}
