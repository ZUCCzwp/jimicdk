import { Alert } from "@heroui/react";
import { useI18n } from "@/i18n";

export function CredentialNotice() {
  const { t } = useI18n();
  return (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("security.title")}</Alert.Title>
        <Alert.Description>{t("security.body")}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
