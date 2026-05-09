"use client";

import { useState } from "react";
import {
  Container,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Text,
  Skeleton,
  SimpleGrid,
  Badge,
  ActionIcon,
  Menu,
  Center,
  Paper,
  Title,
  Alert,
  Modal,
  Switch,
  Divider,
} from "@mantine/core";
import {
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconSettings,
  IconCheck,
  IconAlertCircle,
  IconBolt,
  IconSearch,
  IconRefresh,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import {
  useAiProviders,
  useDeleteAiProvider,
  useTestAiProviderConnection,
} from "@/hooks/useAiProviders";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import type { AiProviderDetail } from "@agenticverdict/types";

function ProviderCard({
  provider,
  onEdit,
  onDelete,
}: {
  provider: AiProviderDetail;
  onEdit: (provider: AiProviderDetail) => void;
  onDelete: (provider: AiProviderDetail) => void;
}) {
  const t = useTranslations("settings");
  const testMutation = useTestAiProviderConnection();

  const handleTestConnection = () => {
    testMutation.mutate({ providerId: provider.id });
  };

  const statusColors = {
    active: "green",
    inactive: "gray",
    error: "red",
  } as const;

  return (
    <Paper p="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Badge color={statusColors[provider.status] || "gray"}>
            {t(`status.${provider.status}`)}
          </Badge>
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => onEdit(provider)}>
                {t("common.edit")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconBolt size={14} />}
                onClick={handleTestConnection}
                disabled={testMutation.isPending}
              >
                {t("actions.testConnection")}
              </Menu.Item>
              <Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(provider)}
              >
                {t("actions.remove")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Text fw={600} size="lg">
          {provider.name}
        </Text>

        <Text size="sm" c="dimmed">
          {provider.providerType}
        </Text>

        {provider.costTier && (
          <Badge variant="outline" size="sm">
            {t(`costTier.${provider.costTier}`)}
          </Badge>
        )}

        {provider.isDefault && (
          <Badge color="blue" variant="light" size="sm">
            {t("badges.default")}
          </Badge>
        )}

        <Group gap="xs" mt="xs">
          <Switch
            checked={provider.enabled}
            disabled
            size="xs"
            label={provider.enabled ? t("common.enabled") : t("common.disabled")}
          />
        </Group>

        {testMutation.isPending && (
          <Text size="xs" c="blue">
            {t("messages.testingConnection")}
          </Text>
        )}

        {testMutation.error && (
          <Alert icon={<IconAlertCircle size={14} />} color="red" mt="xs">
            {t("messages.connectionFailed")}
          </Alert>
        )}

        {testMutation.isSuccess && (
          <Alert icon={<IconCheck size={14} />} color="green" mt="xs">
            {t("messages.connectionSuccess")}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

export function TenantProvidersPage() {
  const t = useTranslations("settings");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<AiProviderDetail | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<AiProviderDetail | null>(null);

  useAppShellHeader({
    breadcrumbs: [
      { label: t("common.settings"), href: ROUTE_PATHS.SETTINGS_DOMAINS },
      { label: t("providers.pageTitle") },
    ],
  });

  const { data: providersData, isLoading, error, refetch } = useAiProviders();
  const deleteMutation = useDeleteAiProvider({
    onSuccess: () => {
      refetch();
    },
  });

  const providers = providersData?.items || [];

  const filteredProviders = providers.filter((provider: AiProviderDetail) => {
    const matchesSearch =
      provider.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.providerId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || provider.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (provider: AiProviderDetail) => {
    setProviderToDelete(provider);
  };

  const confirmDelete = () => {
    if (!providerToDelete) return;
    deleteMutation.mutate(
      { providerId: providerToDelete.id },
      {
        onSuccess: () => {
          setProviderToDelete(null);
        },
      },
    );
  };

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={20} />} color="red" title={t("messages.error")}>
          {t("messages.failedToLoad")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>{t("providers.pageTitle")}</Title>
          <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
            {t("actions.addProvider")}
          </Button>
        </Group>

        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder={t("filters.search")}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t("filters.status")}
            data={[
              { value: "healthy", label: t("status.healthy") },
              { value: "unhealthy", label: t("status.unhealthy") },
              { value: "unknown", label: t("status.unknown") },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 200 }}
          />
          <ActionIcon onClick={() => refetch()} loading={isLoading}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        {/* Provider Grid */}
        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Paper key={i} p="md" withBorder>
                <Stack gap="xs">
                  <Skeleton height={20} width={100} />
                  <Skeleton height={30} />
                  <Skeleton height={16} width={150} />
                  <Skeleton height={20} width={80} />
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        ) : filteredProviders && filteredProviders.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {filteredProviders.map((provider: AiProviderDetail) => (
              <ProviderCard
                key={provider.id}
                provider={provider as unknown as AiProviderDetail}
                onEdit={setEditProvider}
                onDelete={handleDelete}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text c="dimmed">{t("messages.noProviders")}</Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpen(true)}
              >
                {t("actions.addProvider")}
              </Button>
            </Stack>
          </Center>
        )}
      </Stack>

      {/* Create/Edit Modal would go here */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t("modals.addProvider")}
        size="lg"
      >
        {/* Form component would be implemented here */}
        <Text>{t("messages.formComingSoon")}</Text>
      </Modal>

      <Modal
        opened={!!editProvider}
        onClose={() => setEditProvider(null)}
        title={t("modals.editProvider")}
        size="lg"
      >
        {/* Form component would be implemented here */}
        <Text>{t("messages.formComingSoon")}</Text>
      </Modal>

      <Modal
        opened={!!providerToDelete}
        onClose={() => setProviderToDelete(null)}
        title={t("actions.remove")}
        size="sm"
      >
        <Stack gap="md">
          <Text>{t("messages.confirmDelete", { name: providerToDelete?.name ?? "" })}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setProviderToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button color="red" onClick={confirmDelete} loading={deleteMutation.isPending}>
              {t("actions.remove")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
