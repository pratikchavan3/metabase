import { t } from "ttag";

import { useUpdateDashboardMutation } from "metabase/api";
import { getErrorMessage } from "metabase/api/utils";
import {
  PaneHeaderInput,
  PanelHeaderTitle,
} from "metabase/common/data-studio/components/PaneHeader";
import { useMetadataToasts } from "metabase/common/hooks";
import { DASHBOARD_NAME_MAX_LENGTH } from "metabase/common/utils/dashboard";
import type { Dashboard } from "metabase-types/api";

import { useCanEditDashboard } from "../../hooks/use-can-edit-dashboard";

type DashboardNameProps = {
  dashboard: Pick<Dashboard, "id" | "name" | "can_write" | "archived">;
};

export function DashboardName({ dashboard }: DashboardNameProps) {
  const canEdit = useCanEditDashboard(dashboard);
  const [updateDashboard] = useUpdateDashboardMutation();
  const { sendSuccessToast, sendErrorToast } = useMetadataToasts();

  if (!canEdit) {
    return <PanelHeaderTitle>{dashboard.name}</PanelHeaderTitle>;
  }

  const handleChange = async (value: string) => {
    const name = value.trim();
    if (name.length === 0 || name === dashboard.name) {
      return false;
    }

    const { error } = await updateDashboard({ id: dashboard.id, name });
    if (error) {
      sendErrorToast(
        getErrorMessage(error, t`Failed to update dashboard name`),
      );
      return false;
    }

    sendSuccessToast(t`Dashboard name updated`);
    return true;
  };

  return (
    <PaneHeaderInput
      initialValue={dashboard.name}
      maxLength={DASHBOARD_NAME_MAX_LENGTH}
      data-testid="dashboard-name-input"
      onChange={handleChange}
    />
  );
}
