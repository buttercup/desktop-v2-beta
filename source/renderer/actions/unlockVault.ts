import { ipcRenderer } from "electron";
import { VaultSourceID } from "buttercup";
import { getPrimaryPassword } from "./password";
import { setBusy } from "../state/app";
import { showError } from "../services/notifications";
import { logInfo } from "../library/log";
import { t } from "../../shared/i18n/trans";

export async function unlockVaultSource(sourceID: VaultSourceID): Promise<boolean> {
    const password = await getPrimaryPassword();
    if (!password) return false;
    setBusy(true);
    logInfo(`Unlocking source: ${sourceID}`);
    const unlockPromise = new Promise<void>((resolve, reject) => {
        ipcRenderer.once("unlock-source:reply", (evt, result) => {
            setBusy(false);
            const { ok, error } = JSON.parse(result) as {
                ok: boolean,
                error?: string
            };
            if (!ok) {
                showError(`${t("notification.error.vault-unlock-failed")}: ${error || t("notification.error.unknown-error")}`);
                return reject(new Error(`Failed unlocking vault: ${error}`));
            }
            resolve();
        });
    });
    ipcRenderer.send("unlock-source", JSON.stringify({
        sourceID,
        password
    }));
    await unlockPromise;
    logInfo(`Unlocked source: ${sourceID}`);
    return true;
}
